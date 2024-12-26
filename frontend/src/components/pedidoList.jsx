import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PedidoList() {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [filters, setFilters] = useState({
    tiendaId: '',
    estado: '',
    fecha: '',
  });
  const [editingPedidoId, setEditingPedidoId] = useState(null); // ID del pedido que se está editando
  const [editForm, setEditForm] = useState({}); // Datos de edición

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
        setFilteredPedidos(response.data);
      })
      .catch((error) => console.error('Error al obtener pedidos:', error));
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

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

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.delete(`${BASE_URL}/pedidos/${id}`, config);
      alert('Pedido eliminado con éxito');
      setPedidos((prevPedidos) => prevPedidos.filter((pedido) => pedido._id !== id));
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      alert('No se pudo eliminar el pedido');
    }
  };

  const handleEditClick = (pedido) => {
    setEditingPedidoId(pedido._id); // Activa la edición para este pedido
    setEditForm(pedido); // Copia los datos del pedido actual
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  const handleEditSubmit = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.put(`${BASE_URL}/pedidos/${id}`, editForm, config);
      alert('Pedido actualizado con éxito');

      setPedidos((prevPedidos) =>
        prevPedidos.map((pedido) =>
          pedido._id === id ? { ...pedido, ...editForm } : pedido
        )
      );

      setEditingPedidoId(null); // Desactiva el modo de edición
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      alert('No se pudo actualizar el pedido');
    }
  };

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

      {/* Tabla de Pedidos */}
      <div className="table-container">
        <table className="tabla-pedidos">
          <thead>
            <tr>
              <th>Tienda ID</th>
              <th>Producto ID</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Fecha Pedido</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPedidos.length > 0 ? (
              filteredPedidos.map((pedido) => (
                <tr key={pedido._id}>
                  {editingPedidoId === pedido._id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          name="tiendaId"
                          value={editForm.tiendaId}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          name="productoId"
                          value={editForm.productoId}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="cantidadSolicitada"
                          value={editForm.cantidadSolicitada}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <select
                          name="estado"
                          value={editForm.estado}
                          onChange={handleEditChange}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Completado">Completado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td>
                        {new Date(pedido.fechaPedido).toLocaleDateString()}{" "}
                        {new Date(pedido.fechaPedido).toLocaleTimeString()}
                      </td>
                      <td>
                        <button onClick={() => handleEditSubmit(pedido._id)}>
                          Guardar
                        </button>
                        <button onClick={() => setEditingPedidoId(null)}>
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{pedido.tiendaId}</td>
                      <td>{pedido.productoId}</td>
                      <td>{pedido.cantidadSolicitada}</td>
                      <td>{pedido.estado}</td>
                      <td>
                        {new Date(pedido.fechaPedido).toLocaleDateString()}{" "}
                        {new Date(pedido.fechaPedido).toLocaleTimeString()}
                      </td>
                      <td>
                        <button onClick={() => handleEditClick(pedido)}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(pedido._id)}>
                          Eliminar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No hay pedidos disponibles.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PedidoList;