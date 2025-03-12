#!/bin/bash
set -ex  # La opción 'x' hace que se impriman todos los comandos ejecutados

echo "Iniciando ejecución de scripts SQL en subdirectorios..."

echo "Esperando a que MySQL esté listo..."
until mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1"; do
  echo "MySQL no está listo - esperando..."
  sleep 3
done

echo "Listando archivos en directorios:"
ls -la /docker-entrypoint-initdb.d/01-schema/
ls -la /docker-entrypoint-initdb.d/02-data/

echo "Ejecutando scripts de esquema..."
for f in /docker-entrypoint-initdb.d/01-schema/*.sql; do
  echo "Ejecutando $f"
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" < "$f"
  echo "Finalizado $f con código de salida $?"
done

# Ejecutar scripts de datos
echo "Ejecutando scripts de datos..."
for f in /docker-entrypoint-initdb.d/02-data/*.sql; do
  echo "Ejecutando $f"
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" < "$f" || echo "Error en $f, continuando con el siguiente archivo..."
done

echo "Todos los scripts SQL han sido ejecutados."