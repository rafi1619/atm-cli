function formatRupiah(number) {
  if (typeof number !== 'number') number = Number(number);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
}

module.exports = { formatRupiah };
