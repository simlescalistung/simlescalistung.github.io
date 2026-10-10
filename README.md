# Aplikasi Manajemen Les Ahe & Ala

Aplikasi web untuk mengelola les baca (Ahe, Level 1–7) dan les berhitung (Ala, Level 1–16).

**Pengguna dan fitur**
- **Umum:** landing page dan formulir pendaftaran online.
- **Guru:** absen mengajar, yang sekaligus menjadi absen siswa.
- **Admin:**
  - Pendaftar, data siswa, level, buku, rehat dan lulus.
  - Guru, rekap kehadiran.
  - SPP dan kuitansi PDF.
  - Hari libur dengan prompt poster.
  - Editor landing page, piagam kelulusan.
  - Pengingat WhatsApp otomatis (Fonnte).

## Isi folder ini
```
index.html      Landing page + formulir pendaftaran + halaman kuitansi publik
app.html        Login & aplikasi Admin / Guru
css/style.css   Desain (warna utama mengikuti pengaturan admin)
js/config.js    ← ISI URL /exec Google Apps Script di sini
js/*.js         Logika aplikasi (jangan diubah)
assets/         Ikon situs
```
Backend (`Kode.gs`, `appsscript.json`) **tidak** ada di folder ini. Backend dipasang terpisah di Google Apps Script.

## Mulai
1. Pasang backend dan isi `js/config.js`. Ikuti **PANDUAN-INSTALASI.md** Bagian A–B.
2. Unggah folder ini ke GitHub Pages. Jalankan `git init` **di folder ini** (folder yang berisi `index.html`). Ikuti **PANDUAN-GITHUB.md**.
3. Login pertama di `.../app.html` dengan `admin` / `admin12345`. Anda akan diminta menggantinya.
4. (Disarankan) Jalankan `isiDataDemo` di editor Apps Script untuk mencoba semua fitur dengan data contoh. Setelah selesai, buka **Pengaturan → Mode Demo → Akhiri** agar data kembali kosong (PANDUAN-INSTALASI.md, D0).
5. Sambungkan WhatsApp lewat **PANDUAN-FONNTE.md**.

## Teknologi
- **Frontend:** HTML/CSS/JS murni (SPA) dengan *optimistic UI* dan antrean simpan offline.
- **Backend:** Google Apps Script REST API + Google Sheets, dengan CacheService dan penulisan per-batch.
- **Pustaka:** Chart.js, jsPDF, SheetJS. Ketiganya dimuat dari CDN hanya saat diperlukan.
