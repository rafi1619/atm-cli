const db = require('../db/connection');
const session = require('../utils/session');
const { formatRupiah } = require('../utils/formatRupiah');
const Table = require('cli-table3');

async function history() {
  const user = session.getCurrentUser();
  if (!user) {
    console.log('Silakan login terlebih dahulu.');
    return;
  }
  
  try {
    const [transactions] = await db.query(
      'SELECT type, amount, created_at FROM transactions WHERE account_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    if (transactions.length === 0) {
      console.log('Belum ada transaksi.');
      return;
    }
    const table = new Table({
      head: ['No', 'Tanggal', 'Waktu', 'Jenis Transaksi', 'Jumlah'],
      colWidths: [5, 20, 15, 25, 20],
      style: {
        head: ['cyan'],
        border: ['grey'],
        compact: true
      }
    });

    transactions.forEach((tx, index) => {
      const date = new Date(tx.created_at).toLocaleDateString('id-ID', {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      
      const time = new Date(tx.created_at).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const jenisTx = tx.type.toUpperCase().replace(/_/g, ' ');
      const jumlah = formatRupiah(tx.amount);
      
      table.push([
        index + 1,
        date,
        time,
        jenisTx,
        jumlah
      ]);
    });

    console.log('\nRIWAYAT TRANSAKSI ');
    console.log(table.toString());

  } catch (err) {
    console.error('Gagal mengambil riwayat transaksi:', err.message);
  }
}

module.exports = history;