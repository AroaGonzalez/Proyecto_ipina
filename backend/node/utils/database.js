const { Sequelize } = require('sequelize');

// Configuración para AJENOS
const sequelizeAjenos = new Sequelize(
  'AJENOS',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || 'root',
  {
    host: process.env.MYSQL_HOST || 'mysqldb',
    dialect: 'mysql',
    logging: console.log,
  }
);

// Configuración para MAESTROS
const sequelizeMaestros = new Sequelize(
  'MAESTROS',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || 'root',
  {
    host: process.env.MYSQL_HOST || 'mysqldb',
    dialect: 'mysql',
    logging: console.log,
  }
);

module.exports = {
  sequelizeAjenos,
  sequelizeMaestros
};