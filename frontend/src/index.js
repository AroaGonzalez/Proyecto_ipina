import React from 'react';
import ReactDOM from 'react-dom/client'; // Cambia 'react-dom' por 'react-dom/client'
import './index.css';
import App from './app';

// Utiliza createRoot para React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
