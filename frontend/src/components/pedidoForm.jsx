import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PedidoForm = () => {
  const [productoIds, setProductoIds] = useState([]); // Estado para productos
  const [tiendas, setTiendas] = useState([]); // Estado para tiendas
  const [pedido, setPedido] = useState({
    tiendaId: "",
    productoId: "",
    cantidadSolicitada: 1,
    estado: "Pendiente",
  });

  // Carga inicial del inventario
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

  // Carga inicial de las tiendas
  useEffect(() => {
    axios
      .get(`${BASE_URL}/tiendas`)
      .then((response) => {
        setTiendas(response.data); // Guardar tiendas disponibles
      })
      .catch((error) => console.error("Error al obtener tiendas:", error));
  }, []);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPedido({ ...pedido, [name]: value });
  };

  // Manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    axios
      .post(`${BASE_URL}/pedidos`, pedido, config)
      .then(() => {
        alert("Pedido creado con éxito");
        setPedido({
          tiendaId: "",
          productoId: "",
          cantidadSolicitada: 1,
          estado: "Pendiente",
        });

        // Recargar inventario si es necesario
        axios
          .get(`${BASE_URL}/inventario`, config)
          .then((response) => {
            console.log("Inventario actualizado:", response.data);
          })
          .catch((error) =>
            console.error("Error al recargar el inventario:", error)
          );
      })
      .catch((error) =>
        console.error("Error al crear pedido:", error.response?.data)
      );
  };

  return (
    <form className="pedido-form" onSubmit={handleSubmit}>
      <h2>Crear Pedido</h2>

      {/* Campo para seleccionar Tienda */}
      <label htmlFor="tiendaId">Tienda ID:</label>
      <select
        id="tiendaId"
        name="tiendaId"
        value={pedido.tiendaId}
        onChange={handleChange}
        required
      >
        <option value="">Seleccionar Tienda</option>
        {tiendas.map((tienda) => (
          <option key={tienda.tiendaId} value={tienda.tiendaId}>
            {tienda.nombre}
          </option>
        ))}
      </select>

      {/* Campo para seleccionar Producto */}
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

      {/* Campo para ingresar la cantidad */}
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

      {/* Campo para seleccionar el estado del pedido */}
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
      </select>

      <button type="submit">Crear Pedido</button>
    </form>
  );
};

export default PedidoForm;