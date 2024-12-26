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
          {inventarios.map((item) => (
            <tr key={item._id} className={item.cantidad < item.umbralMinimo ? 'low-stock' : ''}>
              <td>{item.productoId}</td>
              <td>{item.nombreProducto}</td>
              <td>{item.cantidad}</td>
              <td>{item.cantidad < item.umbralMinimo ? 'Bajo Stock' : 'Suficiente'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventarioList;