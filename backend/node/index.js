const express = require('express');
const mongoose = require('mongoose'); // Importar mongoose para MongoDB
const Pedido = require('./models/pedido'); // Modelo de Pedido (asegúrate de crearlo como te mostré antes)

const app = express();
app.use(express.json()); // Middleware para parsear JSON

// Conexión a MongoDB
mongoose.connect('mongodb://root:rootpassword@mongodb:27017/tienda?authSource=admin')
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Node.js service running!');
});

// Crear un pedido
app.post('/pedidos', async (req, res) => {
    try {
        const pedido = new Pedido(req.body); // Crear un nuevo pedido con los datos del cuerpo de la solicitud
        await pedido.save(); // Guardar el pedido en MongoDB
        res.status(201).json(pedido); // Responder con el pedido creado
    } catch (error) {
        res.status(400).json({ error: error.message }); // Manejo de errores
    }
});

// Obtener todos los pedidos
app.get('/pedidos', async (req, res) => {
    try {
        const pedidos = await Pedido.find(); // Obtener todos los pedidos
        res.json(pedidos); // Responder con los pedidos
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un pedido por ID
app.get('/pedidos/:id', async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id); // Buscar un pedido por ID
        if (!pedido) throw new Error('Pedido no encontrado');
        res.json(pedido); // Responder con el pedido encontrado
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Actualizar un pedido
app.put('/pedidos/:id', async (req, res) => {
    try {
        const pedido = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Actualizar el pedido
        if (!pedido) throw new Error('Pedido no encontrado');
        res.json(pedido); // Responder con el pedido actualizado
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Eliminar un pedido
app.delete('/pedidos/:id', async (req, res) => {
    try {
        const pedido = await Pedido.findByIdAndDelete(req.params.id); // Eliminar el pedido
        if (!pedido) throw new Error('Pedido no encontrado');
        res.json({ message: 'Pedido eliminado' }); // Responder con un mensaje de éxito
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Iniciar el servidor
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
