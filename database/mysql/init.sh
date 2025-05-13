set -e

echo "Iniciando ejecución de scripts SQL..."

echo "Esperando a que MySQL esté listo..."
until mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" &>/dev/null; do
  echo "MySQL no está listo - esperando..."
  sleep 3
done

echo "MySQL está listo. Creando esquemas..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE SCHEMA IF NOT EXISTS AJENOS; CREATE SCHEMA IF NOT EXISTS MAESTROS;"

if [ -d "/docker-entrypoint-initdb.d/01-schema" ]; then
  echo "Ejecutando scripts de esquema..."
  for f in /docker-entrypoint-initdb.d/01-schema/*.sql; do
    if [ -f "$f" ]; then
      echo "Ejecutando esquema: $f"
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" < "$f"
      RESULT=$?
      
      if [ $RESULT -ne 0 ]; then
        echo "ERROR al ejecutar esquema: $f (código $RESULT)"
      else
        echo "Esquema ejecutado correctamente: $f"
      fi
    fi
  done
fi

if [ -d "/docker-entrypoint-initdb.d/02-data" ]; then
  echo "Ejecutando scripts de datos..."
  for f in /docker-entrypoint-initdb.d/02-data/*.sql; do
    if [ -f "$f" ]; then
      echo "Ejecutando datos: $f"
      mysql -u root -p"$MYSQL_ROOT_PASSWORD" < "$f"
      RESULT=$?
      
      if [ $RESULT -ne 0 ]; then
        echo "ERROR al ejecutar datos: $f (código $RESULT)"
      else
        echo "Datos ejecutados correctamente: $f"
      fi
    fi
  done
fi

echo "Verificando datos insertados:"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT COUNT(*) AS 'Estados' FROM MAESTROS.ESTADO_TIENDA;"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT COUNT(*) AS 'Estados Idioma' FROM MAESTROS.ESTADO_TIENDA_IDIOMA;"

echo "Creando índices para optimizar rendimiento de consultas..."

mysql -u root -p"$MYSQL_ROOT_PASSWORD" << 'EOF'
USE MAESTROS;

-- Crear índices para TIENDA_HISTORICO
SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'MAESTROS' AND table_name = 'TIENDA_HISTORICO' 
AND index_name = 'idx_tienda_historico_estado_vigente';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_tienda_historico_estado_vigente ON TIENDA_HISTORICO(ESTADO_VIGENTE, ID_TIENDA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'MAESTROS' AND table_name = 'TIENDA_HISTORICO' 
AND index_name = 'idx_tienda_historico_estado';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_tienda_historico_estado ON TIENDA_HISTORICO(ID_ESTADO_TIENDA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
EOF

mysql -u root -p"$MYSQL_ROOT_PASSWORD" << 'EOF'
USE MAESTROS;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'MAESTROS' AND table_name = 'GRUPO_CADENA' 
AND index_name = 'idx_grupo_cadena_tipo';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_grupo_cadena_tipo ON GRUPO_CADENA(ID_TIPO_GRUPO_CADENA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
EOF

mysql -u root -p"$MYSQL_ROOT_PASSWORD" << 'EOF'
USE MAESTROS;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'MAESTROS' AND table_name = 'TIENDA' 
AND index_name = 'idx_tienda_tipo';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_tienda_tipo ON TIENDA(ID_TIPO_TIENDA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
EOF

mysql -u root -p"$MYSQL_ROOT_PASSWORD" << 'EOF'
USE MAESTROS;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'MAESTROS' AND table_name = 'GRUPO_CADENA_CADENA' 
AND index_name = 'idx_grupo_cadena_cadena_cadena';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_grupo_cadena_cadena_cadena ON GRUPO_CADENA_CADENA(ID_CADENA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'MAESTROS' AND table_name = 'GRUPO_CADENA_CADENA' 
AND index_name = 'idx_grupo_cadena_cadena_grupo';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_grupo_cadena_cadena_grupo ON GRUPO_CADENA_CADENA(ID_GRUPO_CADENA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
EOF

mysql -u root -p"$MYSQL_ROOT_PASSWORD" << 'EOF'
USE MAESTROS;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'MAESTROS' AND table_name = 'ESTADO_TIENDA_IDIOMA' 
AND index_name = 'idx_estado_tienda_idioma';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_estado_tienda_idioma ON ESTADO_TIENDA_IDIOMA(ID_ESTADO_TIENDA, ID_IDIOMA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'MAESTROS' AND table_name = 'PAIS_IDIOMA' 
AND index_name = 'idx_pais_idioma';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_pais_idioma ON PAIS_IDIOMA(ID_PAIS, ID_IDIOMA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
EOF

mysql -u root -p"$MYSQL_ROOT_PASSWORD" << 'EOF'
USE AJENOS;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'AJENOS' AND table_name = 'LOCALIZACION_COMPRA' 
AND index_name = 'idx_localizacion_compra_fecha_baja';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_localizacion_compra_fecha_baja ON LOCALIZACION_COMPRA(FECHA_BAJA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'AJENOS' AND table_name = 'LOCALIZACION_COMPRA' 
AND index_name = 'idx_localizacion_compra_localizacion';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_localizacion_compra_localizacion ON LOCALIZACION_COMPRA(ID_LOCALIZACION)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
EOF

mysql -u root -p"$MYSQL_ROOT_PASSWORD" << 'EOF'
USE AJENOS;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'AJENOS' AND table_name = 'LOCALIZACION_COMPRA' 
AND index_name = 'idx_localizacion_compra_pais';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_localizacion_compra_pais ON LOCALIZACION_COMPRA(ID_PAIS)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'AJENOS' AND table_name = 'LOCALIZACION_COMPRA' 
AND index_name = 'idx_localizacion_compra_cadena';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_localizacion_compra_cadena ON LOCALIZACION_COMPRA(ID_CADENA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
EOF

mysql -u root -p"$MYSQL_ROOT_PASSWORD" << 'EOF'
USE AJENOS;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'AJENOS' AND table_name = 'LOCALIZACION_COMPRA_RAM' 
AND index_name = 'idx_localizacion_compra_ram';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_localizacion_compra_ram ON LOCALIZACION_COMPRA_RAM(ID_LOCALIZACION_COMPRA)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @exists FROM information_schema.statistics 
WHERE table_schema = 'AJENOS' AND table_name = 'LOCALIZACION_COMPRA_RAM' 
AND index_name = 'idx_localizacion_ram_tipo_estado';
SET @sql = CASE WHEN @exists = 0 THEN 
'CREATE INDEX idx_localizacion_ram_tipo_estado ON LOCALIZACION_COMPRA_RAM(ID_TIPO_ESTADO_LOCALIZACION_RAM)'
ELSE 'SELECT 1' END;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
EOF

echo "Verificando índices en MAESTROS.TIENDA_HISTORICO:"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW INDEX FROM MAESTROS.TIENDA_HISTORICO;"

echo "Verificando índices en AJENOS.LOCALIZACION_COMPRA:"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW INDEX FROM AJENOS.LOCALIZACION_COMPRA;"

echo "Todos los scripts SQL e índices han sido ejecutados."