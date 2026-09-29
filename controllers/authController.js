const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fungsi Generate Token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d' // Token berlaku 1 hari
  });
};

// @desc    Register User Baru
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const { nama, username, password } = req.body;

    if (!nama || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, username, dan password wajib diisi'
      });
    }

    // 1. Cek apakah username sudah terdaftar
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username sudah digunakan' });
    }

    // 2. Enkripsi (hash) password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Simpan user baru ke MongoDB
    const user = await User.create({
      nama,
      username,
      password: hashedPassword,
      role: 'kasir'
    });

    // 4. Kirim respon sukses beserta token
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        _id: user._id,
        nama: user.nama,
        username: user.username,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login User
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi'
      });
    }

    // 1. Cari user berdasarkan username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Username atau password salah' });
    }

    // 2. Cek kesesuaian password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Username atau password salah' });
    }

    // 3. Kirim respon sukses beserta token
    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        _id: user._id,
        nama: user.nama,
        username: user.username,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lihat Profil Pengguna Aktif
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        _id: req.user._id,
        nama: req.user.nama,
        username: req.user.username,
        role: req.user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};