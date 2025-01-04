from fastapi import FastAPI
from sqlalchemy import create_engine, Column, Integer, String, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
import time

# Configuración de la base de datos
DATABASE_URL = "mysql+mysqlconnector://root:root@mysqldb:3306/tienda"

# Declarar la base y crear el motor fuera del bucle para evitar problemas de duplicación
Base = declarative_base()
engine = None
SessionLocal = None

# Bucle para reintentar la conexión con la base de datos
while True:
    try:
        print("Intentando conectar a la base de datos...")
        engine = create_engine(DATABASE_URL)
        # Probar la conexión
        connection = engine.connect()
        print("Conexión exitosa a la base de datos.")
        connection.close()
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        break
    except OperationalError as e:
        print(f"MySQL no está listo ({e}). Reintentando en 5 segundos...")
        time.sleep(5)

# Modelo para la tabla Tiendas
class Tienda(Base):
    __tablename__ = "tiendas"
    tiendaId = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    direccion = Column(String(255), nullable=False)

# Modelo para la tabla Inventario
class Inventario(Base):
    __tablename__ = "inventario"
    productoId = Column(Integer, primary_key=True, index=True)
    nombreProducto = Column(String(255), nullable=False)
    cantidad = Column(Integer, nullable=False)
    umbralMinimo = Column(Integer, nullable=False)
    ultimaActualizacion = Column(TIMESTAMP, nullable=False)

# Crear las tablas si no existen
print("Creando tablas si no existen...")
Base.metadata.create_all(bind=engine)

# Inicializar FastAPI
app = FastAPI()

# Habilitar CORS para permitir que el frontend acceda a la API
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia "*" por el dominio del frontend si es necesario
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta para obtener todos los registros del inventario
@app.get("/inventario/")
async def get_inventario():
    session = SessionLocal()
    try:
        inventario = session.query(Inventario).all()
        return [
            {
                "productoId": item.productoId,
                "nombreProducto": item.nombreProducto,
                "cantidad": item.cantidad,
                "umbralMinimo": item.umbralMinimo,
                "ultimaActualizacion": item.ultimaActualizacion,
            }
            for item in inventario
        ]
    finally:
        session.close()

# Ruta para crear un nuevo registro en el inventario
@app.post("/inventario/")
async def create_inventario(nombreProducto: str, cantidad: int, umbralMinimo: int):
    session = SessionLocal()
    try:
        nuevo_item = Inventario(
            nombreProducto=nombreProducto,
            cantidad=cantidad,
            umbralMinimo=umbralMinimo,
        )
        session.add(nuevo_item)
        session.commit()
        session.refresh(nuevo_item)
        return {
            "productoId": nuevo_item.productoId,
            "nombreProducto": nuevo_item.nombreProducto,
            "cantidad": nuevo_item.cantidad,
            "umbralMinimo": nuevo_item.umbralMinimo,
            "ultimaActualizacion": nuevo_item.ultimaActualizacion,
        }
    finally:
        session.close()

# Ruta para obtener todas las tiendas
@app.get("/tiendas/")
async def get_tiendas():
    session = SessionLocal()
    try:
        tiendas = session.query(Tienda).all()
        return [
            {"tiendaId": tienda.tiendaId, "nombre": tienda.nombre, "direccion": tienda.direccion}
            for tienda in tiendas
        ]
    finally:
        session.close()

# Ruta raíz para verificar el servicio
@app.get("/")
async def root():
    return {"message": "Python service is running!"}