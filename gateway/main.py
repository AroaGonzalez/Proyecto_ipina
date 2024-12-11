from fastapi import FastAPI, HTTPException
import requests

app = FastAPI()

# Ruta para obtener el inventario desde python-service
@app.get("/inventario/")
async def get_inventario():
    try:
        # Realizar una solicitud GET al servicio Python
        response = requests.get("http://python-service:8000/inventario/")
        response.raise_for_status()  # Lanza una excepción si la respuesta tiene un error HTTP
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))

# Ruta para crear un nuevo registro en el inventario
@app.post("/inventario/")
async def create_inventario(nombre_producto: str, cantidad: int):
    try:
        # Realizar una solicitud POST al servicio Python
        response = requests.post(
            "http://python-service:8000/inventario/",
            json={"nombre_producto": nombre_producto, "cantidad": cantidad}
        )
        response.raise_for_status()  # Lanza una excepción si la respuesta tiene un error HTTP
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))
