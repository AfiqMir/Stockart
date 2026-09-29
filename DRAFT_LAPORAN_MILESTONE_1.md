# LAPORAN TUGAS AKHIR: MILESTONE 1 (BACKEND)
## PENGEMBANGAN APLIKASI WEB
**Sistem Kasir dan Manajemen Stok Berbasis Web — StockArt**

---

### 👥 Identitas Tim Pengembang

* **Nama Kelompok :** Kelompok PAW — Toko Kelontong Berkah
* **Daftar Anggota :**
  1. **Muhammad Afiq Mirza Choiruzan** (NIM: 24/537942/TK/59646) — *Modul Autentikasi, Keamanan & DevOps*
  2. **Bagas Adjie Pamungkas** (NIM: 24/544718/TK/60547) — *Modul Produk & Manajemen Stok*
  3. **Amelia Ocha Maharani** (NIM: 24/534372/TK/59229) — *Modul Transaksi Kasir & Checkout Atomik*
  4. **Muhammad Izzuddin Prakoso** (NIM: 24/537712/TK/59618) — *Modul Laporan, Agregasi & Analisis Penjualan*

* **Tautan Repository GitHub :** `https://github.com/AfiqMir/stockart-backend`
* **Tautan Live Staging Backend (Railway) :** `https://stockart-backend-production.up.railway.app`
* **Tautan Google Drive Laporan & Lampiran :** `[Masukkan Link GDrive dengan Akses Anyone with the link can view]`

---

# 1. ANALISIS KEBUTUHAN (USER STORY)

### 1.1 Latar Belakang Masalah (Studi Kasus: Toko Kelontong "Berkah" — US5)
Toko Kelontong "Berkah" saat ini menghadapi kendala operasional akibat sistem pencatatan yang masih terpisah di dua tempat: sebagian dicatat manual di buku catatan kertas, dan sebagian lagi di aplikasi catatan ponsel. 

Akibat dari sistem yang tercerai-berai tersebut:
1. **Stok Fisik Tidak Sinkron:** Jumlah stok barang yang ada di rak kerap tidak sesuai dengan catatan.
2. **Ketidaktahuan Performa Produk:** Pemilik toko tidak mengetahui produk mana yang paling laku (*fast-moving*) dan produk yang kurang diminati (*slow-moving*).
3. **Rekapitulasi Melelahkan:** Setiap malam pemilik toko harus menghitung ulang nota secara manual untuk menyusun laporan keuangan harian.
4. **Tidak Ada Peringatan Stok:** Sering terjadi kehabisan barang tanpa disadari oleh pemilik karena tidak adanya batas ambang minimum stok (*low-stock warning*).

### 1.2 Daftar Kebutuhan Pengguna (*User Requirements*)

Berdasarkan analisis terhadap permasalahan di atas, kebutuhan pengguna dibagi berdasarkan dua peran (*Actor*):

#### A. Kebutuhan Pemilik Toko (*Owner*)
1. **Kebutuhan Akses & Kontrol Penuh:** Pemilik memerlukan hak akses administrator untuk mengelola seluruh data inventaris toko dan melihat laporan finansial.
2. **Kebutuhan Manajemen Katalog Produk:** Pemilik dapat menambah produk baru, memperbarui harga jual/beli, mengubah stok, menentukan kategori barang, serta menetapkan batas stok minimum (*low-stock threshold*).
3. **Kebutuhan Pengawasan Stok Kritis:** Pemilik memerlukan informasi real-time mengenai barang-barang yang stoknya sudah berada di bawah ambang batas minimum agar dapat segera melakukan restock.
4. **Kebutuhan Laporan Otomatis:** Pemilik membutuhkan ringkasan laporan omzet penjualan harian, total transaksi, dan daftar produk terlaris tanpa perlu menghitung manual setiap malam.
5. **Kebutuhan Pembatalan Transaksi (*Void*):** Pemilik memiliki wewenang untuk membatalkan transaksi yang keliru dengan pengembalian stok barang secara otomatis.
6. **Kebutuhan Pendaftaran Kasir:** Pemilik dapat mendaftarkan akun kasir baru secara resmi untuk mencegah pihak luar membuat akun tanpa izin.

#### B. Kebutuhan Kasir Toko (*Cashier*)
1. **Kebutuhan Transaksi Cepat:** Kasir memerlukan antarmuka pencatatan transaksi penjualan yang cepat dan mudah digunakan saat melayani antrean pembeli.
2. **Kebutuhan Kalkulasi Subtotal & Draft:** Sistem harus otomatis menghitung subtotal belanjaan dan total tagihan secara akurat sebelum pembayaran diselesaikan.
3. **Kebutuhan Pengurangan Stok Otomatis:** Setiap transaksi yang berhasil disimpan harus otomatis memotong stok barang secara atomik di database.
4. **Kebutuhan Riwayat Transaksi:** Kasir dapat melihat daftar riwayat transaksi yang pernah dibuat untuk pengecekan nota belanja.

---

# 2. ANALISIS FITUR SISTEM (BACKEND)

Berdasarkan analisis kebutuhan di atas, berikut adalah pemetaan modul dan fitur teknis yang diimplementasikan pada backend StockArt:

| No | Modul | Nama Fitur | Deskripsi Fungsional | Hak Akses (RBAC) |
|:---:|:---|:---|:---|:---:|
| 1 | **Autentikasi & RBAC** | Login & Token JWT | Autentikasi menggunakan Bcrypt hashing dan penerbitan JSON Web Token (masa berlaku 24 jam). Dilengkapi *Rate Limiting* (10 req/15 menit). | Publik |
| 2 | **Autentikasi & RBAC** | Registrasi Kasir Terproteksi | Pendaftaran akun kasir baru dengan validasi data ketat dan hanya dapat dieksekusi oleh pemilik toko. | Pemilik |
| 3 | **Katalog Produk** | CRUD Produk Lengkap | Manajemen data produk: Nama, Kode Produk unik, Kategori, Harga Beli, Harga Jual, Satuan, Stok, Stok Minimum, dan Status Aktif. | Pemilik (CUD) / Kasir (Read) |
| 4 | **Katalog Produk** | Deteksi Stok Menipis (*Low Stock*) | Identifikasi otomatis produk yang memiliki nilai `stok <= stokMinimum`. | Pemilik & Kasir |
| 5 | **Transaksi Kasir** | Kalkulasi Draft Transaksi | Penghitungan estimasi total belanjaan berdasarkan produk dan kuantitas sebelum checkout. | Kasir & Pemilik |
| 6 | **Transaksi Kasir** | Checkout Atomik & Pemotongan Stok | Pembuatan transaksi penjualan dengan pengurangan stok barang otomatis dan mekanisme *rollback* transaksi jika stok tidak mencukupi. | Kasir & Pemilik |
| 7 | **Transaksi Kasir** | Snapshot Harga Historis | Mengunci harga satuan saat transaksi terjadi agar laporan keuangan masa lalu tidak berubah saat harga produk dinaikkan di masa depan. | Sistem |
| 8 | **Transaksi Kasir** | Pembatalan Transaksi (*Void*) | Pembatalan transaksi penjualan oleh pemilik dengan pengembalian stok barang otomatis ke inventaris. | Khusus Pemilik |
| 9 | **Transaksi Kasir** | Filter Riwayat Transaksi | Pencarian riwayat transaksi berdasarkan rentang tanggal WIB, kasir, dan status transaksi. | Kasir & Pemilik |
| 10 | **Laporan & Analisis** | Ringkasan Penjualan (*Summary*) | Agregasi total omzet toko, total transaksi selesai, dan total produk aktif. | Khusus Pemilik |
| 11 | **Laporan & Analisis** | Laporan Omzet Harian (*Revenue*) | Agregasi grafik pendapatan harian untuk melihat tren penjualan. | Khusus Pemilik |
| 12 | **Laporan & Analisis** | Produk Terlaris (*Top Products*) | Agregasi produk dengan volume penjualan dan pendapatan tertinggi (*ranking* barang terlaris). | Khusus Pemilik |
| 13 | **Nilai Tambah (G6)** | Deployment Selain Vercel | Backend di-deploy secara mandiri di **Railway Cloud 24/7** dan database di **MongoDB Atlas**, siap dihubungkan ke Frontend di **Cloudflare Pages**. | Sistem Cloud |
| 14 | **Nilai Tambah (G6)** | Ekspor Laporan & Notifikasi Email | [Bagian integrasi pengiriman email laporan PDF otomatis ke email pemilik]. | Khusus Pemilik |

---

# 3. TEKNOLOGI YANG DIGUNAKAN

* **Runtime Environment :** Node.js (v20+ / v22)
* **Framework Backend :** Express.js (v5)
* **Database :** MongoDB Atlas Cloud (M0 Replica Set Cluster)
* **Object Data Modeling (ODM) :** Mongoose (v9)
* **Autentikasi & Keamanan :**
  - `jsonwebtoken` (JWT) untuk sessionless bearer authentication.
  - `bcryptjs` untuk enkripsi satu arah kata sandi (Salt Cost 10).
  - `express-rate-limit` untuk perlindungan brute-force serangan login.
  - `cors` untuk whitelist domain frontend.
* **Testing & Quality Assurance :** Node.js Native Test Runner (`node --test`), 37 automated tests passing 100%.
* **Deployment & CI/CD :** Railway Cloud, GitHub Actions.

---

# 4. STRUKTUR REPOSITORI DAN ARSITEKTUR FOLDER

```text
stockart-backend/
├── config/
│   └── db.js                 # Konfigurasi koneksi MongoDB Atlas
├── controllers/
│   ├── authController.js        # Controller login & register
│   ├── productController.js     # Controller CRUD produk & stok
│   ├── transactionController.js # Controller draft, checkout & cancel
│   └── reportController.js      # Controller agregasi omzet & top products
├── middleware/
│   ├── authMiddleware.js        # Middleware proteksi JWT & otorisasi RBAC (pemilik/kasir)
│   ├── rateLimiter.js           # Middleware pembatas request login (anti brute-force)
│   └── validate.js              # Middleware validasi body request schema
├── models/
│   ├── User.js                  # Schema user (nama, username, password, role)
│   ├── Product.js               # Schema produk (nama, kode, harga, stok, stokMin)
│   └── Transaction.js           # Schema transaksi penjualan & detail barang
├── routes/
│   ├── authRoutes.js            # Rute API /api/auth
│   ├── productRoutes.js         # Rute API /api/products
│   ├── transactionRoutes.js     # Rute API /api/transactions
│   └── reportRoutes.js          # Rute API /api/reports
├── scripts/
│   ├── seed.js                  # Script inisialisasi akun pemilik pertama
│   └── seedProducts.js          # Script inisialisasi katalog sembako dummy
├── services/
│   └── transactionService.js    # Business logic transaksi atomik & restock
├── test/
│   ├── http.test.js             # 33 HTTP Integration Tests lengkap
│   ├── rbac.test.js             # 4 Unit Tests middleware RBAC
│   └── transaction.test.js      # Unit test transaksi atomik & rollback
├── .env.example                 # Template environment variables
├── API_TESTING.md               # Dokumentasi panduan pengujian API
├── app.js                       # Konfigurasi Express application instance
├── index.js                     # Entry point server listener
├── package.json                 # Metadata dependensi & script runner
└── StockArt_API.postman_collection.json # Koleksi Postman API v2.1
```

---

# 5. DAFTAR API DAN HASIL PEMANGGILAN (POSTMAN TESTING)

**Base URL Staging :** `https://stockart-backend-production.up.railway.app`

---

### 5.1 Modul 1: Autentikasi & Pengguna (`/api/auth`)

#### A. `POST /api/auth/login` (Login Pengguna)
* **Deskripsi :** Memvalidasi username dan password, mengembalikan token JWT 24 jam dan info peran pengguna.
* **Request Body :**
```json
{
  "username": "pemilik",
  "password": "gantidulu123"
}
```
* **Response `200 OK` :**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "_id": "6aaf489db4955072a7ee2fa7",
    "nama": "Pemilik Toko",
    "username": "pemilik",
    "role": "pemilik",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman POST Login ]`

---

#### B. `POST /api/auth/register` (Pendaftaran Kasir Baru — Khusus Pemilik)
* **Deskripsi :** Mendaftarkan akun kasir baru. Wajib menyertakan token pemilik (`Authorization: Bearer <token_pemilik>`).
* **Request Body :**
```json
{
  "nama": "Siti Kasir Pagi",
  "username": "siti_kasir",
  "password": "password123"
}
```
* **Response `201 Created` :**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "_id": "6ab81029c19d4481c9001aef",
    "nama": "Siti Kasir Pagi",
    "username": "siti_kasir",
    "role": "kasir",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman POST Register ]`

---

#### C. `GET /api/auth/me` (Lihat Profil Pengguna Aktif)
* **Deskripsi :** Mengambil informasi identitas pengguna yang sedang login berdasarkan token JWT.
* **Header :** `Authorization: Bearer <TOKEN>`
* **Response `200 OK` :**
```json
{
  "success": true,
  "data": {
    "_id": "6aaf489db4955072a7ee2fa7",
    "nama": "Pemilik Toko",
    "username": "pemilik",
    "role": "pemilik"
  }
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman GET Profile ]`

---

### 5.2 Modul 2: Katalog Produk & Stok (`/api/products`)

#### A. `GET /api/products` (Melihat Seluruh Daftar Produk)
* **Deskripsi :** Mengambil seluruh katalog produk aktif beserta informasi stok dan harga. Dapat diakses oleh Pemilik dan Kasir.
* **Header :** `Authorization: Bearer <TOKEN>`
* **Response `200 OK` :**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6ab773c1aef00ed38c324407",
      "nama": "Beras Maknyuss 5kg",
      "kodeProduk": "SM001",
      "kategori": "Sembako",
      "hargaBeli": 60000,
      "hargaJual": 65000,
      "stok": 20,
      "satuan": "sak",
      "stokMinimum": 5,
      "deskripsi": "Beras premium kualitas super",
      "aktif": true
    },
    {
      "_id": "6ab773c1aef00ed38c32440b",
      "nama": "Indomie Goreng Reguler",
      "kodeProduk": "8968601001",
      "kategori": "Sembako",
      "hargaBeli": 2700,
      "hargaJual": 3000,
      "stok": 150,
      "satuan": "bungkus",
      "stokMinimum": 40,
      "deskripsi": "Mie instan goreng sejuta umat",
      "aktif": true
    }
  ]
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman GET Products ]`

---

#### B. `POST /api/products` (Menambah Produk Baru — Khusus Pemilik)
* **Deskripsi :** Menambahkan barang baru ke katalog toko. Ditolak (`403 Forbidden`) jika diakses oleh akun Kasir.
* **Header :** `Authorization: Bearer <TOKEN_PEMILIK>`
* **Request Body :**
```json
{
  "nama": "Minyak Goreng Sania 2L",
  "kodeProduk": "SM011",
  "kategori": "Sembako",
  "hargaBeli": 33000,
  "hargaJual": 36000,
  "stok": 24,
  "satuan": "pouch",
  "stokMinimum": 6,
  "deskripsi": "Minyak goreng kelapa sawit premium"
}
```
* **Response `201 Created` :**
```json
{
  "success": true,
  "message": "Produk berhasil ditambahkan",
  "data": {
    "_id": "6ab8198dc19d4481c9001b01",
    "nama": "Minyak Goreng Sania 2L",
    "kodeProduk": "SM011",
    "kategori": "Sembako",
    "hargaJual": 36000,
    "stok": 24,
    "stokMinimum": 6,
    "aktif": true
  }
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman POST Tambah Produk ]`

---

#### C. `PUT /api/products/:id` (Update Data Produk — Khusus Pemilik)
* **Deskripsi :** Memperbarui harga, deskripsi, atau atribut produk.
* **Header :** `Authorization: Bearer <TOKEN_PEMILIK>`
* **Request Body :**
```json
{
  "hargaJual": 37000,
  "stokMinimum": 8
}
```
* **Response `200 OK` :**
```json
{
  "success": true,
  "message": "Produk berhasil diperbarui",
  "data": {
    "_id": "6ab8198dc19d4481c9001b01",
    "nama": "Minyak Goreng Sania 2L",
    "hargaJual": 37000,
    "stokMinimum": 8
  }
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman PUT Update Produk ]`

---

#### D. `DELETE /api/products/:id` (Hapus/Nonaktifkan Produk — Khusus Pemilik)
* **Deskripsi :** Menghapus produk dari katalog toko secara permanen atau soft delete.
* **Header :** `Authorization: Bearer <TOKEN_PEMILIK>`
* **Response `200 OK` :**
```json
{
  "success": true,
  "message": "Produk berhasil dihapus"
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman DELETE Produk ]`

---

### 5.3 Modul 3: Transaksi Penjualan Kasir (`/api/transactions`)

#### A. `POST /api/transactions/draft` (Kalkulasi Draft Transaksi)
* **Deskripsi :** Menghitung subtotal belanjaan sebelum konfirmasi checkout.
* **Header :** `Authorization: Bearer <TOKEN>`
* **Request Body :**
```json
{
  "detailBarang": [
    {
      "produk": "6ab773c1aef00ed38c32440b",
      "jumlah": 5
    },
    {
      "produk": "6ab773c1aef00ed38c324407",
      "jumlah": 1
    }
  ]
}
```
* **Response `200 OK` :**
```json
{
  "success": true,
  "message": "Draft transaksi berhasil dihitung",
  "data": {
    "detailBarang": [
      {
        "produk": "6ab773c1aef00ed38c32440b",
        "namaProduk": "Indomie Goreng Reguler",
        "kodeProduk": "8968601001",
        "jumlah": 5,
        "hargaSatuan": 3000,
        "subtotal": 15000
      },
      {
        "produk": "6ab773c1aef00ed38c324407",
        "namaProduk": "Beras Maknyuss 5kg",
        "kodeProduk": "SM001",
        "jumlah": 1,
        "hargaSatuan": 65000,
        "subtotal": 65000
      }
    ],
    "totalHarga": 80000
  }
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman POST Draft Transaksi ]`

---

#### B. `POST /api/transactions` (Checkout Transaksi & Potong Stok Otomatis)
* **Deskripsi :** Menyelesaikan transaksi penjualan, memotong stok barang secara atomik di database, dan menyimpan bukti transaksi.
* **Header :** `Authorization: Bearer <TOKEN>`
* **Request Body :**
```json
{
  "detailBarang": [
    {
      "produk": "6ab773c1aef00ed38c32440b",
      "jumlah": 2
    }
  ],
  "metodePembayaran": "tunai",
  "nominalBayar": 10000,
  "catatan": "Pembeli membawa kantong sendiri"
}
```
* **Response `201 Created` :**
```json
{
  "success": true,
  "message": "Transaksi berhasil dibuat",
  "data": {
    "_id": "6ab82104c19d4481c9001b10",
    "nomorTransaksi": "TRX-20260929-0001",
    "kasir": "6ab81029c19d4481c9001aef",
    "detailBarang": [
      {
        "produk": "6ab773c1aef00ed38c32440b",
        "namaProduk": "Indomie Goreng Reguler",
        "kodeProduk": "8968601001",
        "jumlah": 2,
        "hargaSatuan": 3000,
        "subtotal": 6000
      }
    ],
    "totalHarga": 6000,
    "metodePembayaran": "tunai",
    "nominalBayar": 10000,
    "kembalian": 4000,
    "status": "selesai",
    "createdAt": "2026-09-29T10:15:30.000Z"
  }
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman POST Buat Transaksi ]`

---

#### C. `GET /api/transactions` (Melihat Riwayat Transaksi Penjualan)
* **Deskripsi :** Menampilkan daftar transaksi yang telah dibuat beserta filter tanggal.
* **Header :** `Authorization: Bearer <TOKEN>`
* **Response `200 OK` :**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6ab82104c19d4481c9001b10",
      "nomorTransaksi": "TRX-20260929-0001",
      "totalHarga": 6000,
      "metodePembayaran": "tunai",
      "status": "selesai",
      "kasir": {
        "nama": "Siti Kasir Pagi",
        "username": "siti_kasir"
      }
    }
  ]
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman GET Transactions ]`

---

#### D. `PATCH /api/transactions/:id/cancel` (Pembatalan Transaksi / Void — Khusus Pemilik)
* **Deskripsi :** Membatalkan transaksi penjualan dan mengembalikan stok barang ke database. Ditolak (`403`) jika kasir mencoba membatalkan.
* **Header :** `Authorization: Bearer <TOKEN_PEMILIK>`
* **Response `200 OK` :**
```json
{
  "success": true,
  "message": "Transaksi berhasil dibatalkan dan stok telah dikembalikan",
  "data": {
    "_id": "6ab82104c19d4481c9001b10",
    "status": "dibatalkan"
  }
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman PATCH Cancel Transaksi ]`

---

### 5.4 Modul 4: Laporan & Analisis Penjualan (`/api/reports`)

#### A. `GET /api/reports/summary` (Ringkasan Total Omzet & Performa Toko)
* **Deskripsi :** Agregasi data finansial toko kelontong. Khusus diakses oleh role Pemilik.
* **Header :** `Authorization: Bearer <TOKEN_PEMILIK>`
* **Response `200 OK` :**
```json
{
  "success": true,
  "data": {
    "totalProduk": 22,
    "totalTransaksi": 48,
    "totalOmzet": 1450000,
    "rataRataTransaksi": 30208
  }
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman GET Report Summary ]`

---

#### B. `GET /api/reports/revenue` (Laporan Pendapatan / Omzet Harian)
* **Deskripsi :** Menampilkan rincian omzet harian untuk pembuatan grafik performa toko.
* **Header :** `Authorization: Bearer <TOKEN_PEMILIK>`
* **Response `200 OK` :**
```json
{
  "success": true,
  "data": [
    {
      "tanggal": "2026-09-28",
      "omzet": 720000,
      "jumlahTransaksi": 22
    },
    {
      "tanggal": "2026-09-29",
      "omzet": 730000,
      "jumlahTransaksi": 26
    }
  ]
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman GET Report Revenue ]`

---

#### C. `GET /api/reports/top-products` (Daftar Produk Paling Laris)
* **Deskripsi :** Menampilkan 5 produk teratas berdasarkan volume kuantitas penjualan tertinggi.
* **Header :** `Authorization: Bearer <TOKEN_PEMILIK>`
* **Response `200 OK` :**
```json
{
  "success": true,
  "data": [
    {
      "produkId": "6ab773c1aef00ed38c32440b",
      "namaProduk": "Indomie Goreng Reguler",
      "totalTerjual": 64,
      "totalPendapatan": 192000
    },
    {
      "produkId": "6ab773c1aef00ed38c324413",
      "namaProduk": "Teh Botol Sosro 450ml",
      "totalTerjual": 35,
      "totalPendapatan": 175000
    }
  ]
}
```
* **Screenshot Postman :**
  > `[ Masukkan Screenshot Hasil Panggilan Postman GET Top Products ]`

---

# 6. HASIL PENGUJIAN OTOMATIS (TEST SUITE)

Seluruh logika bisnis, RBAC keamanan, validasi input, dan transaksi atomik telah diuji menggunakan Node.js Test Runner dengan hasil **100% LULUS (37 Tests Passed)**:

```text
> stockart-backend@1.0.0 test
> node --test

TAP version 13
# Setup: server & autentikasi ........................... PASS
# GET /api/products — kasir dapat melihat daftar produk ... PASS
# GET /api/products — pemilik dapat melihat daftar produk . PASS
# GET /api/products — tanpa token ditolak (401) .......... PASS
# POST /api/products — kasir TIDAK BISA tambah (403) ..... PASS
# POST /api/products — pemilik BISA tambah (201) ......... PASS
# GET /api/products/:id — detail produk .................. PASS
# PUT /api/products/:id — kasir ditolak (403) ............ PASS
# PUT /api/products/:id — pemilik BISA update (200) ...... PASS
# POST /api/transactions/draft — hitung draft (200) ...... PASS
# POST /api/transactions — kasir BISA checkout (201) ..... PASS
# GET /api/transactions — riwayat transaksi (200) ........ PASS
# PATCH /api/transactions/:id/cancel — kasir ditolak (403) PASS
# PATCH /api/transactions/:id/cancel — pemilik BISA (200)  PASS
# GET /api/reports/summary — kasir ditolak (403) ......... PASS
# GET /api/reports/summary — pemilik BISA akses (200) .... PASS
# GET /api/reports/revenue — laporan omzet (200) ......... PASS
# GET /api/reports/top-products — laporan top produk (200) PASS
# POST /api/auth/register — tanpa token ditolak (401) .... PASS
# POST /api/auth/register — kasir ditolak daftarkan (403)  PASS
# POST /api/auth/register — pemilik BISA daftarkan (201) . PASS
# Validasi input error (Password, Username, Body, dll) ... PASS (9 tests)
# Unit Tests RBAC Middleware ............................. PASS (4 tests)

1..37
# tests 37
# pass 37
# fail 0
```

---

# 7. KESIMPULAN & TAHAP SELANJUTNYA (MILESTONE 2)

Pengembangan **Milestone 1 (Backend API)** untuk aplikasi StockArt telah berhasil diselesaikan dengan baik:
1. Seluruh arsitektur backend, autentikasi JWT dengan enkripsi Bcrypt, proteksi RBAC (*Role-Based Access Control*), dan rate limiter telah terpasang dengan kokoh.
2. Logika inventaris, produk, checkout atomik pemotongan stok, serta agregasi laporan omzet harian telah terintegrasi penuh.
3. Server backend telah berhasil di-deploy secara live dan stabil 24/7 di platform **Railway** dengan database **MongoDB Atlas Cloud**.

Pada **Milestone 2**, tim akan melanjutkan ke tahap pengembangan antarmuka pengguna (**Frontend**) menggunakan framework modern yang akan di-deploy ke **Cloudflare Pages**, mengintegrasikan pemindaian barcode, payment gateway QRIS, serta fitur ekspor laporan otomatis.
