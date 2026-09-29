# StockArt Backend Progress

Tanggal pemeriksaan: 2026-09-26
Branch kerja: `main`
Commit basis terbaru: `1c16952` (`origin/main`)

## Ringkasan Status

| Anggota | Modul | Status | Catatan |
| --- | --- | --- | --- |
| Afiq | Fondasi Express, MongoDB Atlas, dan User schema | Selesai | Terhubung ke MongoDB Atlas Cloud. |
| Afiq | Register, bcrypt, login, JWT, dan middleware role | Selesai dengan Hardening Penuh | Register kasir sekarang wajib diotorisasi oleh role `pemilik` (mencegah pendaftaran kasir liar). |
| Afiq | Proteksi route Product, Transaction, dan Report | Selesai | Seluruh rute API terproteksi JWT & RBAC (`pemilik`/`kasir`). |
| Afiq | Seed script akun pemilik | Selesai | `scripts/seed.js` untuk membuat akun pemilik pertama. Aman dijalankan berulang kali. |
| Afiq | Pengujian RBAC dan HTTP Test | Selesai | 37 test lulus: 4 unit RBAC + 33 HTTP integration test (Auth, RBAC Register, Product, Transaction, Report, & Validasi Input). |
| Afiq | Dokumentasi API & Postman Collection | Selesai | `StockArt_API.postman_collection.json` v2.1 dan panduan `API_TESTING.md` siap pakai. |
| Afiq | Staging/deployment | Live 24/7 di Railway | Backend aktif 24 jam nonstop di `https://stockart-backend-production.up.railway.app` (Non-Vercel, No-CC). |
| Bgs | Product schema | Selesai | Mencakup nama, kode produk, kategori, harga, stok, satuan, stok minimum, deskripsi, dan status aktif. |
| Bgs | CRUD Product | Selesai | GET list, GET detail, POST, PUT, dan DELETE tersedia. POST/PUT/DELETE dibatasi untuk `pemilik`. |
| Bgs | Restock, low-stock, pencarian, dan filter | Dalam Pengerjaan | Menunggu filter query pencarian dan stok menipis. |
| Ocha | Transaction schema | Selesai | Schema transaksi sudah tersedia. |
| Ocha | Draft transaksi dan kalkulasi subtotal | Selesai | Validasi produk, jumlah, dan kalkulasi total sudah tersedia. |
| Ocha | Checkout dengan pemotongan stok | Implementasi selesai | Checkout atomik, validasi stok/produk aktif, rollback, dan snapshot harga. |
| Ocha | Riwayat, void, dan pengembalian stok | Implementasi selesai | Filter tanggal WIB/kasir/status; void atomik mempertahankan riwayat dan audit. |
| Izzy | Report dan aggregation | Selesai (Endpoint Terintegrasi) | Endpoint `/api/reports/summary`, `/api/reports/revenue`, dan `/api/reports/top-products` sudah selesai dan teruji. |

## Perubahan Afiq

- Menolak register tanpa nama, username, atau password.
- **Hardening Registrasi:** Membatasi endpoint `POST /api/auth/register` dengan middleware `protect, authorize('pemilik')` agar hanya pemilik toko yang dapat mendaftarkan akun kasir baru.
- Mengabaikan field `role` dari request register publik dan menetapkan role `kasir`.
- Menolak token dengan format Authorization yang tidak valid.
- Mengembalikan `401` jika user pada token sudah tidak ditemukan.
- Menambahkan fallback 404 dan global error handler melalui `app.js`.
- Memisahkan konfigurasi Express dari proses `listen` agar dapat diuji.
- Menambahkan `npm test` menggunakan Node test runner (37 tests).
- Menambahkan test unit RBAC untuk role `pemilik`, `kasir`, dan request tanpa user.
- Menambahkan `scripts/seed.js` untuk membuat akun `pemilik` pertama (aman dijalankan berulang kali; username/password dapat dikustomisasi via env).
- Menambahkan `test/http.test.js` — 33 HTTP integration test yang mencakup seluruh endpoint Auth, Product, Transaction, dan Report dengan token kasir dan pemilik, termasuk verifikasi RBAC (403, 401) dan auto-cleanup data test.
- Menambahkan `middleware/validate.js` — middleware validasi body request per endpoint dengan response error 400 yang deskriptif.
- Menambahkan `middleware/rateLimiter.js` — rate limiter auth (max 10 req/IP/15 menit) untuk mencegah brute-force.
- **Deploy Staging Production:** Backend live 24/7 di **Railway Cloud** (`https://stockart-backend-production.up.railway.app`) dan terhubung ke **MongoDB Atlas**.
- Menyiapkan `render.yaml`, GitHub Actions CI, dan konfigurasi `CORS_ORIGIN`.

## Validasi Terakhir

```text
npm test
37 tests passed, 0 failed
  4  unit test RBAC          (test/rbac.test.js)
  33 HTTP integration test   (test/http.test.js)
     - 20 RBAC & happy path (Auth, Product, Transaction, Report)
     -  9 validasi input gagal
     -  4 tes otorisasi register kasir baru oleh pemilik

node scripts/seed.js
Akun pemilik "pemilik" terverifikasi di database MongoDB Atlas

node --check index.js
node --check app.js
node --check controllers/authController.js
node --check middleware/authMiddleware.js
git diff --check
GitHub Actions workflow: .github/workflows/ci.yml
```

## Langkah Berikutnya

1. Bgs menyelesaikan restock, low-stock, pencarian, filter, dan pencegahan stok negatif.
2. Tim Afiq/Bgs/Ocha menjalankan penerimaan bersama menggunakan skenario di `TRANSACTION_API.md`.
3. Frontend mengintegrasikan kontrak transaksi dan menjalankan UAT sebelum code freeze.
4. Izzy menambahkan fitur ekspor PDF dan pengiriman email laporan otomatis (G6 No. 2).
5. Deploy Frontend ke Cloudflare Pages dan hubungkan ke backend Railway.
6. Konfigurasi custom domain (DomaiNesia) ke frontend dan backend.


## Pembaruan Ocha — 2026-09-29

- Memperketat validasi ObjectId, jumlah bulat aman, produk aktif, dan stok draf.
- Menggabungkan produk duplikat dan menyimpan snapshot nama/kode/harga pada struk.
- Menambahkan `/api/transactions/checkout` dengan transaksi MongoDB dan rollback;
  endpoint POST lama tetap menjadi alias.
- Menambahkan filter tanggal WIB, kasir, dan status pada riwayat transaksi.
- Void mempertahankan riwayat, mencatat pelaku/waktu, dan mengembalikan stok sekali.
  Transaksi lama tanpa pemotongan stok tidak menambah stok saat dibatalkan.
- Memperbarui dokumentasi kontrak frontend dan koleksi Postman.
- Validasi lokal: **48 tests passed, 0 failed**, memakai MongoDB replica set terpisah;
  mencakup rollback, checkout/void bersamaan, login kasir, RBAC, laporan, dan filter WIB.
- `git diff --check` bersih. UAT bersama Afiq/Bgs, penerimaan frontend, dan keputusan
  code freeze belum dilakukan; bukan bagian yang dapat dinyatakan selesai secara otomatis.
