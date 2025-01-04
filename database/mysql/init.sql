-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS tienda;

-- Usar la base de datos
USE tienda;

-- Crear la tabla "tiendas"
CREATE TABLE IF NOT EXISTS tiendas (
    tiendaId INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion VARCHAR(255) NOT NULL
);

-- Insertar datos iniciales para 40 tiendas con IDs del 1 al 40
INSERT INTO tiendas (tiendaId, nombre, direccion)
VALUES
    (1, 'Zara Gran Vía', 'Gran Vía 32, Madrid'),
    (2, 'Pull&Bear Barcelona', 'Paseo de Gracia 11, Barcelona'),
    (3, 'Bershka Valencia', 'Calle Colón 36, Valencia'),
    (4, 'Massimo Dutti Sevilla', 'Avenida de la Constitución 22, Sevilla'),
    (5, 'Zara Home Málaga', 'Calle Marqués de Larios 4, Málaga'),
    (6, 'Stradivarius Bilbao', 'Gran Vía 20, Bilbao'),
    (7, 'Oysho Zaragoza', 'Paseo de la Independencia 24, Zaragoza'),
    (8, 'Zara Coruña', 'Calle Real 74, A Coruña'),
    (9, 'Pull&Bear Vigo', 'Príncipe 33, Vigo'),
    (10, 'Massimo Dutti Palma', 'Calle Sant Miquel 15, Palma de Mallorca'),
    (11, 'Bershka Salamanca', 'Calle Toro 42, Salamanca'),
    (12, 'Zara Home Alicante', 'Avenida Maisonnave 17, Alicante'),
    (13, 'Stradivarius Córdoba', 'Calle Cruz Conde 18, Córdoba'),
    (14, 'Oysho San Sebastián', 'Calle Mayor 5, San Sebastián'),
    (15, 'Massimo Dutti Valladolid', 'Calle Santiago 12, Valladolid'),
    (16, 'Pull&Bear Almería', 'Paseo de Almería 27, Almería'),
    (17, 'Bershka León', 'Calle Ancha 11, León'),
    (18, 'Zara Tarragona', 'Rambla Nova 59, Tarragona'),
    (19, 'Zara Home Burgos', 'Calle Vitoria 15, Burgos'),
    (20, 'Oysho Granada', 'Calle Recogidas 22, Granada'),
    (21, 'Massimo Dutti Cáceres', 'Avenida de España 8, Cáceres'),
    (22, 'Stradivarius Santander', 'Calle Burgos 7, Santander'),
    (23, 'Zara Logroño', 'Calle Bretón de los Herreros 12, Logroño'),
    (24, 'Pull&Bear Huelva', 'Calle Concepción 16, Huelva'),
    (25, 'Bershka Albacete', 'Calle Mayor 25, Albacete'),
    (26, 'Massimo Dutti Castellón', 'Plaza Mayor 3, Castellón de la Plana'),
    (27, 'Oysho Toledo', 'Calle Comercio 20, Toledo'),
    (28, 'Zara Mérida', 'Calle Santa Eulalia 5, Mérida'),
    (29, 'Stradivarius Oviedo', 'Calle Uría 37, Oviedo'),
    (30, 'Zara Home Pamplona', 'Avenida Carlos III 18, Pamplona'),
    (31, 'Bershka Guadalajara', 'Calle Mayor 10, Guadalajara'),
    (32, 'Pull&Bear Lugo', 'Rúa San Marcos 22, Lugo'),
    (33, 'Oysho Cuenca', 'Calle Carretería 15, Cuenca'),
    (34, 'Zara Jaén', 'Calle Bernabé Soriano 9, Jaén'),
    (35, 'Massimo Dutti Elche', 'Calle Obispo Tormo 1, Elche'),
    (36, 'Stradivarius Pontevedra', 'Rúa Michelena 13, Pontevedra'),
    (37, 'Zara Cádiz', 'Calle Columela 30, Cádiz'),
    (38, 'Bershka Gijón', 'Calle Corrida 15, Gijón'),
    (39, 'Pull&Bear San Fernando', 'Calle Real 132, San Fernando'),
    (40, 'Oysho Getafe', 'Calle Madrid 3, Getafe');

-- Crear la tabla "inventario"
CREATE TABLE IF NOT EXISTS inventario (
    productoId INT PRIMARY KEY,
    nombreProducto VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL,
    umbralMinimo INT NOT NULL,
    ultimaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar datos iniciales en "inventario" con IDs del 1 al 20
INSERT INTO inventario (productoId, nombreProducto, cantidad, umbralMinimo)
VALUES
    (1, 'Camisa', 100, 10),
    (2, 'Pantalón', 100, 10),
    (3, 'Vestido', 100, 15),
    (4, 'Falda', 100, 10),
    (5, 'Blusa', 100, 15),
    (6, 'Zapatos', 100, 5),
    (7, 'Zapatillas', 100, 10),
    (8, 'Chaqueta', 100, 8),
    (9, 'Abrigo', 100, 12),
    (10, 'Sudadera', 100, 15),
    (11, 'Chaleco', 100, 7),
    (12, 'Camiseta', 100, 20),
    (13, 'Short', 100, 8),
    (14, 'Bañador', 100, 5),
    (15, 'Bufanda', 100, 10),
    (16, 'Sombrero', 100, 12),
    (17, 'Guantes', 100, 15),
    (18, 'Calcetines', 100, 5),
    (19, 'Reloj', 100, 10),
    (20, 'Bolso', 100, 15);

-- Crear índices para optimizar consultas
CREATE INDEX idx_productoId ON inventario (productoId);
CREATE INDEX idx_nombreProducto ON inventario (nombreProducto);
