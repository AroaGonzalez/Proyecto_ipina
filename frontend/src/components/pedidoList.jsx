import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PedidoList() {
  const [pedidos, setPedidos] = useState([]);

  // Obtener pedidos al cargar el componente
  useEffect(() => {
    axios
      .get('http://localhost:5000/pedidos')
      .then((response) => setPedidos(response.data))
      .catch((error) => console.error('Error al obtener pedidos:', error));
  }, []);

  return (
    <div className="pedido-list">
      <h2>Lista de Pedidos</h2>
      <ul>
        {pedidos.map((pedido) => (
          <li key={pedido._id}>
            Tienda: {pedido.tiendaId}, Producto: {pedido.productoId}, Cantidad: {pedido.cantidadSolicitada}, Estado: {pedido.estado}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PedidoList;
