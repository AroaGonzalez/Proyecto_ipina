import React, { useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PedidoList({ pedidos = [], setPedidos }) { // Asigna un array vacío como valor predeterminado
  // Obtener pedidos al cargar el componente
  useEffect(() => {
    axios
      .get(`${BASE_URL}/pedidos`)
      .then((response) => setPedidos(response.data)) // Usa setPedidos del padre
      .catch((error) => console.error('Error al obtener pedidos:', error));
  }, [setPedidos]); // Asegúrate de incluir setPedidos como dependencia

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