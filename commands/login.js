const readline = require('readline');
const db = require('../db/connection');
const session = require('../utils/session');
const { formatRupiah } = require('../utils/formatRupiah');
const history = require('./history');

function showMenu() {
  console.log('\n=== Menu ATM ===');
  console.log('1. Cek Saldo');
  console.log('2. Setor Uang');
  console.log('3. Tarik Tunai');
  console.log('4. Transfer');
  console.log('5. Riwayat Transaksi');
  console.log('6. Logout');
  console.log('=================');
}
function questionAsync(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function login() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    console.log('=== Login Akun ===');
    const username = await questionAsync(rl, 'Masukkan username: ');
    const pin = await questionAsync(rl, 'Masukkan PIN (4 digit): ');
    if (!/^[0-9]{4}$/.test(pin)) {
      console.log('PIN harus 4 digit angka!');
      rl.close();
      return;
    }
    const [results] = await db.query(
      'SELECT * FROM accounts WHERE username = ? AND pin = ?',
      [username, pin]
    );
    if (results.length === 0) {
      console.log('Username atau PIN salah!');
      rl.close();
      return;
    }
    session.setUser(results[0]);
    session.getCurrentUser().balance = Number(session.getCurrentUser().balance);

    console.log(`Login berhasil. Selamat datang, ${username}!`);

    async function promptMenu() {
      showMenu();
      const choice = await questionAsync(rl, 'Pilih menu: ');
      switch (choice) {
        case '1':
          console.log(`Saldo Anda: ${formatRupiah(session.getCurrentUser().balance)}`);
          await promptMenu();
          break;
        case '2': {
          const amountStr = await questionAsync(rl, 'Masukkan jumlah setor: ');
          const value = parseInt(amountStr);
          if (isNaN(value) || value <= 0) {
            console.log('Jumlah tidak valid!');
            return promptMenu();
          }
          const newBalance = session.getCurrentUser().balance + value;
          await db.query(
            'UPDATE accounts SET balance = ? WHERE id = ?',
            [newBalance, session.getCurrentUser().id]
          );
          await db.query(
            'INSERT INTO transactions (account_id, type, amount) VALUES (?, ?, ?)',
            [session.getCurrentUser().id, 'deposit', value]
          );
          session.getCurrentUser().balance = newBalance;
          console.log(`Setor berhasil. Saldo: ${formatRupiah(newBalance)}`);
          await promptMenu();
          break;
        }
        case '3': {
          const amountStr = await questionAsync(rl, 'Masukkan jumlah tarik tunai: ');
          const value = parseInt(amountStr);
          if (isNaN(value) || value <= 0) {
            console.log('Jumlah tidak valid!');
            return promptMenu();
          }
          if (value > session.getCurrentUser().balance) {
            console.log('Saldo tidak cukup.');
            return promptMenu();
          }
          const newBalance = session.getCurrentUser().balance - value;
          await db.query(
            'UPDATE accounts SET balance = ? WHERE id = ?',
            [newBalance, session.getCurrentUser().id]
          );
          await db.query(
            'INSERT INTO transactions (account_id, type, amount) VALUES (?, ?, ?)',
            [session.getCurrentUser().id, 'withdraw', value]
          );
          session.getCurrentUser().balance = newBalance;
          console.log(`Tarik tunai berhasil. Saldo: ${formatRupiah(newBalance)}`);
          await promptMenu();
          break;
        }
        case '4': {
          const targetUsername = await questionAsync(rl, 'Masukkan username tujuan: ');
          if (targetUsername === session.getCurrentUser().username) {
            console.log('Tidak bisa transfer ke akun sendiri.');
            return promptMenu();
          }
          const [targetResults] = await db.query(
            'SELECT * FROM accounts WHERE username = ?',
            [targetUsername]
          );
          if (targetResults.length === 0) {
            console.log('Akun tujuan tidak ditemukan.');
            return promptMenu();
          }
          const targetUser = targetResults[0];
          targetUser.balance = Number(targetUser.balance);
          const amountStr = await questionAsync(rl, 'Masukkan jumlah transfer: ');
          const value = parseInt(amountStr);
          if (isNaN(value) || value <= 0) {
            console.log('Jumlah tidak valid!');
            return promptMenu();
          }
          if (value > session.getCurrentUser().balance) {
            console.log('Saldo tidak cukup.');
            return promptMenu();
          }
          const newSenderBalance = session.getCurrentUser().balance - value;
          const newReceiverBalance = targetUser.balance + value;
          await db.query(
            'UPDATE accounts SET balance = ? WHERE id = ?',
            [newSenderBalance, session.getCurrentUser().id]
          );
          await db.query(
            'UPDATE accounts SET balance = ? WHERE id = ?',
            [newReceiverBalance, targetUser.id]
          );
          await db.query(
            'INSERT INTO transactions (account_id, type, amount) VALUES (?, ?, ?)',
            [session.getCurrentUser().id, 'transfer_out', value]
          );
          await db.query(
            'INSERT INTO transactions (account_id, type, amount) VALUES (?, ?, ?)',
            [targetUser.id, 'transfer_in', value]
          );
          session.getCurrentUser().balance = newSenderBalance;
          console.log(`Transfer ke ${targetUsername} berhasil. Sisa saldo: ${formatRupiah(newSenderBalance)}`);
          await promptMenu();
          break;
        }
        case '6':
          console.log('Logout berhasil. Sampai jumpa!');
          session.clearUser();
          rl.close();
          process.exit(0);
          break;
        case '5':
          try {
            await history();
          } catch (err) {
            console.error('Gagal menampilkan riwayat transaksi:', err.message);
          }
          await promptMenu();
          break;
        default:
          console.log('Pilihan tidak valid!');
          await promptMenu();
          break;
      }
    }
    await promptMenu();
  } catch (error) {
    console.error('Terjadi kesalahan:', error.message);
    rl.close();
  }
}

module.exports = login;
