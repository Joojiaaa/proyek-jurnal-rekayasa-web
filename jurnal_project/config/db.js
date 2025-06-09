
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('jurnal_app', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

async function authenticate() {
  try {
    await sequelize.authenticate();
    console.log('Koneksi ke database berhasil!');
  } catch (error) {
    console.error('Gagal terkoneksi ke database:', error);
  }
}

authenticate();

module.exports = sequelize;
