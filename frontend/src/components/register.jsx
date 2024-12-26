import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/register', form);
      localStorage.setItem('token', response.data.token); // Guarda el token
      navigate('/'); // Redirige al login
    } catch (error) {
      console.error('Error al registrarse:', error);
      alert('No se pudo completar el registro.');
    }
  };

  return (
    <div className="register">
      <h2>Crear Cuenta</h2>
      <form onSubmit={handleSubmit}>
        <label>Usuario:</label>
        <input type="text" name="username" value={form.username} onChange={handleChange} required />
        <label>Contraseña:</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required />
        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
}

export default Register;
