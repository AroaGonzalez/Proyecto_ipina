import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PedidoForm = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedProductoId = queryParams.get("productoId"); // Obtenemos el productoId de la URL

  const [productoIds, setProductoIds] = useState([]); // Estado para productos
  const [tiendas, setTiendas] = useState([]); // Estado para tiendas
  const [pedido, setPedido] = useState({
    tiendaId: "",
    productoId: preselectedProductoId || "", // Preseleccionar productoId si está disponible
    cantidadSolicitada: 1,
    estado: "Pendiente",
    fechaFin: "", // Campo fecha de fin
  });
  const [errorMessage, setErrorMessage] = useState(""); // Estado para mensajes de error

  // Carga inicial del inventario
  useEffect(() => {
    axios
      .get(`${BASE_URL}/inventario`)
      .then((response) => {
        const productos = response.data.map((producto) => ({
          id: producto.productoId,
          nombre: producto.nombreProducto,
        }));
        setProductoIds(productos); // Guardar productos disponibles
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

    const adjustedPedido = {
      ...pedido,
      fechaFin: pedido.fechaFin ? new Date(pedido.fechaFin).toISOString() : null,
    };

    axios
      .post(`${BASE_URL}/pedidos`, adjustedPedido, config)
      .then(() => {
        alert("Pedido creado con éxito");
        setPedido({
          tiendaId: "",
          productoId: "",
          cantidadSolicitada: 1,
          estado: "Pendiente",
          fechaFin: "", // Reiniciar la fecha
        });
        setErrorMessage(""); // Limpiar mensaje de error
      })
      .catch((error) => {
        const errorMsg =
          error.response?.data?.message || "Error al crear el pedido.";
        setErrorMessage(errorMsg); // Mostrar mensaje de error
      });
  };

  return (
    <form className="pedido-form" onSubmit={handleSubmit}>
      <h2>Crear Pedido</h2>

      {/* Mostrar mensaje de error */}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {/* Campo para seleccionar Tienda */}
      <label htmlFor="tiendaId">Tienda:</label>
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
      <label htmlFor="productoId">Producto:</label>
      <select
        id="productoId"
        name="productoId"
        value={pedido.productoId}
        onChange={handleChange}
        required
      >
        <option value="">Seleccionar Producto</option>
        {productoIds.map((producto) => (
          <option key={producto.id} value={producto.id}>
            {producto.nombre} (ID: {producto.id})
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

      {/* Campo para seleccionar la fecha de fin si el estado es "Pendiente" */}
      {pedido.estado === "Pendiente" && (
        <>
          <label htmlFor="fechaFin">Fecha Fin:</label>
          <input
            type="datetime-local"
            id="fechaFin"
            name="fechaFin"
            value={pedido.fechaFin}
            onChange={(e) => setPedido({ ...pedido, fechaFin: e.target.value })}
            required
          />
        </>
      )}

      <button type="submit">Crear Pedido</button>
    </form>
  );
};

export default PedidoForm;