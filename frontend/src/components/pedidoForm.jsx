import React, { useState } from 'react';
import axios from 'axios';

function PedidoForm() {
  const [form, setForm] = useState({
    tiendaId: '',
    productoId: '',
    cantidadSolicitada: 1,
    estado: 'Pendiente',
  });

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Enviar el formulario al backend
  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post('http://localhost:5000/pedidos', form)
      .then(() => {
        alert('Pedido creado con éxito');
        setForm({ tiendaId: '', productoId: '', cantidadSolicitada: 1, estado: 'Pendiente' });
      })
      .catch((error) => console.error('Error al crear pedido:', error));
  };

  return (
    <form onSubmit={handleSubmit} className="pedido-form">
      <h2>Crear Pedido</h2>
      <div>
        <label>Tienda ID:</label>
        <input
          type="text"
          name="tiendaId"
          value={form.tiendaId}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Producto ID:</label>
        <input
          type="text"
          name="productoId"
          value={form.productoId}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Cantidad:</label>
        <input
          type="number"
          name="cantidadSolicitada"
          value={form.cantidadSolicitada}
          onChange={handleChange}
          min="1"
          required
        />
      </div>
      <div>
        <label>Estado:</label>
        <select name="estado" value={form.estado} onChange={handleChange}>
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