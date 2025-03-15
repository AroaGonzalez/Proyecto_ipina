const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('AjenoRam', {
    idAjeno: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      field: 'ID_AJENO'
    },
    unidadesEmpaquetado: {
      type: DataTypes.DECIMAL(19, 4),
      field: 'UNIDADES_EMPAQUETADO'
    },
    multiploMinimo: {
      type: DataTypes.DECIMAL(19, 4),
      field: 'MULTIPLO_MINIMO'
    },
    idTipoEstadoRam: {
      type: DataTypes.INTEGER,
      field: 'ID_TIPO_ESTADO_AJENO_RAM'
    },
    idUnidadesMedida: {
      type: DataTypes.SMALLINT,
      field: 'ID_UNIDADES_MEDIDA'
    },
    imageRef: {
      type: DataTypes.STRING,
      field: 'IMAGE_REF'
    },
    nombreAjeno: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('NOMBRE');
      }
    },
    descripcionTipoEstadoRam: {
      type: DataTypes.VIRTUAL
    },
    idTipoEstadoCompras: {
      type: DataTypes.VIRTUAL
    },
    descripcionEstadoCompras: {
      type: DataTypes.VIRTUAL
    },
    descripcionUnidadesMedida: {
      type: DataTypes.VIRTUAL
    }
  }, {
    tableName: 'AJENO_RAM',
    timestamps: false
  });
};