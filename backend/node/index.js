const express = require('express');
const mongoose = require('mongoose'); // Importar mongoose para MongoDB
const cors = require('cors'); // Importar cors
const jwt = require('jsonwebtoken'); // Para generar tokens
const bcrypt = require('bcryptjs'); // Para hashear contraseñas
const Pedido = require('./models/pedido'); // Modelo de Pedido
const User = require('./models/user'); // Modelo de Usuario (nuevo)

const Inventario = require('./models/inventario');

const app = express();
const JWT_SECRET = 'your_jwt_secret'; // Clave secreta para firmar tokens

// Configurar CORS para permitir solicitudes desde otros dominios
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para parsear JSON
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://root:rootpassword@mongo:27017/tienda', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: 'admin',
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Node.js service running!');
});

// Middleware para verificar autenticación
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Crear un nuevo usuario (registro)
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }
  try {
      const hashedPassword = await bcrypt.hash(password, 10); // Hashea la contraseña
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();
      res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
      if (error.code === 11000) { // Código para error de clave duplicada en MongoDB
          return res.status(400).json({ message: 'El usuario ya existe' });
      }
      res.status(500).json({ error: error.message });
  }
});


// Iniciar sesión y obtener token
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password); // Compara la contraseña
    if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/pedidos', authenticateToken, async (req, res) => {
  try {
    const { tiendaId, productoId, cantidadSolicitada, estado } = req.body;

    // Validar campos requeridos
    if (!tiendaId || !productoId || !cantidadSolicitada || !estado) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Validar que el producto existe en el inventario
    const producto = await Inventario.findOne({ productoId });
    if (!producto) {
      return res.status(400).json({ message: 'Producto no válido o no disponible en el inventario' });
    }

    // Validar stock
    if (producto.cantidad < cantidadSolicitada) {
      return res.status(400).json({ message: 'Stock insuficiente para este producto' });
    }

    // Crear el pedido
    const pedido = new Pedido({ tiendaId, productoId, cantidadSolicitada, estado });
    await pedido.save();

    // Actualizar el inventario
    producto.cantidad -= cantidadSolicitada;
    await producto.save();

    res.status(201).json(pedido);
  } catch (error) {
    console.error('Error al procesar el pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los pedidos (solo usuarios autenticados)
app.get('/pedidos', authenticateToken, async (req, res) => {
  try {
    const pedidos = await Pedido.find(); // Obtener todos los pedidos
    res.json(pedidos); // Responder con los pedidos
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un pedido por ID (solo usuarios autenticados)
app.get('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id); // Buscar un pedido por ID
    if (!pedido) throw new Error('Pedido no encontrado');
    res.json(pedido); // Responder con el pedido encontrado
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Actualizar un pedido (solo usuarios autenticados)
app.put('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Actualizar el pedido
    if (!pedido) throw new Error('Pedido no encontrado');
    res.json(pedido); // Responder con el pedido actualizado
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Eliminar un pedido (solo usuarios autenticados)
app.delete('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id); // Eliminar el pedido
    if (!pedido) throw new Error('Pedido no encontrado');
    res.json({ message: 'Pedido eliminado' }); // Responder con un mensaje de éxito
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Obtener todo el inventario
app.get('/inventario', async (req, res) => {
  try {
    const inventarios = await Inventario.find();
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Añadir un producto al inventario
app.post('/inventario', async (req, res) => {
  const { productoId, nombreProducto, cantidad, umbralMinimo } = req.body;
  try {
    const nuevoProducto = new Inventario({ productoId, nombreProducto, cantidad, umbralMinimo });
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar stock de un producto
app.put('/inventario/:id', async (req, res) => {
  try {
    const producto = await Inventario.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Iniciar el servidor
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});