import React, { useState, useEffect } from "react";
import axios from "axios";

const PedidoForm = () => {
  const [productoIds, setProductoIds] = useState([]);
  const [pedido, setPedido] = useState({
    tiendaId: "",
    productoId: "",
    cantidad: 1,
    estado: "Pendiente",
  });

  useEffect(() => {
    // Obtener los productos disponibles del inventario
    axios
      .get("http://localhost:5000/inventario")
      .then((response) => {
        const productos = response.data.map((producto) => producto.productoId);
        setProductoIds(productos); // Guardar IDs disponibles
      })
      .catch((error) => console.error("Error al obtener el inventario:", error));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPedido({ ...pedido, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:5000/pedidos", pedido, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((response) => {
        alert("Pedido creado exitosamente");
      })
      .catch((error) => {
        console.error("Error al crear el pedido:", error);
      });
  };

  return (
    <form className="pedido-form" onSubmit={handleSubmit}>
      <h2>Crear Pedido</h2>
      <label htmlFor="tiendaId">Tienda ID:</label>
      <input
        type="text"
        id="tiendaId"
        name="tiendaId"
        value={pedido.tiendaId}
        onChange={handleChange}
        required
      />

      <label htmlFor="productoId">Producto ID:</label>
      <select
        id="productoId"
        name="productoId"
        value={pedido.productoId}
        onChange={handleChange}
        required
      >
        <option value="">Seleccionar Producto</option>
        {productoIds.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>

      <label htmlFor="cantidad">Cantidad:</label>
      <input
        type="number"
        id="cantidad"
        name="cantidad"
        value={pedido.cantidad}
        onChange={handleChange}
        min="1"
        required
      />

      <label htmlFor="estado">Estado:</label>
      <select
        id="estado"
        name="estado"
        value={pedido.estado}
        onChange={handleChange}
        required
      >
        <option value="Pendiente">Pendiente</option>
        <option value="Completado">Completado</option>
        <option value="Cancelado">Cancelado</option>
      </select>

      <button type="submit">Crear Pedido</button>
    </form>
  );
};

export default PedidoForm;