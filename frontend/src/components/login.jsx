import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Envía las credenciales al backend para iniciar sesión
      const response = await axios.post('http://localhost:5000/login', form);
      localStorage.setItem('token', response.data.token); // Guarda el token
      navigate('/home'); // Redirige al inicio
    } catch (error) {
      alert('Usuario o contraseña incorrectos.');
    }
  };

  const handleRegisterRedirect = () => {
    // Redirige a la página de registro
    navigate('/register');
  };

  return (
    <div className="login">
      <h2>BIENVENIDO A INDITEX</h2>
      <form onSubmit={handleLogin}>
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
        <div className="buttons-container">
          <button type="submit">Iniciar Sesión</button>
          <button type="button" onClick={handleRegisterRedirect}>
            Registrarse
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;