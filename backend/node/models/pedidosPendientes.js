import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PedidosPendientes = () => {
  const [pedidosPendientes, setPedidosPendientes] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // Obtener pedidos pendientes del backend
    axios
      .get(`${BASE_URL}/pedidos/pendientes`, config)
      .then((response) => {
        setPedidosPendientes(response.data);
      })
      .catch((error) =>
        console.error("Error al obtener pedidos pendientes:", error)
      );
  }, []);

  return (
    <div className="pedido-pendiente-container">
      <h2>Lista de Pedidos Pendientes</h2>
      {pedidosPendientes.length > 0 ? (
        <table className="pedido-table">
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
                <td>{pedido.fechaFin || "Sin fecha asignada"}</td>
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

export default PedidosPendientes;