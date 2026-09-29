# StockArt Backend API

> **Sistem Kasir (Point of Sale) & Manajemen Inventaris Berbasis Web**  
> Proyek Tugas Akhir Mata Kuliah Pengembangan Aplikasi Web (PAW) — Milestone 1  
> Studi Kasus: **Toko Kelontong "Berkah" (User Story 5)**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5-black.svg?logo=express)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Database-forestgreen.svg?logo=mongodb)](https://www.mongodb.com/atlas)
[![Railway](https://img.shields.io/badge/Railway-Deployed-0B0D0E.svg?logo=railway)](https://stockart-backend-production.up.railway.app)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)]()

---

## 1. Deskripsi Aplikasi

**StockArt** adalah aplikasi kasir (*Point of Sale* / POS) dan manajemen inventaris modern berbasis web yang dirancang khusus untuk memodernisasi operasional harian **Toko Kelontong "Berkah"**. Aplikasi ini menyelesaikan permasalahan pencatatan manual, ketidaksesuaian stok barang dagangan, risiko *human-error* saat kalkulasi kasir, serta ketiadaan analisis omzet penjualan secara berkala.

Repositori ini berfokus pada **StockArt Backend**, yaitu fondasi server penyedia layanan **RESTful API** yang aman, tangguh, dan terukur. Layanan backend ini bertanggung jawab atas:
- **Autentikasi & Otorisasi Pengguna:** Pengelolaan sesi stateless berbasis JSON Web Token (JWT) yang diperkuat dengan *Role-Based Access Control* (RBAC) antara peran `pemilik` dan `kasir`. Registrasi kasir baru wajib diotorisasi oleh pemilik untuk mencegah pendaftaran liar.
- **Katalog & Manajemen Stok Terintegrasi:** CRUD produk, pelacakan stok masuk (*restock*), peringatan dini stok menipis (*low-stock warning*), pencarian fleksibel nama/kategori/barcode scanner, serta dukungan *soft delete* untuk menjaga integritas data masa lalu.
- **Pemrosesan Transaksi Atomik:** Pencatatan struk belanja, snapshot harga produk saat transaksi, kalkulasi subtotal, pemotongan stok otomatis secara atomik (*ACID transaction session* di MongoDB), serta pembatalan transaksi (*void*) yang aman dan mengembalikan stok secara terkontrol.
- **Analisis & Laporan Bisnis:** Agregasi omzet harian, ringkasan performa penjualan berdasarkan rentang tanggal, dan peringkat produk terlaris (*top products*) untuk membantu pemilik toko mengambil keputusan strategis.

---

## 2. Tim Pengembang & Pembagian Tugas

**Nama Kelompok:** Kelompok PAW — Toko Kelontong Berkah  

| No | Nama Anggota | NIM | Peran / Pembagian Tugas |
|:--:|:---|:---:|:---|
| 1 | **Afiq** | *[Isi NIM]* | **, Auth, Security & DevOps**<br>• Arsitektur Express & inisialisasi MongoDB Atlas<br>• Autentikasi JWT, hashing password Bcrypt, dan RBAC (`pemilik`/`kasir`)<br>• Hardening keamanan (Rate Limiter, validasi input body, CORS)<br>• Seeder akun awal (`seed.js`), HTTP integration test, dan deployment ke Railway |
| 2 | **Bagas** | *24/544718/TK/60547* | **Product & Inventory Module**<br>• Mongoose Schema Produk (`Product.js`) & constraint data<br>• RESTful API CRUD produk, pencarian filter, kategori, dan barcode scanner<br>• Mekanisme *Soft Delete* & *Restore* produk serta opsi *hard delete*<br>• Endpoint *Restock* penambahan stok dan filter *low-stock alerts*<br>• Seeder katalog produk toko kelontong (`seedProducts.js`) |
| 3 | **Ocha** | *[Isi NIM]* | **Transaction & POS Flow Module**<br>• Mongoose Schema Transaksi (`Transaction.js`) & snapshot harga item<br>• Endpoint draf belanja, validasi stok, dan kalkulasi subtotal otomatis<br>• Transaksi atomik MongoDB session (pemotongan stok aman saat checkout)<br>• Mekanisme pembatalan (*void*) transaksi atomik dan pengembalian stok<br>• Suite pengujian transaksi (`transaction.test.js`) & dokumentasi kontrak transaksi |
| 4 | **Izzy** | *[Isi NIM]* | **Report & Analytics Module**<br>• Perancangan pipeline MongoDB Aggregation untuk laporan bisnis<br>• Endpoint ringkasan performa penjualan & omzet (`/api/reports/summary`)<br>• Agregasi tren pendapatan harian (`/api/reports/revenue`) untuk visualisasi grafik<br>• Agregasi produk terlaris (`/api/reports/top-products`) dengan metrik kuantitas & omzet<br>• Proteksi RBAC khusus peran `pemilik` pada seluruh rute laporan |

---

## 3. Struktur Folder dan File Proyek

Berikut adalah diagram pohon (*ASCII directory tree*) struktur direktori backend StockArt beserta rincian fungsi tiap komponen arsitektural:

```text
stockart-backend/
├── config/
│   └── db.js                    # Konfigurasi koneksi database MongoDB Atlas via Mongoose
├── controllers/
│   ├── authController.js        # Logika login, registrasi kasir terotorisasi, dan get current user profile
│   ├── productController.js     # Logika CRUD produk, restock, low-stock, pencarian barcode, dan soft-delete
│   ├── reportController.js      # Pipeline agregasi laporan omzet harian, summary, dan produk terlaris
│   └── transactionController.js # Handler checkout transaksi, riwayat transaksi kasir/pemilik, dan void struk
├── middleware/
│   ├── authMiddleware.js        # Middleware verifikasi token JWT (protect) dan hak akses peran (authorize)
│   ├── rateLimiter.js           # Middleware pencegah serangan brute-force pada endpoint autentikasi
│   └── validate.js              # Middleware validasi skema dan sanitasi body request sebelum ke controller
├── models/
│   ├── Product.js               # Mongoose schema produk (stok, harga beli/jual, barcode, status aktif)
│   ├── Transaction.js           # Mongoose schema transaksi (daftar item, total, nominal bayar, kembalian, status)
│   └── User.js                  # Mongoose schema pengguna toko (nama, username, password ter-hash, role)
├── routes/
│   ├── authRoutes.js            # Routing endpoint otentikasi (/api/auth)
│   ├── productRoutes.js         # Routing endpoint katalog produk (/api/products)
│   ├── reportRoutes.js          # Routing endpoint analisis & pelaporan bisnis (/api/reports)
│   └── transactionRoutes.js     # Routing endpoint kasir & checkout (/api/transactions)
├── scripts/
│   ├── seed.js                  # Script inisialisasi akun pemilik default (idempotent / aman dijalankan ulang)
│   └── seedProducts.js          # Script pengisian 30+ data sampel produk toko kelontong (sembako, dsb.)
├── services/
│   └── transactionService.js    # Business logic transaksi atomik MongoDB session (checkout & void with rollback)
├── test/
│   ├── http.test.js             # HTTP Integration test komprehensif seluruh endpoint (Auth, RBAC, CRUD, Report)
│   ├── rbac.test.js             # Unit test fungsional middleware otorisasi RBAC (pemilik vs kasir)
│   └── transaction.test.js      # Unit test transaksi atomik, rollback, void, dan pemotongan stok
├── .env.example                 # Template variabel lingkungan (Environment Variables)
├── .gitignore                   # Daftar file dan direktori yang diabaikan oleh Git
├── API_TESTING.md               # Panduan pengujian manual API menggunakan cURL
├── app.js                       # Konfigurasi Express app, CORS, parsing JSON, rute, dan global error handler
├── index.js                     # Entry point server (koneksi database dan inisialisasi HTTP server listen)
├── package.json                 # Metadata proyek, dependensi npm, dan script runner (start, dev, test)
├── PROGRESS.md                  # Log kemajuan pengerjaan teknis modul setiap anggota tim
├── README.md                    # Dokumentasi utama proyek backend
├── render.yaml                  # Konfigurasi infrastruktur alternatif deployment (Render)
├── StockArt_API.postman_collection.json # Koleksi pengujian Postman API v2.1 lengkap dengan skrip token otomatis
└── TRANSACTION_API.md           # Panduan spesifikasi dan kontrak integrasi transaksi untuk Frontend
```

---

## 4. Teknologi yang Digunakan

Aplikasi backend ini dikembangkan dengan tumpukan teknologi modern yang mengedepankan performa, konsistensi data, dan keamanan:

| Komponen | Teknologi | Keterangan & Rationale |
|:---|:---|:---|
| **Runtime Environment** | **Node.js (v18+)** | Lingkungan eksekusi JavaScript server-side asinkron berbasis event-driven V8 engine. |
| **Web Framework** | **Express.js (v5)** | Framework web minimalis dan fleksibel untuk routing RESTful API dan manajemen middleware. |
| **Database & ODM** | **MongoDB Atlas & Mongoose (v9)** | Cloud NoSQL database berbasis kluster replica-set yang mendukung transaksi multi-dokumen ACID atomik, diakses melalui Mongoose Object Data Modeling. |
| **Stateless Authentication** | **JSON Web Token (jsonwebtoken v9)** | Penyedia token akses berjangka waktu (bearer token) untuk memvalidasi identitas pengguna pada setiap request. |
| **Password Hashing** | **Bcrypt.js (v3)** | Enkripsi satu arah dengan *salt rounds* untuk melindungi kata sandi pengguna di basis data. |
| **API Security & Limiter** | **Express-Rate-Limit & CORS** | Pembatasan beban request (anti brute-force) serta kontrol kebijakan pembagian sumber daya lintas domain (*Cross-Origin Resource Sharing*). |
| **Automated Testing** | **Node.js Built-in Test Runner (`node --test`)** | Pengujian unit dan integrasi native tanpa overhead dependensi eksternal, mencakup pengujian RBAC, REST API, dan transaksi atomik. |
| **Platform Deployment** | **Railway Cloud** | Platform PaaS modern untuk hosting server backend live 24/7 dengan dukungan environment variables terenkripsi. |

---

## 5. Tautan Dokumen Laporan (Milestone 1)

Laporan lengkap Tugas Akhir Milestone 1 mencakup analisis kebutuhan sistem, spesifikasi API, perancangan database, serta dokumentasi pengujian dapat diakses melalui tautan Google Drive berikut:

🔗 **Google Drive Laporan Milestone 1:**  
[**Dokumen Laporan Milestone 1 — StockArt (Google Docs)**](https://docs.google.com/document/d/1rUfcUpfr8B4z9RHyZvWftt7V0eCu8C3IxLhTlQwGSjY/edit?usp=sharing)

> **Catatan Akses Dokumen:**  
> Tautan di atas telah diatur dengan hak akses publik (*"Anyone with the link can view"* / *"Siapa saja yang memiliki link dapat melihat"*).

---

## 6. Live Deployment & Akses API

Server backend telah berhasil di-deploy ke lingkungan produksi (PaaS Railway Cloud) dan aktif melayani request selama 24 jam nonstop:

- **Base URL Server Produksi:**  
  [`https://stockart-backend-production.up.railway.app`](https://stockart-backend-production.up.railway.app)
- **Health Check Endpoint:**  
  `GET https://stockart-backend-production.up.railway.app/`  
  *(Mengembalikan status server aktif beserta tautan dokumentasi)*

---

## 7. Panduan Instalasi & Menjalankan di Lokal (*Local Setup*)

Ikuti langkah-langkah di bawah ini untuk menjalankan server backend StockArt di komputer lokal:

### Prasyarat Sistem
- **Node.js**: Versi 18.0.0 atau lebih tinggi ([Unduh Node.js](https://nodejs.org/))
- **Git**: Terpasang pada terminal
- **MongoDB**: Kluster MongoDB Atlas Cloud aktif (atau MongoDB Replica Set lokal untuk mendukung fitur transaksi atomik)

### Langkah Instalasi

1. **Clone Repositori:**
   ```bash
   git clone https://github.com/AfiqMir/stockart-backend.git
   cd stockart-backend
   ```

2. **Pasang Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin berkas `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka berkas `.env` dan sesuaikan nilainya:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/stockart?retryWrites=true&w=majority
   JWT_SECRET=rahasia-kunci-jwt-anda-yang-sangat-panjang-dan-acak
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Inisialisasi Data Default (Seeding):**
   Jalankan script seeder untuk membuat akun pemilik awal dan sampel katalog produk toko kelontong:
   ```bash
   # 1. Buat akun pemilik awal (username: pemilik, password: gantidulu123)
   node scripts/seed.js

   # 2. Isi katalog 30+ sampel produk toko kelontong
   node scripts/seedProducts.js
   ```

5. **Menjalankan Pengujian Otomatis (Automated Testing):**
   Pastikan seluruh test suite lulus pengujian:
   ```bash
   npm test
   ```

6. **Menjalankan Server Pengembangan:**
   ```bash
   npm run dev
   ```
   Server akan aktif di `http://localhost:5000`.

---

## 8. Ringkasan Endpoint Utama & Postman Collection

| Modul | Method | Endpoint | Otorisasi | Deskripsi |
|:---|:---:|:---|:---:|:---|
| **Auth** | `POST` | `/api/auth/login` | Publik | Login pengguna & mendapatkan token JWT |
| | `POST` | `/api/auth/register` | Pemilik | Pendaftaran akun kasir baru (diproteksi) |
| | `GET` | `/api/auth/me` | Kasir / Pemilik | Mendapatkan profil akun yang sedang login |
| **Produk** | `GET` | `/api/products` | Kasir / Pemilik | Katalog produk aktif (dukung search, kategori, barcode) |
| | `GET` | `/api/products/low-stock` | Kasir / Pemilik | Daftar produk dengan stok di bawah batas minimum |
| | `GET` | `/api/products/:id` | Kasir / Pemilik | Detail produk berdasarkan ID |
| | `POST` | `/api/products` | Pemilik | Menambahkan produk baru |
| | `PUT` | `/api/products/:id` | Pemilik | Memperbarui informasi produk |
| | `PATCH` | `/api/products/:id/restock` | Pemilik | Menambah jumlah stok barang masuk |
| | `DELETE` | `/api/products/:id` | Pemilik | Menonaktifkan produk (*soft delete*) / hapus permanen (`?permanent=true`) |
| | `PATCH` | `/api/products/:id/restore` | Pemilik | Mengaktifkan kembali produk yang dinonaktifkan |
| **Transaksi**| `POST` | `/api/transactions/checkout`| Kasir / Pemilik | Checkout transaksi penjualan & pemotongan stok atomik |
| | `GET` | `/api/transactions` | Kasir / Pemilik | Riwayat transaksi (filter tanggal WIB, status, kasir) |
| | `GET` | `/api/transactions/:id` | Kasir / Pemilik | Detail struk transaksi lengkap |
| | `PATCH` | `/api/transactions/:id/void` | Kasir / Pemilik | Pembatalan transaksi & pengembalian stok barang |
| **Laporan** | `GET` | `/api/reports/summary` | Pemilik | Ringkasan total omzet, transaksi, dan produk |
| | `GET` | `/api/reports/revenue` | Pemilik | Data pendapatan harian untuk grafik tren |
| | `GET` | `/api/reports/top-products` | Pemilik | 5 produk terlaris berdasarkan kuantitas & omzet |

> 💡 **File Pengujian Postman:**  
> File koleksi lengkap telah disediakan pada berkas [`StockArt_API.postman_collection.json`](./StockArt_API.postman_collection.json). Koleksi ini telah dilengkapi dengan skrip *pre-request* dan *tests* otomatis untuk menyimpan dan meneruskan token JWT ke setiap request.
