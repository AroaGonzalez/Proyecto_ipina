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

  // Manejar la eliminación de un pedido
  const handleDelete = (id) => {
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    if (window.confirm("¿Estás seguro de que deseas eliminar este pedido?")) {
      axios
        .delete(`${BASE_URL}/pedidos/pendientes/${id}`, config)
        .then(() => {
          alert("Pedido eliminado exitosamente");
          // Actualizar la lista eliminando el pedido eliminado
          setPedidosPendientes((prevPedidos) =>
            prevPedidos.filter((pedido) => pedido._id !== id)
          );
        })
        .catch((error) => {
          console.error(
            "Error al eliminar el pedido:",
            error.response?.data || error.message
          );
          alert("No se pudo eliminar el pedido.");
        });
    }
  };

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
              <th>Acciones</th>
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
                    ? new Date(pedido.fechaFin).toLocaleString("es-ES", {
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                    : "Sin fecha asignada"}
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(pedido._id)}
                    className="delete-button">
                    Eliminar
                  </button>
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