import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PendienteList = () => {
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [filters, setFilters] = useState({
    tiendaId: "",
    productoId: "",
    cantidad: "",
    fechaFin: "",
  });

  useEffect(() => {
    axios
      .get(`${BASE_URL}/pedidos/pendientes`)
      .then((response) => {
        setPedidosPendientes(response.data);
        setFilteredPedidos(response.data);
      })
      .catch((error) =>
        console.error(
          "Error al obtener pedidos pendientes:",
          error.response?.data || error.message
        )
      );
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  useEffect(() => {
    let filtered = pedidosPendientes;

    if (filters.tiendaId) {
      filtered = filtered.filter((pedido) =>
        pedido.tiendaId.toString().includes(filters.tiendaId)
      );
    }

    if (filters.productoId) {
      filtered = filtered.filter((pedido) =>
        pedido.productoId.toString().includes(filters.productoId)
      );
    }

    if (filters.cantidad) {
      filtered = filtered.filter((pedido) =>
        pedido.cantidadSolicitada.toString().includes(filters.cantidad)
      );
    }

    if (filters.fechaFin) {
      filtered = filtered.filter((pedido) =>
        pedido.fechaFin &&
        new Date(pedido.fechaFin)
          .toLocaleDateString("es-ES")
          .includes(filters.fechaFin)
      );
    }

    setFilteredPedidos(filtered);
  }, [filters, pedidosPendientes]);

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
          setPedidosPendientes((prevPedidos) =>
            prevPedidos.filter((pedido) => pedido._id !== id)
          );
          setFilteredPedidos((prevPedidos) =>
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

      <div className="filters-container">
        <input
          type="text"
          placeholder="Filtrar por Tienda ID"
          name="tiendaId"
          value={filters.tiendaId}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Filtrar por Producto ID"
          name="productoId"
          value={filters.productoId}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Filtrar por Cantidad"
          name="cantidad"
          value={filters.cantidad}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Filtrar por Fecha Fin (DD/MM/YYYY)"
          name="fechaFin"
          value={filters.fechaFin}
          onChange={handleFilterChange}
        />
      </div>

      {filteredPedidos.length > 0 ? (
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
            {filteredPedidos.map((pedido) => (
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
                    className="delete-button"
                  >
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