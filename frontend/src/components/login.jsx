import React from 'react';

function Login() {
  return (
    <div className="login">
      <h2>Iniciar Sesión</h2>
      <form>
        <label>Usuario:</label>
        <input type="text" name="username" required />
        <label>Contraseña:</label>
        <input type="password" name="password" required />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login;
