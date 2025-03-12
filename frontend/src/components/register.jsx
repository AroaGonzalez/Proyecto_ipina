import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/register.css';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/register', form);

      alert('Registro exitoso. Redirigiendo al inicio de sesión...');
      navigate('/');
    } catch (error) {
      if (error.response && error.response.status === 400) {

        alert('Este usuario ya está registrado. Redirigiendo al inicio de sesión...');
        navigate('/');
      } else {

        setErrorMessage('Hubo un error al procesar tu registro. Por favor, inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>CREAR CUENTA</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="username">Usuario:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" className="register-button">Registrarse</button>
        </form>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
}

export default Register;