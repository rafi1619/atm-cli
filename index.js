const { Command } = require('commander');
const program = new Command();
const register = require('./commands/register');
const login = require('./commands/login');
const checkBalance = require('./commands/checkBalance');
const deposit = require('./commands/deposit');
const withdraw = require('./commands/withdraw');
const transfer = require('./commands/transfer');

program
  .name('atm-cli')
  .description('Simulasi Mesin ATM CLI')
  .version('1.0.0');
program
  .command('register')
  .description('Registrasi akun baru')
  .action(register);
program
  .command('login')
  .description('Login ke akun')
  .action(login);
program
  .command('check-balance')
  .description('Cek saldo akun')
  .action(checkBalance);
program
  .command('deposit')
  .description('Setor uang')
  .action(deposit);
program
  .command('withdraw')
  .description('Tarik tunai')
  .action(withdraw);
program
  .command('transfer')
  .description('Transfer uang ke akun lain')
  .action(transfer);
program.parse(process.argv);
