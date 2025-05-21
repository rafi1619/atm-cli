const readline = require('readline');
const db = require('../db/connection');
const session = require('../utils/session');
const { formatRupiah } = require('../utils/formatRupiah');

function questionAsync(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function deposit() {
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
    const amount = await questionAsync(rl, 'Masukkan jumlah yang ingin disetor: ');
    const depositAmount = parseInt(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      console.log('Jumlah tidak valid.');
      rl.close();
      return;
    }

    await db.query(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [depositAmount, user.id]
    );

    await db.query(
      'INSERT INTO transactions (account_id, type, amount) VALUES (?, ?, ?)',
      [user.id, 'deposit', depositAmount]
    );

    console.log(`Setor berhasil. Jumlah: ${formatRupiah(depositAmount)}`);

  } catch (err) {
    console.error('Terjadi kesalahan saat menyetor:', err.message);
  } finally {
    rl.close();
  }
}
module.exports = deposit;
