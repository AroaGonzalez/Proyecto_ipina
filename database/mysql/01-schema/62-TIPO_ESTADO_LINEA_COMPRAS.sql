CREATE TABLE IF NOT EXISTS AJENOS.TIPO_ESTADO_LINEA_COMPRAS (
    ID_TIPO_ESTADO_LINEA_COMPRAS SMALLINT NOT NULL,
    DESCRIPCION VARCHAR(500) NOT NULL,
    FECHA_ALTA TIMESTAMP NOT NULL,
    USUARIO_ALTA VARCHAR(140) NOT NULL,
    FECHA_MODIFICACION TIMESTAMP NULL,
    USUARIO_MODIFICACION VARCHAR(140) NULL,
    FECHA_BAJA TIMESTAMP NULL,
    USUARIO_BAJA VARCHAR(140) NULL,
    PRIMARY KEY (ID_TIPO_ESTADO_LINEA_COMPRAS)
);