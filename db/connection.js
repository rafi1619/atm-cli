const mysql = require('mysql2/promise'); 
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'rafi1607',
  database: 'atm_cli',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
module.exports = connection;
