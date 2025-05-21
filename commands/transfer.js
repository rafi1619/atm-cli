const readline = require('readline');
const db = require('../db/connection');
const session = require('../utils/session');
const { formatRupiah } = require('../utils/formatRupiah');

function questionAsync(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function transfer() {
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
    const targetUsername = await questionAsync(rl, 'Masukkan username tujuan transfer: ');
    if (targetUsername === user.username) {
      console.log('Tidak bisa transfer ke akun sendiri.');
      rl.close();
      return;
    }

    const amountStr = await questionAsync(rl, 'Masukkan jumlah transfer: ');
    const transferAmount = parseInt(amountStr);

    if (isNaN(transferAmount)) {
      console.log('Jumlah harus berupa angka.');
      rl.close();
      return;
    }

    if (transferAmount <= 0) {
      console.log('Jumlah transfer harus lebih dari 0.');
      rl.close();
      return;
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [[source]] = await conn.query('SELECT balance FROM accounts WHERE id = ? FOR UPDATE', [user.id]);
      if (!source) {
        throw new Error('Akun sumber tidak ditemukan.');
      }

      if (transferAmount > source.balance) {
        throw new Error('Saldo tidak cukup untuk transfer.');
      }

      const [targetResult] = await conn.query('SELECT * FROM accounts WHERE username = ? FOR UPDATE', [targetUsername]);
      if (targetResult.length === 0) {
        throw new Error('Username tujuan tidak ditemukan.');
      }

      const target = targetResult[0];

      await conn.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [transferAmount, user.id]);
      await conn.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [transferAmount, target.id]);

      await conn.query(
        'INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?)',
        [user.id, 'transfer-out', transferAmount, `Transfer ke ${targetUsername}`]
      );
      await conn.query(
        'INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?)',
        [target.id, 'transfer-in', transferAmount, `Transfer dari ${user.username}`]
      );

      await conn.commit();
      console.log(`Transfer berhasil ke ${targetUsername} sebesar ${formatRupiah(transferAmount)}`);
    } catch (err) {
      await conn.rollback();
      console.error('Gagal transfer:', err.message);
    } finally {
      if (conn) conn.release();
    }
  } catch (err) {
    console.error('Terjadi kesalahan:', err.message);
  } finally {
    rl.close();
  }
}

module.exports = transfer;