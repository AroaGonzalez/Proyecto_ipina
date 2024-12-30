import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PendientesList = () => {
  const [pendientes, setPendientes] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    axios
      .get('http://localhost:5000/pedidos/pendientes', config)
      .then((response) => setPendientes(response.data))
      .catch((error) => console.error('Error al obtener pedidos pendientes:', error));
  }, []);

  return (
    <div>
      <h2>Pedidos Pendientes</h2>
      <ul>
        {pendientes.map((pedido) => (
          <li key={pedido._id}>
            Tienda: {pedido.tiendaId}, Producto: {pedido.productoId}, Fecha Fin: {new Date(pedido.fechaFin).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PendientesList;