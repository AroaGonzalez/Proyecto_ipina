import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../pedidosEliminadosList.css'; // Archivo CSS para estilos

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PedidosEliminadosList = () => {
  const [pedidosEliminados, setPedidosEliminados] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [filters, setFilters] = useState({
    tiendaId: '',
    productoId: '',
    cantidad: '',
    fechaPedido: '',
    fechaEliminacion: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    axios
      .get(`${BASE_URL}/pedidos-eliminados`, config)
      .then((response) => {
        setPedidosEliminados(response.data);
        setFilteredPedidos(response.data);
      })
      .catch((error) =>
        console.error('Error al cargar pedidos eliminados:', error)
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
    let filtered = pedidosEliminados;

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

    if (filters.fechaPedido) {
      filtered = filtered.filter((pedido) =>
        new Date(pedido.fechaPedido)
          .toLocaleDateString()
          .includes(filters.fechaPedido)
      );
    }

    if (filters.fechaEliminacion) {
      filtered = filtered.filter((pedido) =>
        new Date(pedido.fechaEliminacion)
          .toLocaleDateString()
          .includes(filters.fechaEliminacion)
      );
    }

    setFilteredPedidos(filtered);
  }, [filters, pedidosEliminados]);

  const handleDeleteForever = async (id) => {
    const confirmDelete = window.confirm('¿Eliminar definitivamente este pedido?');
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      await axios.delete(`${BASE_URL}/pedidos-eliminados/${id}`, config);
      alert('Pedido eliminado definitivamente');
      setPedidosEliminados((prevPedidos) =>
        prevPedidos.filter((pedido) => pedido._id !== id)
      );
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      alert('No se pudo eliminar el pedido.');
    }
  };

  return (
    <div className="pedidos-eliminados">
      <h2>Pedidos Eliminados</h2>

      {/* Filtros */}
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
          placeholder="Filtrar por Fecha Pedido"
          name="fechaPedido"
          value={filters.fechaPedido}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Filtrar por Fecha Eliminación"
          name="fechaEliminacion"
          value={filters.fechaEliminacion}
          onChange={handleFilterChange}
        />
      </div>

      {/* Tabla */}
      {filteredPedidos.length > 0 ? (
        <table className="custom-table">
          <thead>
            <tr>
              <th>Tienda</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Fecha Pedido</th>
              <th>Fecha Eliminación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPedidos.map((pedido) => (
              <tr key={pedido._id}>
                <td>{pedido.tiendaId}</td>
                <td>{pedido.productoId}</td>
                <td>{pedido.cantidadSolicitada}</td>
                <td>Eliminado</td>
                <td>{new Date(pedido.fechaPedido).toLocaleString()}</td>
                <td>{new Date(pedido.fechaEliminacion).toLocaleString()}</td>
                <td>
                  <button
                    className="delete-forever-btn"
                    onClick={() => handleDeleteForever(pedido._id)}
                  >
                    Eliminar definitivamente
                  </button>
                </td>
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