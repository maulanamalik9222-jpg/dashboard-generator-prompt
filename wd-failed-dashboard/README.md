# WD Failed Dashboard

Dashboard mobile-first untuk mengelola withdrawal (WD) FAILED/REFUND.

## Arsitektur
- Frontend: HTML/CSS/JS ringan di Cloudflare Workers Static Assets
- Backend: Cloudflare Worker API
- Database: Cloudflare D1 (SQLite)
- Source code: GitHub
- Tidak memakai framework berat agar cepat di HP

## Fitur MVP
- Import/paste banyak baris dari tabel sistem WD
- Parser TSV/CSV otomatis
- Deduplicate berdasarkan `ref`
- Pencarian utama berdasarkan nomor rekening
- Filter status
- Detail transaksi
- Update status proses: FAILED, DIPROSES, CAIR, REFUND, CANCEL
- Catatan dan staff processor
- Copy format transaksi untuk ditempel ke sistem/Docs
- Statistik ringkas
- Audit log perubahan status
- Responsive mobile

## Struktur
```text
wd-dashboard/
├─ public/
│  ├─ index.html
│  ├─ app.js
│  └─ style.css
├─ src/
│  └─ worker.js
├─ schema.sql
├─ wrangler.toml
├─ package.json
└─ README.md
```

## 1. Buat database D1

Setelah login Cloudflare:
```bash
npx wrangler d1 create wd-dashboard-db
```

Salin `database_id` yang diberikan ke `wrangler.toml`.

Lalu:
```bash
npx wrangler d1 execute wd-dashboard-db --remote --file=schema.sql
```

## 2. Atur API key staff

Generate random key panjang. Contoh PowerShell:
```powershell
[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
```

Simpan sebagai secret:
```bash
npx wrangler secret put STAFF_API_KEY
```

Frontend akan meminta API key pertama kali dibuka. Key disimpan hanya di browser staff.

## 3. Jalankan lokal
```bash
npm install
npm run dev
```

## 4. Deploy
```bash
npm run deploy
```

## Import data
Staff dapat copy tabel FAILED dari sistem lalu paste ke kotak Import. Parser membaca TSV/CSV.

Urutan kolom yang didukung:
`No, Date, Amount, Bank Code, Bank Name, Bank No, Account Name, Ref, Vendor Id, Status, Datetime, Balance revert`

Kolom `User ID` tidak digunakan.

## Catatan
Untuk produksi, sebaiknya gunakan authentication/SSO Cloudflare Access agar akses dashboard hanya untuk staff. API key pada MVP adalah pengaman awal, bukan pengganti identity management.
