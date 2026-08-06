# Dashboard Generator Prompt Konten

Dashboard web untuk membuat prompt desain postingan:

- Postingan kemenangan
- Postingan syair
- Postingan prediksi
- Pengumuman perubahan jadwal pasaran

## Fitur

- Prompt berubah otomatis mengikuti isi form
- Tombol salin prompt
- Riwayat prompt tersimpan di browser (`localStorage`)
- Desain responsif untuk desktop dan ponsel
- Tema premium emerald, cyan, dan gold
- Tidak memerlukan database

## Menjalankan di komputer

Pastikan Node.js versi 22 atau lebih baru sudah terpasang.

```bash
npm install
npm run dev
```

Buka alamat lokal yang muncul di terminal.

## Mengunggah ke GitHub

1. Buat repository kosong baru di GitHub, misalnya `dashboard-generator-prompt`.
2. Jangan centang pembuatan README, `.gitignore`, atau license di GitHub.
3. Buka terminal di folder proyek ini.
4. Jalankan perintah berikut dan ganti `USERNAME` dengan username GitHub Anda:

```bash
git init
git add .
git commit -m "Dashboard generator prompt pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/dashboard-generator-prompt.git
git push -u origin main
```

Jika GitHub meminta login, gunakan browser login atau Personal Access Token, bukan password akun.

## Membuat versi produksi

```bash
npm run build
npm run start
```

## File utama yang dapat diedit

- `app/page.tsx` — seluruh fungsi dashboard, form, dan template prompt
- `app/globals.css` — warna, tampilan, layout, dan responsif
- `app/layout.tsx` — judul situs dan pengaturan halaman global

Untuk mengubah nilai awal form, edit objek `initial` di `app/page.tsx`. Untuk mengubah struktur hasil prompt, edit bagian `const prompt` pada file yang sama.
