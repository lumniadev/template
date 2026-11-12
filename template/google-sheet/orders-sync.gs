/**
 * Store ⇄ Google Sheet order sync
 * ---------------------------------
 * 1. Create a new Google Sheet. Open Extensions → Apps Script.
 * 2. Delete everything there and paste this whole file.
 * 3. Fill in STORE_URL and SECRET below (copy both from your store: Admin → Store settings → Google Sheet).
 * 4. Click Run ▶ with the "setup" function selected and allow the permissions.
 * 5. Click Deploy → New deployment → type "Web app".
 *      Execute as: Me      Who has access: Anyone
 *    Copy the Web app URL and paste it in Admin → Store settings → Google Sheet. Save.
 *
 * New orders now appear in the "Orders" tab. Change the Status dropdown after you call
 * a customer, and the store updates too (and emails the customer if that's turned on).
 */

const STORE_URL = 'https://your-store.vercel.app' // ← your store address, no slash at the end
const SECRET = 'paste-the-secret-from-your-admin' // ← must match the store

const SHEET_NAME = 'Orders'
const HEADERS = ['Order number', 'Date', 'Status', 'Name', 'Phone', 'Email', 'Address', 'City', 'Items', 'Total', 'Notes']
const KEYS = ['number', 'date', 'status', 'name', 'phone', 'email', 'address', 'city', 'items', 'total', 'notes']
const STATUS_COL = 3 // column C
const STATUSES = ['Pending', 'Confirmed', 'No answer', 'Shipped', 'Delivered', 'Cancelled']
const COLORS = {
  Pending: '#e6f4ff', Confirmed: '#e8f7ee', 'No answer': '#fff4d6',
  Shipped: '#efeafc', Delivered: '#eef1f2', Cancelled: '#fdeceb',
}

/** Run once. Creates the Orders tab, the Status dropdown and the edit trigger. */
function setup() {
  const sheet = getSheet_()
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#f4fbfd')
  sheet.setFrozenRows(1)
  sheet.setColumnWidth(9, 260)
  sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm')
  sheet.getRange(2, 9, sheet.getMaxRows() - 1, 1).setWrap(true)
  sheet.getRange(2, STATUS_COL, sheet.getMaxRows() - 1, 1).setDataValidation(statusRule_())

  const ss = SpreadsheetApp.getActive()
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'onStatusEdit' })
    .forEach(function (t) { ScriptApp.deleteTrigger(t) })
  ScriptApp.newTrigger('onStatusEdit').forSpreadsheet(ss).onEdit().create()
  SpreadsheetApp.getActive().toast('Setup done. Now deploy this script as a web app.')
}

/** The store sends new orders and status changes here. */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    if (body.secret !== SECRET) return json_({ ok: false, error: 'Wrong secret — check SECRET in the Apps Script.' })
    if (body.action === 'ping') return json_({ ok: true })
    if (body.action !== 'upsert') return json_({ ok: false, error: 'Unknown action' })

    const lock = LockService.getScriptLock()
    lock.waitLock(20000)
    try {
      const sheet = getSheet_()
      const last = sheet.getLastRow()
      const numbers = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]) }) : []
      ;(body.orders || []).forEach(function (o) {
        const row = KEYS.map(function (k) {
          if (k === 'date' && o.date) return new Date(o.date) // shown in this spreadsheet's time zone
          return o[k] == null ? '' : String(o[k])
        })
        const i = numbers.indexOf(String(o.number))
        if (i >= 0) {
          sheet.getRange(i + 2, 1, 1, row.length).setValues([row])
          colorRow_(sheet, i + 2, o.status)
        } else {
          if (sheet.getLastRow() > 1) sheet.insertRowBefore(2) // newest orders on top
          const target = sheet.getRange(2, 1, 1, row.length)
          target.setValues([row]).setFontWeight('normal').setWrap(true).setVerticalAlignment('top')
          sheet.getRange(2, STATUS_COL).setDataValidation(statusRule_())
          colorRow_(sheet, 2, o.status)
          numbers.unshift(String(o.number))
        }
      })
    } finally {
      lock.releaseLock()
    }
    return json_({ ok: true })
  } catch (err) {
    return json_({ ok: false, error: String(err) })
  }
}

/** Runs when someone edits the sheet. Sends Status changes back to the store. */
function onStatusEdit(e) {
  const range = e.range
  const sheet = range.getSheet()
  if (sheet.getName() !== SHEET_NAME || range.getColumn() > STATUS_COL || range.getLastColumn() < STATUS_COL || range.getRow() < 2) return
  for (let r = range.getRow(); r <= range.getLastRow(); r++) {
    const number = sheet.getRange(r, 1).getValue()
    const status = sheet.getRange(r, STATUS_COL).getValue()
    if (!number || !status) continue
    colorRow_(sheet, r, status)
    const res = UrlFetchApp.fetch(STORE_URL + '/api/sheet', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ secret: SECRET, number: String(number), status: String(status) }),
      muteHttpExceptions: true,
    })
    if (res.getResponseCode() !== 200) {
      SpreadsheetApp.getActive().toast('Store did not accept the change for ' + number + ': ' + res.getContentText(), 'Sync problem', 8)
    }
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActive()
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME)
}

function statusRule_() {
  return SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build()
}

function colorRow_(sheet, row, status) {
  sheet.getRange(row, 1, 1, HEADERS.length).setBackground(COLORS[status] || null)
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
