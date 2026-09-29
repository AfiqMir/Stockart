/**
 * Rate limiter untuk endpoint autentikasi.
 *
 * Membatasi jumlah request ke /api/auth/login dan /api/auth/register
 * untuk mencegah brute-force attack.
 *
 * Batas per IP per 15 menit: 100 request lokal, 10 request production.
 * Dapat diatur melalui AUTH_RATE_LIMIT_MAX.
 * Response jika melebihi batas: 429 Too Many Requests.
 */

'use strict';

const rateLimit = require('express-rate-limit');

const configuredMax = Number(process.env.AUTH_RATE_LIMIT_MAX);
const maxRequests = Number.isSafeInteger(configuredMax) && configuredMax > 0
  ? configuredMax
  : (process.env.NODE_ENV === 'production' ? 10 : 100);

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: maxRequests,
  standardHeaders: true,     // kirim header RateLimit-* standar (RFC 6585)
  legacyHeaders: false,      // nonaktifkan header X-RateLimit-* lama
  message: {
    success: false,
    message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
  },
});

module.exports = { authRateLimiter };
