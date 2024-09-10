const mysql = require('mysql');
const config = require('../config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//metodo de inicio de sesion
const login = (email, password, callback) => {
 const query = 'SELECT * FROM usuarios WHERE email = ?';

 db.query(query, [email], (error, results) => {
    if (error) {
        return callback(error, null);
    }
    
    if (results.length === 0) { 
        return callback({ message: 'Usuario no encontrado' }, null);
    }
   
    const user = results[0];

    //comparar la contraseña con la que tenemos en la base de datos
    bcrypt.compare(password, user.password, (error, match) => {
        if (error) {
            return callback(error, null);
        }
        if (!match) {
            return callback({ message: 'Contraseña incorrecta' }, null);
        }

    //Generar un token JWT
    const token = jwt.sign({ id_usuario: user.id_usuario, email: user.email }, config.jwtSecret, { expiresIn: '1h' });

    //Devolver el token y los datos del usuario
    return callback(null,{
        message: 'Inicio de sesión exitoso',
        token: token,
        usuario: {
            id_usuario: user.id_usuario,
            email: user.email,
            id_rol: user.id_rol 
        }
    });
    });
 });
};

module.exports = {
    login
};