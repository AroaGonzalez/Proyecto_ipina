CREATE DATABASE IF NOT EXISTS tienda;

USE tienda;

CREATE TABLE IF NOT EXISTS tiendas (
    tiendaId INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion VARCHAR(255) NOT NULL
);

INSERT INTO tiendas (tiendaId, nombre, direccion)
VALUES
    (1, 'Zara Gran Via', 'Gran Via 32, Madrid'),
    (2, 'Pull&Bear Barcelona', 'Paseo de Gracia 11, Barcelona'),
    (3, 'Bershka Valencia', 'Calle Colon 36, Valencia'),
    (4, 'Massimo Dutti Sevilla', 'Avenida de la Constitucion 22, Sevilla'),
    (5, 'Zara Home Malaga', 'Calle Marques de Larios 4, Málaga'),
    (6, 'Stradivarius Bilbao', 'Gran Via 20, Bilbao'),
    (7, 'Oysho Zaragoza', 'Paseo de la Independencia 24, Zaragoza'),
    (8, 'Zara Coruña', 'Calle Real 74, A Coruña'),
    (9, 'Pull&Bear Vigo', 'Principe 33, Vigo'),
    (10, 'Massimo Dutti Palma', 'Calle Sant Miquel 15, Palma de Mallorca'),
    (11, 'Bershka Salamanca', 'Calle Toro 42, Salamanca'),
    (12, 'Zara Home Alicante', 'Avenida Maisonnave 17, Alicante'),
    (13, 'Stradivarius Cordoba', 'Calle Cruz Conde 18, Cordoba'),
    (14, 'Oysho San Sebastian', 'Calle Mayor 5, San Sebastian'),
    (15, 'Massimo Dutti Valladolid', 'Calle Santiago 12, Valladolid'),
    (16, 'Pull&Bear Almeria', 'Paseo de Almeria 27, Almeria'),
    (17, 'Bershka Leon', 'Calle Ancha 11, Leon'),
    (18, 'Zara Tarragona', 'Rambla Nova 59, Tarragona'),
    (19, 'Zara Home Burgos', 'Calle Vitoria 15, Burgos'),
    (20, 'Oysho Granada', 'Calle Recogidas 22, Granada'),
    (21, 'Massimo Dutti Caceres', 'Avenida de España 8, Caceres'),
    (22, 'Stradivarius Santander', 'Calle Burgos 7, Santander'),
    (23, 'Zara Logroño', 'Calle Breton de los Herreros 12, Logroño'),
    (24, 'Pull&Bear Huelva', 'Calle Concepcion 16, Huelva'),
    (25, 'Bershka Albacete', 'Calle Mayor 25, Albacete'),
    (26, 'Massimo Dutti Castellon', 'Plaza Mayor 3, Castellon de la Plana'),
    (27, 'Oysho Toledo', 'Calle Comercio 20, Toledo'),
    (28, 'Zara Merida', 'Calle Santa Eulalia 5, Merida'),
    (29, 'Stradivarius Oviedo', 'Calle Uria 37, Oviedo'),
    (30, 'Zara Home Pamplona', 'Avenida Carlos III 18, Pamplona'),
    (31, 'Bershka Guadalajara', 'Calle Mayor 10, Guadalajara'),
    (32, 'Pull&Bear Lugo', 'Rúa San Marcos 22, Lugo'),
    (33, 'Oysho Cuenca', 'Calle Carreteria 15, Cuenca'),
    (34, 'Zara Jaen', 'Calle Bernabe Soriano 9, Jaén'),
    (35, 'Massimo Dutti Elche', 'Calle Obispo Tormo 1, Elche'),
    (36, 'Stradivarius Pontevedra', 'Rua Michelena 13, Pontevedra'),
    (37, 'Zara Cadiz', 'Calle Columela 30, Cadiz'),
    (38, 'Bershka Gijon', 'Calle Corrida 15, Gijon'),
    (39, 'Pull&Bear San Fernando', 'Calle Real 132, San Fernando'),
    (40, 'Oysho Getafe', 'Calle Madrid 3, Getafe');

CREATE TABLE IF NOT EXISTS inventario (
    idArticulo INT PRIMARY KEY AUTO_INCREMENT,
    articulo VARCHAR(255) NOT NULL,
    estado ENUM('Activo', 'Pausado') NOT NULL DEFAULT 'Activo'
);

-- Insertar algunos valores de ejemplo
INSERT INTO inventario (articulo, estado) VALUES
    ('Camisa', 'Activo'),
    ('Pantalón', 'Activo'),
    ('Vestido', 'Activo'),
    ('Falda', 'Activo'),
    ('Blusa', 'Activo'),
    ('Zapatos', 'Activo'),
    ('Zapatillas', 'Activo'),
    ('Chaqueta', 'Activo'),
    ('Abrigo', 'Activo'),
    ('Sudadera', 'Activo'),
    ('Chaleco', 'Activo');

CREATE INDEX idx_idArticulo ON inventario (idArticulo);
CREATE INDEX idx_articulo ON inventario (articulo);