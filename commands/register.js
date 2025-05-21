const readline = require('readline');
const db = require('../db/connection');
const login = require('./login');

async function register() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log('=== Registrasi Akun Baru ===');
    const username = await new Promise(resolve => rl.question('Masukkan username: ', resolve));
    
    if (!username || username.length < 3) {
      console.log('Username minimal 3 karakter.');
      rl.close();
      return;
    }

    const pin = await new Promise(resolve => rl.question('Masukkan PIN (4 digit): ', resolve));
    if (!/^\d{4}$/.test(pin)) {
      console.log('PIN harus 4 digit angka!');
      rl.close();
      return;
    }

    const [results] = await db.query('SELECT * FROM accounts WHERE username = ?', [username]);
    if (results.length > 0) {
      console.log('Username sudah digunakan, silakan coba yang lain.');
      rl.close();
      return;
    }

    await db.query('INSERT INTO accounts (username, pin, balance) VALUES (?, ?, 0)', [username, pin]);
    console.log('Registrasi berhasil! Kamu bisa login sekarang.');
    rl.close();
    login();
  } catch (err) {
    console.error('Gagal registrasi:', err.message);
    rl.close();
  }
}

module.exports = register;