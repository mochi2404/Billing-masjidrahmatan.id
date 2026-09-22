/** Google Apps Script backend untuk Form Pemindahan Billing Domain. */
const CONFIG = {
  SPREADSHEET_ID: '', // Isi bila project Apps Script standalone. Kosong bila terikat ke Spreadsheet.
  TIMEZONE: 'Asia/Jakarta',
  REQUEST_SHEET: 'Domain Transfer Requests',
  CONTACT_SHEET: 'Domain Transfer Contacts'
};

const REQUEST_HEADERS = ['Submission ID', 'Submitted At', 'Domain', 'Status', 'Source'];
const CONTACT_HEADERS = ['Submission ID', 'Contact Type', 'First Name', 'Last Name', 'Company Name', 'Email Address', 'Address 1', 'Address 2', 'City', 'State', 'Postcode', 'Phone Number', 'Fax Number'];

function doGet() {
  return json_({ success: true, message: 'Domain Transfer API aktif.' });
}

function doPost(e) {
  try {
    const expectedToken = PropertiesService.getScriptProperties().getProperty('FORM_API_TOKEN');
    const token = String(e.parameter.token || '');
    if (!expectedToken || token !== expectedToken) return json_({ success: false, message: 'Akses tidak sah.' });
    const payload = JSON.parse(e.parameter.payload || '{}');
    normalizeAutoCopy_(payload);
    validatePayload_(payload);
    const id = saveSubmission_(payload);
    return json_({ success: true, submissionId: id, message: 'Data berhasil diterima.' });
  } catch (error) {
    console.error(error);
    return json_({ success: false, message: error.message || 'Data tidak dapat diproses.' });
  }
}

function setup() {
  const ss = spreadsheet_();
  ensureSheet_(ss, CONFIG.REQUEST_SHEET, REQUEST_HEADERS);
  ensureSheet_(ss, CONFIG.CONTACT_SHEET, CONTACT_HEADERS);
  Logger.log('Database siap: ' + ss.getUrl());
}

function setApiToken() {
  // Jalankan sekali, lalu salin nilai dari Execution log ke FORM_API_TOKEN di Vercel.
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('FORM_API_TOKEN', token);
  Logger.log('FORM_API_TOKEN: ' + token);
}

function saveSubmission_(payload) {
  const ss = spreadsheet_();
  const requestSheet = ensureSheet_(ss, CONFIG.REQUEST_SHEET, REQUEST_HEADERS);
  const contactSheet = ensureSheet_(ss, CONFIG.CONTACT_SHEET, CONTACT_HEADERS);
  const id = 'TRF-' + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss') + '-' + Math.floor(100 + Math.random() * 900);
  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  requestSheet.appendRow([id, now, clean_(payload.domain), 'Menunggu Verifikasi', 'Vercel Form']);
  const order = ['registrant', 'technical', 'billing', 'admin'];
  const labels = { registrant: 'Registrant', technical: 'Technical', billing: 'Billing', admin: 'Admin' };
  const rows = order.map(function(type) {
    const c = payload.contacts[type];
    return [id, labels[type], clean_(c.firstName), clean_(c.lastName), clean_(c.companyName), clean_(c.email), clean_(c.address1), clean_(c.address2), clean_(c.city), clean_(c.state), clean_(c.postcode), clean_(c.phone || c.phoneNumber), clean_(c.fax || c.faxNumber)];
  });
  contactSheet.getRange(contactSheet.getLastRow() + 1, 1, rows.length, CONTACT_HEADERS.length).setValues(rows);
  return id;
}

function validatePayload_(payload) {
  if (!payload || !payload.contacts || !String(payload.domain || '').trim()) throw new Error('Domain dan data kontak wajib dikirim.');
  ['registrant', 'technical', 'billing', 'admin'].forEach(function(type) {
    const c = payload.contacts[type];
    if (!c) throw new Error('Data ' + type + ' belum lengkap.');
    ['firstName', 'lastName', 'email', 'address1', 'city', 'state', 'postcode', 'phone'].forEach(function(field) {
      if (!String(c[field] || '').trim()) throw new Error('Kolom wajib pada kontak ' + type + ' belum lengkap.');
    });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email))) throw new Error('Email ' + type + ' tidak valid.');
  });
}

// Defense in depth: when frontend auto-copy is active, the server uses the
// Registrant record as the only source for the other three contact records.
function normalizeAutoCopy_(payload) {
  if (!payload || !payload.autoCopy || !payload.contacts || !payload.contacts.registrant) return;
  ['technical', 'billing', 'admin'].forEach(function(type) {
    payload.contacts[type] = Object.assign({}, payload.contacts.registrant);
  });
}

function spreadsheet_() { return CONFIG.SPREADSHEET_ID ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet(); }
function ensureSheet_(ss, name, headers) { let sheet = ss.getSheetByName(name); if (!sheet) sheet = ss.insertSheet(name); if (sheet.getLastRow() === 0) { sheet.appendRow(headers); sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#dbeafe'); sheet.setFrozenRows(1); } return sheet; }
function clean_(value) { return String(value || '').trim(); }
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
