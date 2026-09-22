# Form Pemindahan Billing Domain

Folder ini adalah proyek frontend Vercel dan backend Google Apps Script yang terpisah.

1. Buat Google Spreadsheet, lalu buka **Extensions > Apps Script**.
2. Tempel isi `Code.gs`, jalankan fungsi `setup`, lalu jalankan `setApiToken`. Setujui izin dan simpan token yang muncul di **Execution log**.
3. Deploy Apps Script sebagai **Web app**: Execute as **Me**, Who has access **Anyone**. Salin URL yang berakhir dengan `/exec`.
4. Deploy folder `form` ke Vercel. Di Vercel **Settings > Environment Variables**, isi `APPS_SCRIPT_URL` dengan URL `/exec` Apps Script dan `FORM_API_TOKEN` dengan token dari langkah 2. Redeploy setelah menambah environment variable.
5. Buka URL Vercel. Opsional: gunakan `?domain=contoh.com` untuk mengisi domain di halaman awal, misalnya `https://nama-proyek.vercel.app/?domain=contoh.com`.

Data tersimpan dalam dua sheet: `Domain Transfer Requests` untuk ringkasan permintaan dan `Domain Transfer Contacts` untuk empat data kontak. Jangan masukkan token di `index.html`.
