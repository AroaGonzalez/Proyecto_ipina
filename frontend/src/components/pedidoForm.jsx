import React, { useState, useEffect } from "react";
import axios from "axios";
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PedidoForm = () => {
  const [productoIds, setProductoIds] = useState([]);
  const [pedido, setPedido] = useState({
    tiendaId: "",
    productoId: "",
    cantidadSolicitada: 1, // Cambiar a cantidadSolicitada
    estado: "Pendiente",
  });

  useEffect(() => {
    // Obtener los productos disponibles del inventario
    axios
      .get(`${BASE_URL}/inventario`)
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
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    axios
      .post(`${BASE_URL}/pedidos`, pedido, config) // Envía el objeto `pedido` al backend
      .then(() => {
        alert("Pedido creado con éxito");
        setPedido({
          tiendaId: "",
          productoId: "",
          cantidadSolicitada: 1,
          estado: "Pendiente",
        }); // Restablecer el formulario
      })
      .catch((error) =>
        console.error("Error al crear pedido:", error.response?.data)
      );
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

      <label htmlFor="cantidadSolicitada">Cantidad:</label>
      <input
        type="number"
        id="cantidadSolicitada"
        name="cantidadSolicitada"
        value={pedido.cantidadSolicitada}
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