import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../inventarioList.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

function InventarioList() {
  const [inventarios, setInventarios] = useState([]);
  const [filteredInventarios, setFilteredInventarios] = useState([]);
  const [filters, setFilters] = useState({
    productoId: '',
    nombreProducto: '',
    estado: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/inventario`)
      .then((response) => {
        setInventarios(response.data);
        setFilteredInventarios(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error al obtener inventario:', error);
        setError('No se pudo cargar el inventario. Inténtalo más tarde.');
        setLoading(false);
      });
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  useEffect(() => {
    let filtered = inventarios;

    if (filters.productoId) {
      filtered = filtered.filter((item) =>
        item.productoId.toString().includes(filters.productoId)
      );
    }

    if (filters.nombreProducto) {
      filtered = filtered.filter((item) =>
        item.nombreProducto.toLowerCase().includes(filters.nombreProducto.toLowerCase())
      );
    }

    if (filters.estado) {
      filtered = filtered.filter((item) => {
        const estado =
          item.cantidad > 50
            ? 'Suficiente'
            : item.cantidad > 20
            ? 'Bajo'
            : item.cantidad > 0
            ? 'Crítico'
            : 'Agotado';
        return estado === filters.estado;
      });
    }

    setFilteredInventarios(filtered);
  }, [filters, inventarios]);

  const handleCreatePedido = (productoId) => {
    navigate(`/pedidos?productoId=${productoId}`);
  };

  const solicitarRecarga = async (productoId) => {
    const cantidadSolicitada = prompt(
      '¿Cuántas unidades deseas solicitar para recargar?'
    );

    if (!cantidadSolicitada || isNaN(cantidadSolicitada) || cantidadSolicitada <= 0) {
      alert('Cantidad no válida.');
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/recargar-producto/${productoId}`, {
        cantidadSolicitada: parseInt(cantidadSolicitada, 10),
      });
      alert(response.data.message);
    } catch (error) {
      console.error('Error al solicitar recarga:', error);
      alert('No se pudo realizar la solicitud de recarga.');
    }
  };

  if (loading) return <p>Cargando inventario...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="inventario-list">
      <h2>Inventario Actual</h2>

      <div className="filters-container">
        <input
          type="text"
          placeholder="Filtrar por Producto ID"
          name="productoId"
          value={filters.productoId}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Filtrar por Nombre"
          name="nombreProducto"
          value={filters.nombreProducto}
          onChange={handleFilterChange}
        />
        <select
          name="estado"
          value={filters.estado}
          onChange={handleFilterChange}
        >
          <option value="">Filtrar por Estado</option>
          <option value="Suficiente">Suficiente</option>
          <option value="Bajo">Bajo</option>
          <option value="Crítico">Crítico</option>
          <option value="Agotado">Agotado</option>
        </select>
      </div>

      <table className="tabla-inventario">
        <thead>
          <tr>
            <th>Producto ID</th>
            <th>Nombre</th>
            <th>Cantidad</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventarios.map((item) => {
            let estado = '';
            let claseCantidad = '';
            if (item.cantidad > 50) {
              estado = 'Suficiente';
              claseCantidad = 'cantidad-verde';
            } else if (item.cantidad > 20) {
              estado = 'Bajo';
              claseCantidad = 'cantidad-amarillo';
            } else if (item.cantidad > 0) {
              estado = 'Crítico';
              claseCantidad = 'cantidad-rojo-claro';
            } else {
              estado = 'Agotado';
              claseCantidad = 'cantidad-rojo-oscuro';
            }

            return (
              <tr key={item.productoId}>
                <td>{item.productoId}</td>
                <td>{item.nombreProducto}</td>
                <td className={claseCantidad}>{item.cantidad}</td>
                <td>{estado}</td>
                <td>
                  <div className="acciones-container">
                    <button
                      className="crear-pedido-btn"
                      onClick={() => handleCreatePedido(item.productoId)}
                    >
                      Crear Pedido
                    </button>
                    <button
                      className="recargar-btn"
                      onClick={() => solicitarRecarga(item.productoId)}
                    >
                      Solicitar Recarga
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InventarioList;