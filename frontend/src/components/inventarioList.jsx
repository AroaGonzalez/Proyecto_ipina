import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function InventarioList() {
  const [inventarios, setInventarios] = useState([]);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/inventario`)
      .then((response) => setInventarios(response.data))
      .catch((error) => console.error('Error al obtener inventario:', error));
  }, []);

  return (
    <div className="inventario-list">
      <h2>Inventario Actual</h2>
      <table className="tabla-inventario">
        <thead>
          <tr>
            <th>Producto ID</th>
            <th>Nombre</th>
            <th>Cantidad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {inventarios.map((item) => {
            // Determinar la clase CSS según la cantidad
            let claseCantidad = '';
            if (item.cantidad > 50) {
              claseCantidad = 'cantidad-verde';
            } else if (item.cantidad > 20) {
              claseCantidad = 'cantidad-amarillo';
            } else if (item.cantidad > 0) {
              claseCantidad = 'cantidad-rojo-claro';
            } else {
              claseCantidad = 'cantidad-rojo-oscuro';
            }

            return (
              <tr key={item._id}>
                <td>{item.productoId}</td>
                <td>{item.nombreProducto}</td>
                <td className={claseCantidad}>{item.cantidad}</td>
                <td>{item.cantidad > 0 ? 'Suficiente' : 'Agotado'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InventarioList;