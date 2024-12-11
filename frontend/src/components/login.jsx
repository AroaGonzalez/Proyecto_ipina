import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes añadir lógica de autenticación si es necesario
    if (form.username && form.password) {
      navigate('/home'); // Redirige al inicio
    } else {
      alert('Por favor, ingresa usuario y contraseña');
    }
  };

  return (
    <div className="login">
      <h2>BIENVENIDO A INDITEX</h2>
      <form onSubmit={handleSubmit}>
        <label>Usuario o correo corporativo:</label>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <label>Contraseña:</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Continuar</button>
      </form>
    </div>
  );
}

export default Login;
