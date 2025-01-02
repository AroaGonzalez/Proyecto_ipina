import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../register.css'; // Archivo CSS para estilos

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

      if (response.data.message === 'El usuario ya existe') {
        setErrorMessage('El usuario ya existe, inicie sesión.');
      } else {
        alert('Registro exitoso. Te redirigiremos a la página de inicio.');
        navigate('/home');
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Hubo un error al procesar tu registro. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/checkUser', {
        username: form.username,
      });

      if (response.data.exists) {
        navigate('/login');
      } else {
        setErrorMessage('El usuario no existe. Por favor, regístrese primero.');
      }
    } catch (error) {
      setErrorMessage('Hubo un error al verificar el usuario. Por favor, inténtalo de nuevo.');
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
          <div className="button-group">
            <button type="submit" className="register-button">Registrarse</button>
            <button
              type="button"
              className="login-button"
              onClick={handleLogin}
            >
              Iniciar sesión
            </button>
          </div>
        </form>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
}

export default Register;