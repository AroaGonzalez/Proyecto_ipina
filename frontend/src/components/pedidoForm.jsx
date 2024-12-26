import React, { useState } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PedidoForm({ setPedidos }) {
  const [form, setForm] = useState({
    tiendaId: '',
    productoId: '',
    cantidadSolicitada: 1,
    estado: 'Pendiente',
  });

  // Validar que los campos solo contengan números
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) { // Permitir solo números
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token'); // Obtén el token del almacenamiento local
    const config = {
      headers: {
        Authorization: `Bearer ${token}`, // Incluye el token en el encabezado
      },
    };

    axios
      .post(`${BASE_URL}/pedidos`, form, config)
      .then(() => {
        alert('Pedido creado con éxito');
        setForm({ tiendaId: '', productoId: '', cantidadSolicitada: 1, estado: 'Pendiente' });
        // Recargar la lista de pedidos
        axios.get(`${BASE_URL}/pedidos`, config).then((response) => setPedidos(response.data));
      })
      .catch((error) => console.error('Error al crear pedido:', error));
  };

  return (
    <form onSubmit={handleSubmit} className="pedido-form">
      <h2>Crear Pedido</h2>
      <div>
        <label>Tienda ID:</label>
        <input
          type="number" // Cambiado a tipo número
          name="tiendaId"
          value={form.tiendaId}
          onChange={handleNumericChange} // Llamar a la función de validación
          required
        />
      </div>
      <div>
        <label>Producto ID:</label>
        <input
          type="number" // Cambiado a tipo número
          name="productoId"
          value={form.productoId}
          onChange={handleNumericChange} // Llamar a la función de validación
          required
        />
      </div>
      <div>
        <label>Cantidad:</label>
        <input
          type="number"
          name="cantidadSolicitada"
          value={form.cantidadSolicitada}
          onChange={(e) => setForm({ ...form, cantidadSolicitada: e.target.value })}
          min="1"
          required
        />
      </div>
      <div>
        <label>Estado:</label>
        <select name="estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
          <option value="Pendiente">Pendiente</option>
          <option value="Completado">Completado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>
      <button type="submit">Crear Pedido</button>
    </form>
  );
}

export default PedidoForm;
