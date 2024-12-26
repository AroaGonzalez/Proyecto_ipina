import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PedidoList() {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]); // Pedidos filtrados
  const [filters, setFilters] = useState({
    tiendaId: '',
    estado: '',
    fecha: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    axios
      .get(`${BASE_URL}/pedidos`, config)
      .then((response) => {
        setPedidos(response.data);
        setFilteredPedidos(response.data); // Inicializa los pedidos filtrados
      })
      .catch((error) => console.error('Error al obtener pedidos:', error));
  }, []);

  // Manejar cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Aplicar filtros dinámicamente
  useEffect(() => {
    let filtered = pedidos;

    if (filters.tiendaId) {
      filtered = filtered.filter((pedido) =>
        pedido.tiendaId.toString().includes(filters.tiendaId)
      );
    }

    if (filters.estado) {
      filtered = filtered.filter((pedido) => pedido.estado === filters.estado);
    }

    if (filters.fecha) {
      filtered = filtered.filter((pedido) =>
        new Date(pedido.fechaPedido)
          .toLocaleDateString()
          .includes(filters.fecha)
      );
    }

    setFilteredPedidos(filtered);
  }, [filters, pedidos]);

  return (
    <div className="pedido-list">
      <h2>Lista de Pedidos</h2>

      {/* Sección de Filtros */}
      <div className="filters-container">
        <input
          type="text"
          placeholder="Filtrar por Tienda ID"
          name="tiendaId"
          value={filters.tiendaId}
          onChange={handleFilterChange}
        />
        <select
          name="estado"
          value={filters.estado}
          onChange={handleFilterChange}
        >
          <option value="">Todos los Estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Completado">Completado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
        <input
          type="text"
          placeholder="Filtrar por Fecha (DD/MM/YYYY)"
          name="fecha"
          value={filters.fecha}
          onChange={handleFilterChange}
        />
      </div>

      {/* Sección de Tabla */}
      <div className="table-container">
        <table className="tabla-pedidos">
          <thead>
            <tr>
              <th>Tienda ID</th>
              <th>Producto ID</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Fecha Pedido</th>
            </tr>
          </thead>
          <tbody>
            {filteredPedidos.length > 0 ? (
              filteredPedidos.map((pedido) => (
                <tr key={pedido._id}>
                  <td>{pedido.tiendaId}</td>
                  <td>{pedido.productoId}</td>
                  <td>{pedido.cantidadSolicitada}</td>
                  <td>{pedido.estado}</td>
                  <td>
                    {new Date(pedido.fechaPedido).toLocaleDateString()}{" "}
                    {new Date(pedido.fechaPedido).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No hay pedidos disponibles.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PedidoList;