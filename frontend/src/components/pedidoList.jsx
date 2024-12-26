import React, { useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PedidoList({ pedidos = [], setPedidos }) { // Asigna un array vacío como valor predeterminado
  // Obtener pedidos al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token'); // Obtén el token del almacenamiento local
    const config = {
      headers: {
        Authorization: `Bearer ${token}`, // Incluye el token en el encabezado
      },
    };
  
    axios
      .get(`${BASE_URL}/pedidos`, config) // Pasa la configuración con el token
      .then((response) => setPedidos(response.data))
      .catch((error) => console.error('Error al obtener pedidos:', error));
  }, [setPedidos]);
    
  return (
    <div className="pedido-list">
      <h2>Lista de Pedidos</h2>
      <ul>
        {pedidos.length > 0 ? ( // Comprueba si pedidos tiene elementos
          pedidos.map((pedido) => (
            <li key={pedido._id}>
              Tienda: {pedido.tiendaId}, Producto: {pedido.productoId}, Cantidad: {pedido.cantidadSolicitada}, Estado: {pedido.estado}
            </li>
          ))
        ) : (
          <p>No hay pedidos disponibles.</p> // Mensaje si no hay pedidos
        )}
      </ul>
    </div>
  );
}

export default PedidoList;