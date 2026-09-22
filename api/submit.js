// Vercel Serverless Function: keeps the Apps Script URL and token off the browser.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method tidak diizinkan.' });
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  const token = process.env.FORM_API_TOKEN;
  if (!scriptUrl || !token) return res.status(500).json({ success: false, message: 'Konfigurasi server belum lengkap.' });
  try {
    const body = new URLSearchParams({ token, payload: JSON.stringify(req.body || {}) });
    const upstream = await fetch(scriptUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, redirect: 'follow' });
    const text = await upstream.text();
    const result = JSON.parse(text);
    return res.status(upstream.ok ? 200 : 502).json(result);
  } catch (error) {
    return res.status(502).json({ success: false, message: 'Backend verifikasi tidak dapat dihubungi.' });
  }
};
