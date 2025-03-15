#!/bin/bash
set -ex  # La opción 'x' hace que se impriman todos los comandos ejecutados

echo "Iniciando ejecución de scripts SQL en subdirectorios..."

echo "Esperando a que MySQL esté listo..."
until mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1"; do
  echo "MySQL no está listo - esperando..."
  sleep 3
done

echo "Creando esquemas manualmente primero..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE SCHEMA IF NOT EXISTS AJENOS; CREATE SCHEMA IF NOT EXISTS MAESTROS;"

echo "Listando archivos en directorios:"
ls -la /docker-entrypoint-initdb.d/01-schema/
ls -la /docker-entrypoint-initdb.d/02-data/

echo "Ejecutando scripts de esquema..."
for f in /docker-entrypoint-initdb.d/01-schema/*.sql; do
  echo "Ejecutando $f"
  cat "$f" | head -n 5  # Muestra las primeras 5 líneas
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" < "$f"
  RESULT=$?
  echo "Finalizado $f con código de salida $RESULT"
  if [ $RESULT -ne 0 ]; then
    echo "ERROR en script de esquema: $f"
  fi
done

# Verificar tablas creadas
echo "Verificando tablas en AJENOS:"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW TABLES IN AJENOS;"

# Ejecutar scripts de datos
echo "Ejecutando scripts de datos..."
for f in /docker-entrypoint-initdb.d/02-data/*.sql; do
  echo "Ejecutando $f"
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" < "$f"
  RESULT=$?
  if [ $RESULT -ne 0 ]; then
    echo "Error en $f con código $RESULT, continuando con el siguiente archivo..."
  else
    echo "Éxito al ejecutar $f"
  fi
done

echo "Verificando tablas después de insertar datos:"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW TABLES IN AJENOS; SELECT COUNT(*) FROM AJENOS.AJENO_IDIOMA;"

echo "Todos los scripts SQL han sido ejecutados."