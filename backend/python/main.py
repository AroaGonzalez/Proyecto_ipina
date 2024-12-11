from fastapi import FastAPI
from sqlalchemy import create_engine, Column, Integer, String, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración de la base de datos
DATABASE_URL = "mysql+mysqlconnector://root:root@mysqldb:3306/tienda"

engine = create_engine(DATABASE_URL)
Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Modelo de la tabla inventario
class Inventario(Base):
    __tablename__ = "inventario"
    id = Column(Integer, primary_key=True, index=True)
    nombre_producto = Column(String(255), nullable=False)
    cantidad = Column(Integer, nullable=False)
    ultima_actualizacion = Column(TIMESTAMP, nullable=False)

# Crear las tablas si no existen
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI()

# Ruta para obtener el inventario
@app.get("/inventario/")
async def get_inventario():
    session = SessionLocal()
    inventario = session.query(Inventario).all()
    session.close()
    return [{"id": item.id, "nombre_producto": item.nombre_producto, "cantidad": item.cantidad} for item in inventario]

# Ruta para crear un nuevo registro en el inventario
@app.post("/inventario/")
async def create_inventario(nombre_producto: str, cantidad: int):
    session = SessionLocal()
    nuevo_item = Inventario(nombre_producto=nombre_producto, cantidad=cantidad)
    session.add(nuevo_item)
    session.commit()
    session.refresh(nuevo_item)
    session.close()
    return {"id": nuevo_item.id, "nombre_producto": nuevo_item.nombre_producto, "cantidad": nuevo_item.cantidad}
