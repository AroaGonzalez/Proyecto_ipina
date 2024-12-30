// pendienteList.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PendienteList = () => {
  const [pedidosPendientes, setPedidosPendientes] = useState([]);

  // Cargar los pedidos pendientes desde el backend
  useEffect(() => {
    axios
      .get(`${BASE_URL}/pedidos/pendientes`) // Ruta del backend para pedidos pendientes
      .then((response) => {
        setPedidosPendientes(response.data); // Actualizar estado con los pedidos recibidos
      })
      .catch((error) =>
        console.error(
          "Error al obtener pedidos pendientes:",
          error.response?.data || error.message
        )
      );
  }, []);

  return (
    <div className="pendientes-container">
      <h2>Lista de Pedidos Pendientes</h2>
      {pedidosPendientes.length > 0 ? (
        <table className="pendiente-table">
          <thead>
            <tr>
              <th>Tienda ID</th>
              <th>Producto ID</th>
              <th>Cantidad</th>
              <th>Fecha Fin</th>
            </tr>
          </thead>
          <tbody>
            {pedidosPendientes.map((pedido) => (
              <tr key={pedido._id}>
                <td>{pedido.tiendaId}</td>
                <td>{pedido.productoId}</td>
                <td>{pedido.cantidadSolicitada}</td>
                <td>
                  {pedido.fechaFin
                    ? new Date(pedido.fechaFin).toLocaleString()
                    : "Sin fecha asignada"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay pedidos pendientes.</p>
      )}
    </div>
  );
};

export default PendienteList;