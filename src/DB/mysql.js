const mysql = require('mysql');
const config = require('../config');

let db;
let isConnecting = false;

function createConnection() {
    return mysql.createConnection({
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        connectTimeout: 10000, // 10 segundos
        acquireTimeout: 10000 // 10 segundos
    });
}

function handleDisconnect() {
    if (isConnecting) return;
    isConnecting = true;

    if (db) db.destroy();
    db = createConnection();

    db.connect((err) => {
        isConnecting = false;
        if (err) {
            console.error('Error al conectar a la base de datos:', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('Conectado a la base de datos MySQL');
        }
    });

    db.on('error', (err) => {
        console.error('Error de base de datos:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

// Función para ejecutar consultas con reintentos
function queryWithRetry(sql, params, callback, retries = 3) {
    if (!db || db.state === 'disconnected') {
        handleDisconnect();
    }
    db.query(sql, params, (error, results) => {
        if (error) {
            console.error('Error en la consulta:', error);
            if (retries > 0 && (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET')) {
                console.log(`Reintentando consulta, intentos restantes: ${retries - 1}`);
                setTimeout(() => queryWithRetry(sql, params, callback, retries - 1), 1000);
            } else {
                callback(error, null);
            }
        } else {
            callback(null, results);
        }
    });
}

// Función para registrar usuarios
const registrarusuario = (usuario, callback) => {
    const rolPredeterminado = 4;
    const sql = 'CALL InsertUsuario(?, ?, ?)';
    
    queryWithRetry(sql, [usuario.email, usuario.password, rolPredeterminado], callback);
};

// Método de inicio de sesión
const login = (email, password, callback) => {
    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    queryWithRetry(sql, [email], callback);
};

// Función para insertar una nueva iglesia
const insertarIglesia = (iglesia, callback) => {
    const sql = 'CALL InsertIglesiaCompleta(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    
    queryWithRetry(sql, [
        iglesia.nombre,
        iglesia.pastor,
        iglesia.direccion,
        iglesia.latitud,
        iglesia.longitud,
        iglesia.fotoPerfil,
        iglesia.facebook,
        iglesia.instagram,
        iglesia.sitioWeb,
        iglesia.horarios // Ya debe ser una cadena JSON
    ], (error, results) => {
        if (error) {
            console.error('Error detallado al insertar iglesia:', error);
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
};

// Función para buscar iglesias por nombre
const buscarIglesiaPorNombre = (nombre, callback) => {
    const sql = 'CALL BuscarIglesiaPorNombre(?)';
    queryWithRetry(sql, [nombre], (error, results) => {
        if (error) {
            console.error('Error al buscar iglesia:', error);
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
};

// Función para insertar un pastor
const insertarPastor = (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, iglesia_id, cargo_id, fotoPerfil, callback) => {
    const sql = 'CALL InsertarYActualizarPastor(?, ?, ?, ?, ?, ?, ?)';
    queryWithRetry(sql, [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, iglesia_id, cargo_id, fotoPerfil], (error, results) => {
        if (error) {
            console.error('Error al insertar pastor:', error);
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
};

// Iniciar la conexión
handleDisconnect();

module.exports = {
    queryWithRetry,
    registrarusuario,
    login,
    insertarIglesia,
    buscarIglesiaPorNombre,
    insertarPastor // Añadir esta nueva función al módulo de exportación
};
