import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

  useEffect(() => {
    axios
      .get(`${BASE_URL}/inventario`)
      .then((response) => {
        const productos = response.data.map((producto) => ({
          id: producto.productoId,
          nombre: producto.nombreProducto,
        }));
        setProductoIds(productos);
      })
      .catch((error) => console.error("Error al obtener el inventario:", error));
  }, []);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/tiendas`)
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
          fechaFin: "",
        });
        setErrorMessage("");
      })
      .catch((error) => {
        const errorMsg =
          error.response?.data?.message || "Error al crear el pedido.";
        setErrorMessage(errorMsg);
      });
  };

  return (
    <div className="form-background">
      <h1 className="pedido-title">Gestión de Pedidos</h1> {/* Añadir el título aquí */}
      <form className="pedido-form" onSubmit={handleSubmit}>
        <h2>Crear Pedido</h2>
  
        {errorMessage && <p className="error-message">{errorMessage}</p>}
  
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
              onChange={(e) => setPedido({ ...pedido, fechaFin: e.target.value })}
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