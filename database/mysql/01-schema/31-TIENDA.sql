CREATE TABLE IF NOT EXISTS MAESTROS.TIENDA (
    ID_TIENDA INTEGER NOT NULL,
    NOMBRE_TIENDA VARCHAR(1400) NOT NULL,
    ID_TIPO_TIENDA SMALLINT NOT NULL,
    ID_CADENA SMALLINT NOT NULL,
    NOMBRE_CORTO VARCHAR(500) NULL,
    HUSO_HORARIO VARCHAR(500) NULL,
    LATITUD DECIMAL(11,8) NULL,
    LONGITUD DECIMAL(11,8) NULL,
    FECHA_ALTA TIMESTAMP NOT NULL,
    USUARIO_ALTA VARCHAR(500) NOT NULL,
    FECHA_MODIFICACION TIMESTAMP NULL,
    USUARIO_MODIFICACION VARCHAR(500) NULL,
    ID_TARIFA INTEGER NULL,
    ID_TIPO_DESCARGA SMALLINT NULL,
    RECOGIDA_FONDOS DECIMAL(1,0) NULL,
    VALIDADA DECIMAL(1,0) NULL,
    ID_TIPO_APERTURA SMALLINT NULL,
    PRIMARY KEY (ID_TIENDA)
);