const db = require('../db/connection');
const session = require('../utils/session');
const { formatRupiah } = require('../utils/formatRupiah');

async function checkBalance() {
  const user = session.getCurrentUser();
  if (!user) {
    console.log('Silakan login terlebih dahulu.');
    return;
  }
  try {
    const [results] = await db.query('SELECT balance FROM accounts WHERE id = ?', [user.id]);

    if (!results || results.length === 0) {
      console.log('Data saldo tidak ditemukan.');
      return;
    }
    const balance = Number(results[0].balance);
    console.log(`Saldo saat ini: ${formatRupiah(balance)}`);
  } catch (err) {
    console.error('Gagal mengambil saldo:', err.message);
  }
}
module.exports = checkBalance;
