const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Asegúrate de almacenar contraseñas encriptadas
    name: { type: String },
    email: { type: String },
    address: { type: String },
});

module.exports = mongoose.model('User', UserSchema);