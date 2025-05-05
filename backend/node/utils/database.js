const { Sequelize } = require('sequelize');

const commonOptions = {
  host: process.env.MYSQL_HOST || 'mysqldb',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  collation: 'utf8mb4_unicode_ci',
  dialectOptions: {
    charset: 'utf8mb4',
    connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
    maxPreparedStatements: 100,
    decimalNumbers: true,
    typeCast: function (field, next) {
      if (field.type === 'VAR_STRING' || field.type === 'STRING' || 
          field.type === 'BLOB' || field.type === 'TEXT') {
        const value = field.string();
        return value === null ? 'Sin estado' : value;
      }
      return next();
    }
  },
  pool: {
    max: 15,
    min: 3,
    acquire: 60000,
    idle: 10000,
    evict: 10000 
  },
  define: {
    timestamps: false
  },
  query: {
    raw: true
  },
  operatorsAliases: 0
};

const sequelizeAjenos = new Sequelize(
  'AJENOS',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || 'root',
  commonOptions
);

const sequelizeMaestros = new Sequelize(
  'MAESTROS',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || 'root',
  commonOptions
);


module.exports = {
  sequelizeAjenos,
  sequelizeMaestros
};