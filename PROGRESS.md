# StockArt Backend Progress

Tanggal pemeriksaan: 2026-09-29
Branch kerja: `main`
Commit basis terbaru: `366a3cf` (`origin/main`)

## Ringkasan Status

| Anggota | Modul | Status | Catatan |
| --- | --- | --- | --- |
| Afiq | Fondasi Express, MongoDB Atlas, dan User schema | Selesai | Terhubung ke MongoDB Atlas Cloud. |
| Afiq | Register, bcrypt, login, JWT, dan middleware role | Selesai dengan Hardening Penuh | Register kasir wajib diotorisasi oleh role `pemilik` (mencegah pendaftaran kasir liar). |
| Afiq | Proteksi route Product, Transaction, dan Report | Selesai | Seluruh rute API terproteksi JWT & RBAC (`pemilik`/`kasir`). |
| Afiq | Seed script akun pemilik | Selesai | `scripts/seed.js` untuk membuat akun pemilik pertama. Aman dijalankan berulang kali. |
| Afiq | Pengujian RBAC dan HTTP Test | Selesai | 37 test awal lulus: 4 unit RBAC + 33 HTTP integration test (Auth, Product, Transaction, Report). |
| Afiq | Dokumentasi API & Postman Collection | Selesai | `StockArt_API.postman_collection.json` v2.1 dan panduan `API_TESTING.md` siap pakai. |
| Afiq | Staging/deployment | Live 24/7 di Railway | Backend aktif 24 jam nonstop di `https://stockart-backend-production.up.railway.app` (Non-Vercel, No-CC). |
| Bgs | Product schema | Selesai | Mencakup nama, kode produk, kategori, harga beli, harga jual, stok, satuan, stok minimum, deskripsi, dan status aktif. |
| Bgs | CRUD Product & Soft Delete | Selesai | GET list, GET detail, POST, PUT, DELETE (RBAC Pemilik). Mendukung soft delete (nonaktifkan), restore (PATCH), dan permanent delete (?permanent=true). |
| Bgs | Restock, low-stock, pencarian, dan filter | Selesai | `PATCH /:id/restock`, `GET /low-stock`, filter regex pencarian/kategori, barcode match, dan seeder produk lengkap. |
| Ocha | Transaction schema & Draft | Selesai | Schema transaksi dengan snapshot struk, kalkulasi subtotal/total belanjaan sementara tanpa memotong stok. |
| Ocha | Checkout dengan pemotongan stok | Selesai | Checkout atomik (MongoDB session transaction & rollback), validasi stok/produk aktif, dan guard concurrency. |
| Ocha | Riwayat, void, dan pengembalian stok | Selesai | Filter tanggal WIB/kasir/status; void atomik mengembalikan stok sekali, audit pembatal & waktu pembatalan. |
| Izzy | Report dan aggregation | Selesai (Endpoint Terintegrasi) | Endpoint `/api/reports/summary`, `/api/reports/revenue`, dan `/api/reports/top-products` siap konsumsi chart/grafik. |

## Perubahan Afiq

- Menolak register tanpa nama, username, atau password.
- **Hardening Registrasi:** Membatasi endpoint `POST /api/auth/register` dengan middleware `protect, authorize('pemilik')` agar hanya pemilik toko yang dapat mendaftarkan akun kasir baru.
- Mengabaikan field `role` dari request register publik dan menetapkan role `kasir`.
- Menolak token dengan format Authorization yang tidak valid.
- Mengembalikan `401` jika user pada token sudah tidak ditemukan.
- Menambahkan fallback 404 dan global error handler melalui `app.js`.
- Memisahkan konfigurasi Express dari proses `listen` agar dapat diuji.
- Menambahkan `npm test` menggunakan Node test runner.
- Menambahkan test unit RBAC untuk role `pemilik`, `kasir`, dan request tanpa user.
- Menambahkan `scripts/seed.js` untuk membuat akun `pemilik` pertama (aman dijalankan berulang kali; username/password dapat dikustomisasi via env).
- Menambahkan `test/http.test.js` — 33 HTTP integration test yang mencakup seluruh endpoint Auth, Product, Transaction, dan Report dengan token kasir dan pemilik, termasuk verifikasi RBAC (403, 401) dan auto-cleanup data test.
- Menambahkan `middleware/validate.js` — middleware validasi body request per endpoint dengan response error 400 yang deskriptif.
- Menambahkan `middleware/rateLimiter.js` — rate limiter auth (max 10 req/IP/15 menit) untuk mencegah brute-force.
- **Deploy Staging Production:** Backend live 24/7 di **Railway Cloud** (`https://stockart-backend-production.up.railway.app`) dan terhubung ke **MongoDB Atlas**.
- Menyiapkan `render.yaml`, GitHub Actions CI, dan konfigurasi `CORS_ORIGIN`.

## Perubahan Bgs (Stock & Catalog)

- **Schema Produk:** Menyusun schema produk mencakup `nama`, `kodeProduk` (unique), `kategori`, `hargaBeli`, `hargaJual`, `stok`, `satuan`, `stokMinimum`, `deskripsi`, dan `aktif` di `models/Product.js`.
- **CRUD Produk:** Endpoint `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, dan `DELETE /api/products/:id`. Akses mutasi dibatasi khusus role `pemilik`.
- **Soft Delete (Nonaktifkan Produk):** Endpoint `DELETE /api/products/:id` secara default melakukan soft delete dengan mengubah status menjadi `aktif: false` (respon: `"Produk berhasil dinonaktifkan"`), sehingga menjaga integritas riwayat transaksi masa lalu.
- **Opsi Hapus Permanen:** Menambahkan opsi penghapusan fisik dari MongoDB jika menyertakan query parameter `?permanent=true` (respon: `"Produk berhasil dihapus"`).
- **Fitur Restore Produk:** Menambahkan endpoint `PATCH /api/products/:id/restore` khusus pemilik untuk mengaktifkan kembali produk yang telah dinonaktifkan (`aktif: true`).
- **Filter Katalog Aktif:** `GET /api/products` secara default hanya menampilkan produk aktif di katalog toko, serta mendukung query parameter `?aktif=all` (semua status) dan `?aktif=false` (hanya produk dinonaktifkan). Endpoint `GET /api/products/low-stock` juga difilter hanya untuk produk aktif.
- **Pencarian & Barcode:** Menambahkan pencarian fleksibel berbasis nama/kode produk (`search`), kategori (`kategori`), dan exact match untuk alat barcode scanner (`barcode`) pada endpoint `GET /api/products`.
- **Peringatan Stok Menipis:** Menambahkan endpoint `GET /api/products/low-stock` menggunakan ekspresi query `$expr: { $lte: ['$stok', '$stokMinimum'] }` dengan urutan stok terendah.
- **Fungsi Restock:** Menambahkan endpoint `PATCH /api/products/:id/restock` dengan operator `$inc` dan validasi jumlah bilangan positif minimal 1.
- **Validasi & Integritas Stok:** Menambahkan validasi `productRules`, `productUpdateRules`, dan `restockRules` di `middleware/validate.js` serta constraint schema `min: [0]` guna mencegah stok bernilai negatif.
- **Katalog Seeding:** Menambahkan `scripts/seedProducts.js` berisi 30+ sampel produk toko kelontong (Sembako, Minuman, Cemilan, Kebersihan & Perawatan Diri, Alat Tulis) lengkap dengan sampel produk stok menipis untuk demo.

## Pembaruan Ocha (Transaction)

- Memperketat validasi ObjectId, jumlah bulat aman, produk aktif, dan stok draf.
- Menggabungkan produk duplikat dan menyimpan snapshot nama/kode/harga pada struk.
- Menambahkan `/api/transactions/checkout` dengan transaksi MongoDB dan rollback; endpoint `POST /api/transactions` tetap menjadi alias.
- Menambahkan filter tanggal WIB, kasir, dan status pada riwayat transaksi (`GET /api/transactions`).
- Void mempertahankan riwayat, mencatat pelaku/waktu, dan mengembalikan stok sekali via `PATCH /api/transactions/:id/void`. Transaksi lama tanpa pemotongan stok tidak menambah stok saat dibatalkan.
- Memperbarui dokumentasi kontrak frontend di `TRANSACTION_API.md` dan koleksi Postman.
- Menambahkan test suite `test/transaction.test.js` mencakup rollback, checkout/void bersamaan, validasi stok, dan filter tanggal WIB.

## Perubahan Izzy (Report)

- Menambahkan endpoint statistik ringkas `GET /api/reports/summary` (total produk, total transaksi selesai, total omzet) dengan filter rentang tanggal.
- Menambahkan query agregasi omzet harian `GET /api/reports/revenue` (`$dateToString: '%Y-%m-%d'`) untuk visualisasi grafik tren penjualan.
- Menambahkan query produk terlaris `GET /api/reports/top-products` (`$unwind`, `$group`, `$sort: { totalTerjual: -1 }`, `$limit: 5`) dengan nama produk, kuantitas terjual, dan total omzet per produk.
- Mengamankan seluruh rute laporan dengan RBAC khusus role `pemilik` di `routes/reportRoutes.js`.

## Validasi & Test Suite

```text
npm test
  - 4  unit test RBAC          (test/rbac.test.js)
  - 33 HTTP integration test   (test/http.test.js)
  - 11 E2E Transaction test    (test/transaction.test.js)
     Total: 48 tests passed, 0 failed

node scripts/seed.js
  Akun pemilik "pemilik" terverifikasi di database MongoDB Atlas

node scripts/seedProducts.js
  30+ produk katalog toko kelontong berhasil di-seed ke database

node --check index.js
node --check app.js
node --check controllers/productController.js
node --check controllers/transactionController.js
node --check controllers/reportController.js
git diff --check
```

## Langkah Berikutnya

1. **Integrasi Frontend:** Tim Frontend menghubungkan UI ke endpoint backend (mengacu pada `TRANSACTION_API.md` dan `StockArt_API.postman_collection.json`).
2. **UAT Bersama:** Tim (Afiq, Bgs, Ocha, Izzy) menjalankan skenario pengujian alur penuh: login -> katalog/barcode scan -> keranjang & checkout -> potongan stok & struk -> laporan ringkasan/omzet -> void transaksi.
3. **Deploy Frontend:** Menghubungkan frontend ke backend Railway (`https://stockart-backend-production.up.railway.app`).
4. **Code Freeze & Persiapan Demo:** Finalisasi kode demo sebelum batas waktu pengumpulan.
