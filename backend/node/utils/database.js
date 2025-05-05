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

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 10000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function connectWithRetry() {
  let retries = MAX_RETRIES;
  
  while (retries > 0) {
    try {
      await sequelizeAjenos.authenticate();
      await sequelizeMaestros.authenticate();
      
      console.log('✅ Conexión a MySQL establecida correctamente.');
      
      await sequelizeAjenos.sync({ alter: true });
      await sequelizeMaestros.sync({ alter: true });
      
      console.log('✅ Tablas sincronizadas correctamente.');
      return;
    } catch (error) {
      console.error('Error al conectar o sincronizar con MySQL:', error.message);
      retries -= 1;
      
      if (retries > 0) {
        console.log(`Reintentando conexión en ${RETRY_INTERVAL/1000} segundos (${retries} intentos restantes)...`);
        await sleep(RETRY_INTERVAL);
      }
    }
  }
  
  if (retries === 0) {
    console.error('No se pudo conectar a MySQL después de varios intentos.');
    process.exit(1);
  }
}

connectWithRetry();

module.exports = {
  sequelizeAjenos,
  sequelizeMaestros
};