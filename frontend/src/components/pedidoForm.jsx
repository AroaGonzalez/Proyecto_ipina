import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

// URLs separadas para los backends Python y Node.js
const BASE_URL_PYTHON = process.env.REACT_APP_PYTHON_API_URL || "http://localhost:8000";
const BASE_URL_NODE = process.env.REACT_APP_NODE_API_URL || "http://localhost:5000";

const PedidoForm = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedProductoId = queryParams.get("productoId");

  const [productoIds, setProductoIds] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [pedido, setPedido] = useState({
    tiendaId: "",
    productoId: preselectedProductoId || "",
    cantidadSolicitada: 1,
    estado: "Pendiente",
    fechaFin: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Cargar productos del inventario desde el backend Python
  useEffect(() => {
    axios
      .get(`${BASE_URL_PYTHON}/inventario`)
      .then((response) => {
        const productos = response.data.map((producto) => ({
          id: producto.productoId,
          nombre: producto.nombreProducto,
        }));
        setProductoIds(productos);
      })
      .catch((error) => console.error("Error al obtener el inventario:", error));
  }, []);

  // Cargar tiendas desde el backend Python
  useEffect(() => {
    axios
      .get(`${BASE_URL_PYTHON}/tiendas`)
      .then((response) => {
        setTiendas(response.data);
      })
      .catch((error) => console.error("Error al obtener tiendas:", error));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPedido({ ...pedido, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const adjustedPedido = {
      ...pedido,
      fechaFin:
        pedido.estado === "Pendiente" && pedido.fechaFin
          ? new Date(pedido.fechaFin).toISOString()
          : null,
    };

    // Crear pedido usando el backend Node.js
    axios
      .post(`${BASE_URL_NODE}/pedidos`, adjustedPedido, config)
      .then(() => {
        setSuccessMessage("Pedido creado con éxito");
        setPedido({
          tiendaId: "",
          productoId: "",
          cantidadSolicitada: 1,
          estado: "Pendiente",
          fechaFin: "",
        });
      })
      .catch((error) => {
        const errorMsg =
          error.response?.data?.message || "Error al crear el pedido.";
        setErrorMessage(errorMsg);
      });
  };

  return (
    <div className="form-background">
      <h1 className="pedido-title">Gestión de Pedidos</h1>
      <form className="pedido-form" onSubmit={handleSubmit}>
        <h2>Crear Pedido</h2>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

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
        </select>

        {pedido.estado === "Pendiente" && (
          <>
            <label htmlFor="fechaFin">Fecha Fin:</label>
            <input
              type="datetime-local"
              id="fechaFin"
              name="fechaFin"
              value={pedido.fechaFin}
              onChange={(e) =>
                setPedido({ ...pedido, fechaFin: e.target.value })
              }
              required
            />
          </>
        )}

        <button type="submit">Crear Pedido</button>
      </form>
    </div>
  );
};

export default PedidoForm;