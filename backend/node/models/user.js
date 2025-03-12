const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: { 
      type: DataTypes.STRING, 
      allowNull: false,
      unique: true 
    },
    password: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    name: { 
      type: DataTypes.STRING 
    },
    email: { 
      type: DataTypes.STRING 
    },
    address: { 
      type: DataTypes.STRING 
    }
  }, {
    tableName: 'usuarios'
  });
};