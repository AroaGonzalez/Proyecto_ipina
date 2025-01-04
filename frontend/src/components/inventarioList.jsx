import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../inventarioList.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

function InventarioList() {
  const [inventarios, setInventarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/inventario`)
      .then((response) => {
        setInventarios(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error al obtener inventario:', error);
        setError('No se pudo cargar el inventario. Inténtalo más tarde.');
        setLoading(false);
      });
  }, []);

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
      alert(response.data.message); // Mensaje del backend
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
          {inventarios.map((item) => {
            let claseCantidad = '';
            if (item.cantidad > 50) claseCantidad = 'cantidad-verde';
            else if (item.cantidad > 20) claseCantidad = 'cantidad-amarillo';
            else if (item.cantidad > 0) claseCantidad = 'cantidad-rojo-claro';
            else claseCantidad = 'cantidad-rojo-oscuro';

            return (
              <tr key={item.productoId}>
                <td>{item.productoId}</td>
                <td>{item.nombreProducto}</td>
                <td className={claseCantidad}>{item.cantidad}</td>
                <td>{item.cantidad > 0 ? 'Suficiente' : 'Agotado'}</td>
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