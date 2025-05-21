const readline = require('readline');
const db = require('../db/connection');
const session = require('../utils/session');
const { formatRupiah } = require('../utils/formatRupiah');

function questionAsync(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function withdraw() {
  const user = session.getCurrentUser();
  if (!user) {
    console.log('Silakan login terlebih dahulu.');
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const amountStr = await questionAsync(rl, 'Masukkan jumlah yang ingin ditarik: ');
    const withdrawAmount = parseInt(amountStr);

    if (isNaN(withdrawAmount)) {
      console.log('Jumlah harus berupa angka.');
      rl.close();
      return;
    }

    if (withdrawAmount <= 0) {
      console.log('Jumlah penarikan harus lebih dari 0.');
      rl.close();
      return;
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [results] = await conn.query('SELECT balance FROM accounts WHERE id = ? FOR UPDATE', [user.id]);
      if (results.length === 0) {
        throw new Error('Akun tidak ditemukan.');
      }

      const currentBalance = Number(results[0].balance);
      if (currentBalance < withdrawAmount) {
        throw new Error('Saldo tidak mencukupi.');
      }

      const newBalance = currentBalance - withdrawAmount;
      await conn.query('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, user.id]);

      await conn.query(
        'INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?)',
        [user.id, 'withdraw', withdrawAmount, 'Penarikan tunai']
      );

      await conn.commit();
      console.log(`Penarikan berhasil. Jumlah: ${formatRupiah(withdrawAmount)}`);
      session.getCurrentUser().balance = newBalance;
    } catch (err) {
      await conn.rollback();
      console.error('Gagal melakukan penarikan:', err.message);
    } finally {
      if (conn) conn.release();
    }
  } catch (err) {
    console.error('Terjadi kesalahan:', err.message);
  } finally {
    rl.close();
  }
}

module.exports = withdraw;