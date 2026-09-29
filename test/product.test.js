const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Product = require('../models/Product');
const User = require('../models/User');
const app = require('../app');
const { productRules } = require('../middleware/validate');

const payload = { nama: 'Produk otomatis', hargaBeli: 1000, hargaJual: 2000, stok: 10 };

test('kode otomatis berbeda pada setiap produk dan kode manual tetap dipertahankan', async () => {
  assert.deepEqual(productRules(payload), []);
  const products = Array.from({ length: 100 }, () => new Product(payload));
  await Promise.all(products.map((product) => product.validate()));
  assert.equal(new Set(products.map((product) => product.kodeProduk)).size, 100);
  assert.match(products[0].kodeProduk, /^PRD-[0-9A-F-]{36}$/);
  const manual = new Product({ ...payload, kodeProduk: ' atk-test-001 ' });
  await manual.validate();
  assert.equal(manual.kodeProduk, 'ATK-TEST-001');
  for (const kodeProduk of ['', '   ', null, 123, {}, []]) {
    assert.ok(productRules({ ...payload, kodeProduk }).length);
  }
});

test('HTTP: request berulang dan bersamaan menghasilkan kode unik yang tersimpan', async (t) => {
  const dbName = `prd_test_${process.pid}_${Date.now()}`;
  await mongoose.connect(process.env.MONGO_URI, { dbName, serverSelectionTimeoutMS: 10000 });
  let server;
  t.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    try {
      await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });
  await Promise.all([Product.init(), User.init()]);
  const owner = await User.create({ nama: 'Owner test', username: 'product_test_owner',
    password: 'test-only', role: 'pemilik' });
  const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/products`;
  async function request(method, path, body) {
    const response = await fetch(base + path, { method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, ...(await response.json()) };
  }
  const first = await request('POST', '', payload);
  assert.equal(first.status, 201, JSON.stringify(first));
  const results = await Promise.all(Array.from({ length: 5 }, () => request('POST', '', payload)));
  for (const result of results) assert.equal(result.status, 201, JSON.stringify(result));
  const products = [first, ...results].map((result) => result.data);
  assert.equal(new Set(products.map((product) => product.kodeProduk)).size, 6);
  assert.equal(new Set(products.map((product) => product._id)).size, 6);
  assert.equal(await Product.countDocuments(), 6);
  const updated = await request('PUT', `/${first.data._id}`, { nama: 'Nama baru' });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.kodeProduk, first.data.kodeProduk);
  const barcode = await request('GET', `?barcode=${first.data.kodeProduk}`);
  assert.equal(barcode.data[0]._id, first.data._id);
  const manual = { ...payload, kodeProduk: 'ATK-TEST-001' };
  assert.equal((await request('POST', '', manual)).status, 201);
  assert.equal((await request('POST', '', manual)).status, 400);
  assert.equal(await Product.countDocuments({ kodeProduk: manual.kodeProduk }), 1);
});
