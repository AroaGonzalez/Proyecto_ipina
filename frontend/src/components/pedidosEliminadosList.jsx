import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../pedidosEliminadosList.css'; // Archivo CSS para estilos

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PedidosEliminadosList = () => {
  const [pedidosEliminados, setPedidosEliminados] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    axios
      .get(`${BASE_URL}/pedidos-eliminados`, config)
      .then((response) => setPedidosEliminados(response.data))
      .catch((error) => console.error('Error al cargar pedidos eliminados:', error));
  }, []);

  return (
    <div className="pedidos-eliminados">
      <h2>Pedidos Eliminados</h2>
      {pedidosEliminados.length > 0 ? (
        <table className="custom-table">
          <thead>
            <tr>
              <th>Tienda</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Fecha Pedido</th>
              <th>Fecha Eliminación</th>
            </tr>
          </thead>
          <tbody>
            {pedidosEliminados.map((pedido) => (
              <tr key={pedido._id}>
                <td>{pedido.tiendaId}</td>
                <td>{pedido.productoId}</td>
                <td>{pedido.cantidadSolicitada}</td>
                {/* Estado fijo como "Eliminado" */}
                <td>Eliminado</td>
                <td>{new Date(pedido.fechaPedido).toLocaleString()}</td>
                <td>{new Date(pedido.fechaEliminacion).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay pedidos eliminados registrados.</p>
      )}
    </div>
  );
};

export default PedidosEliminadosList;