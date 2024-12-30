import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TiendaList = () => {
    const [tiendas, setTiendas] = useState([]);

    useEffect(() => {
        axios
            .get(`${BASE_URL}/tiendas`)
            .then((response) => setTiendas(response.data))
            .catch((error) => console.error('Error al obtener las tiendas:', error));
    }, []);

    return (
        <div className="inventario-container">
            <h2>Lista de Tiendas</h2>
            <table className="inventario-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Dirección</th>
                    </tr>
                </thead>
                <tbody>
                    {tiendas.map((tienda) => (
                        <tr key={tienda.tiendaId}>
                            <td>{tienda.tiendaId}</td>
                            <td>{tienda.nombre}</td>
                            <td>{tienda.direccion}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TiendaList;