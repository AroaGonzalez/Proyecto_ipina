const { Sequelize } = require('sequelize');

// Configuración de opciones comunes para ambas conexiones
const commonOptions = {
  host: process.env.MYSQL_HOST || 'mysqldb',
  dialect: 'mysql',
  logging: console.log,
  dialectOptions: {
    // Asegurar codificación UTF8 para todos los datos
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // Manejo personalizado de tipos para evitar problemas con campos especiales
    typeCast: function (field, next) {
      // Para el caso de VARGRAPHIC/GRAPHIC/VARCHAR que pueden causar problemas
      if (field.type === 'VAR_STRING' || field.type === 'STRING' || 
          field.type === 'BLOB' || field.type === 'TEXT') {
        const value = field.string();
        return value === null ? 'Sin estado' : value;
      }
      return next();
    }
  },
  // Opciones para mejorar la gestión de consultas
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Opciones de consulta predeterminadas
  query: {
    raw: false // Cambia a true si prefieres objetos planos en lugar de instancias de modelo
  }
};

// Configuración para AJENOS
const sequelizeAjenos = new Sequelize(
  'AJENOS',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || 'root',
  commonOptions
);

// Configuración para MAESTROS
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