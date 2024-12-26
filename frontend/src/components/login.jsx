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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Envía las credenciales al backend
      const response = await axios.post('http://localhost:5000/login', form);

      // Guarda el token en el almacenamiento local
      localStorage.setItem('token', response.data.token);

      // Redirige al inicio
      navigate('/home');
    } catch (error) {
      // Si hay un error en la autenticación, muestra un mensaje y redirige al registro
      alert('Usuario o contraseña incorrectos. Por favor, regístrate.');
      navigate('/register'); // Redirige al registro
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