const mysql = require('mysql');
const config = require('../config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Crear la conexión a la base de datos
const db = mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        throw err;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Función para registrar usuarios
const registrarusuario = (usuario, callback) => {
    const rolPredeterminado = 4; // Establecemos el rol predeterminado a 4
    const query = 'CALL InsertUsuario(?, ?, ?)';
    
    db.query(query, [usuario.email, usuario.password, rolPredeterminado], (error, results) => {
        if (error) {
            // Verificar si el error es debido a un correo duplicado
            if (error.code === 'ER_DUP_ENTRY') {
                return callback({ message: 'Este correo ya ha sido registrado' }, null);
            }
            return callback(error, null);
        }

        // Manejar el resultado para obtener el ID del usuario insertado
        if (results && results[0] && results[0][0]) {
            const nuevoUsuario = results[0][0];
            return callback(null, {
                message: 'Usuario registrado exitosamente',
                usuario: {
                    id_usuario: nuevoUsuario.id_usuario,
                    email: nuevoUsuario.email
                }
            });
        } else {
            return callback(new Error('No se pudo registrar el usuario'), null);
        }
    });
};

// Método de inicio de sesión
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

        // Comparar la contraseña con la que tenemos en la base de datos
        bcrypt.compare(password, user.password, (error, match) => {
            if (error) {
                return callback(error, null);
            }
            if (!match) {
                return callback({ message: 'Usuario o contraseña incorrectos' }, null);
            }

            // Generar un token JWT
            const token = jwt.sign({ id_usuario: user.id_usuario, email: user.email }, config.jwtSecret, { expiresIn: '1h' });

            // Devolver el token y los datos del usuario
            return callback(null, {
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
    registrarusuario,
    login
};
