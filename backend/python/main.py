from fastapi import FastAPI
from sqlalchemy import create_engine, Column, Integer, String, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
import time

DATABASE_URL = "mysql+mysqlconnector://root:root@mysqldb:3306/tienda"

Base = declarative_base()
engine = None
SessionLocal = None

while True:
    try:
        print("Intentando conectar a la base de datos...")
        engine = create_engine(DATABASE_URL)
        connection = engine.connect()
        print("Conexión exitosa a la base de datos.")
        connection.close()
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        break
    except OperationalError as e:
        print(f"MySQL no está listo ({e}). Reintentando en 5 segundos...")
        time.sleep(5)

class Tienda(Base):
    __tablename__ = "tiendas"
    tiendaId = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    direccion = Column(String(255), nullable=False)

class Inventario(Base):
    __tablename__ = "inventario"
    productoId = Column(Integer, primary_key=True, index=True)
    nombreProducto = Column(String(255), nullable=False)
    cantidad = Column(Integer, nullable=False)
    umbralMinimo = Column(Integer, nullable=False)
    ultimaActualizacion = Column(TIMESTAMP, nullable=False)

print("Creando tablas si no existen...")
Base.metadata.create_all(bind=engine)

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
async def root():
    return {"message": "Python service is running!"}