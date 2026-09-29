# API Transaksi — Ocha

## Setup dan kontrak frontend

Jalankan `npm ci`, salin `.env.example` ke `.env`, isi `MONGO_URI` dan
`JWT_SECRET`, lalu `npm run dev`. MongoDB **wajib replica set atau Atlas** agar
checkout dan void mendukung transaksi lintas dokumen. MongoDB standalone tidak
mendukung alur atomik ini; kegagalan database mengembalikan HTTP 500.

Semua endpoint memakai `Authorization: Bearer <token>`. Kasir dan pemilik dapat
melihat transaksi, menghitung draf, dan checkout. Hanya pemilik dapat void.
Konvensi camelCase yang sudah dipakai frontend dipertahankan:

| Rancangan | Field API/database |
| --- | --- |
| detail_barang | detailBarang |
| total_harga | totalHarga |
| kasir_id | kasir (ObjectId pengguna dari JWT) |
| tanggal | createdAt (waktu checkout UTC dari server) |

`GET` mem-populate `kasir` dan `detailBarang.produk`; respons checkout/void
mengembalikan ID referensi. Frontend harus memakai `namaProduk`, `kodeProduk`,
`hargaSatuan`, dan `subtotal` pada detail sebagai snapshot struk. Data produk
yang di-populate mencerminkan katalog saat ini dan bisa null jika sudah dihapus.

## Draf dan keranjang sementara

`POST /api/transactions/draft`

```json
{
  "detailBarang": [
    { "produk": "507f1f77bcf86cd799439011", "jumlah": 2 }
  ]
}
```

Keranjang sementara disimpan pada state frontend; kirim ulang seluruh keranjang
setiap jumlah/item berubah. Draf hanya kalkulasi, tidak disimpan sebagai transaksi,
tidak mereservasi atau memotong stok. Keranjang kosong cukup dikosongkan pada UI;
API menolak daftar kosong. Produk harus tersedia, aktif, dan stok cukup. ID wajib
24 digit heksadesimal. Jumlah wajib bilangan bulat positif yang aman; string
numerik tetap diterima untuk kompatibilitas. Produk berulang digabung berdasarkan
ID sebelum memeriksa stok. Harga diambil dari modul Product milik Bgs.

Respons HTTP 200:

```json
{
  "success": true,
  "message": "Draft transaksi berhasil dihitung",
  "data": {
    "detailBarang": [{
      "produk": "507f1f77bcf86cd799439011",
      "namaProduk": "Buku",
      "kodeProduk": "BK01",
      "jumlah": 2,
      "hargaSatuan": 15000,
      "subtotal": 30000
    }],
    "totalHarga": 30000
  }
}
```

## Checkout

`POST /api/transactions/checkout` — body sama dengan draf, respons HTTP 201.
`POST /api/transactions` tetap tersedia sebagai alias kompatibel.

Server menghitung ulang harga dan stok terkini, mengambil kasir dari JWT, memotong
stok dengan syarat `stok >= jumlah`, lalu menyimpan transaksi `status: selesai`
dan `stokDipotong: true`. Field harga, total, kasir, status, dan waktu dari client
diabaikan. Seluruh pemotongan serta penyimpanan berhasil bersama atau di-rollback
bersama. Checkout bersamaan tidak boleh menjual melebihi stok tersedia.

Respons memiliki `{ success, message, data }`; `data` mencakup `_id`, `kasir`,
`detailBarang`, `totalHarga`, `status`, `stokDipotong`, `createdAt`, dan `updatedAt`.
Simpan `_id` untuk detail atau void. Draf tidak mengunci harga maupun stok sehingga
checkout bisa ditolak atau memiliki harga berbeda dari draf.

Setiap request checkout adalah pembelian baru (belum ada idempotency key).
Frontend perlu menonaktifkan tombol selama request berjalan dan memeriksa riwayat
sebelum mengulang checkout yang responsnya terputus.

## Riwayat

- `GET /api/transactions`: daftar terbaru dahulu, termasuk transaksi batal.
- `GET /api/transactions?tanggal=2026-09-29&kasir=<userId>&status=selesai`:
  semua filter opsional dan dapat digabungkan.
- `GET /api/transactions/:id`: detail atau HTTP 404 jika tidak ditemukan.

Tanggal wajib `YYYY-MM-DD` yang valid, menggunakan **Asia/Jakarta (WIB, UTC+7)**.
Contoh 29 September mencakup `2026-09-28T17:00:00Z` sampai sebelum
`2026-09-29T17:00:00Z`. Filter menggunakan waktu checkout, bukan waktu void.
Status valid: `selesai` atau `batal`. Akses riwayat seluruh kasir mengikuti kontrak
sebelumnya; parameter kasir merupakan filter, bukan pembatasan akses tambahan.

## Void dan kompatibilitas data lama

`PATCH /api/transactions/:id/void` — tanpa body, hanya pemilik.
`PATCH /api/transactions/:id/cancel` adalah alias.

HTTP 200 mengembalikan transaksi dengan status `batal`, `dibatalkanPada`, dan
`dibatalkanOleh`. Stok dikembalikan tepat sekali; data transaksi tetap disimpan.
Void berulang atau bersamaan setelah void pertama menghasilkan HTTP 409.
Laporan yang menghitung status `selesai` otomatis mengecualikan transaksi batal.
Produk nonaktif masih dapat menerima pengembalian stok. Jika produk sudah dihapus,
void ditolak 409 dan seluruh perubahan stok/status di-rollback; produk perlu
dipulihkan dengan ID yang sama sebelum mencoba lagi.

Transaksi lama yang tidak memiliki `stokDipotong: true` dibuat oleh implementasi
sebelum pemotongan stok tersedia. Void transaksi tersebut hanya mengubah status,
tanpa menambah stok. Jangan mengisi penanda ini secara massal pada data lama.
Tidak diperlukan migrasi untuk membaca transaksi lama; snapshot nama/kode dan
metadata void yang baru mungkin tidak tersedia pada dokumen lama.

## Kesalahan

| HTTP | Penyebab |
| --- | --- |
| 400 | Body, jumlah, ObjectId, tanggal, atau status filter tidak valid |
| 401 | Token tidak ada/tidak valid |
| 403 | Kasir mencoba void |
| 404 | Produk/transaksi tidak ditemukan |
| 409 | Stok kurang, produk nonaktif, sudah void, atau produk void telah dihapus |
| 500 | Kegagalan database/server; perubahan dalam transaksi di-rollback |

Kesalahan menggunakan `{ success: false, message }`; validasi middleware juga
memberikan `errors: string[]`. Middleware auth lama menggunakan `{ message }`.

## Pengujian dan serah terima

Gunakan database uji terpisah pada replica set, jangan URI produksi:

```bash
MONGO_URI='mongodb://127.0.0.1:27931/stockart_http_test?replicaSet=stockartTest' \
JWT_SECRET='local-test-secret' npm test
```

`test/transaction.test.js` membuat database unik per proses dan menghapusnya saat
selesai; `test/http.test.js` memakai database pada URI dan membersihkan dokumen
uji yang dibuat. Suite transaksi menguji login, draf, harga server, checkout,
pemotongan stok, void, RBAC, produk invalid/nonaktif, stok kurang, transaksi
bersamaan, rollback saat penyimpanan gagal, rollback void parsial, data lama,
filter kasir, dan batas tanggal WIB.

Pengujian otomatis integrasi modul Auth (Afiq), Product (Bgs), Transaction, serta
Report tersedia. Sesi pengujian bersama anggota tim dan penerimaan frontend
masih perlu dilakukan oleh tim; dokumentasi dan koleksi Postman menjadi kontrak
serah terima. Code freeze/release ditetapkan setelah penerimaan tersebut.
