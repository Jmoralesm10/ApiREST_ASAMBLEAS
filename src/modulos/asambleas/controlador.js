const db = require('../../DB/mysql');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/home/asamblea/imagenes/iglesias/') // Nueva ruta absoluta al directorio de uploads
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(16, function (err, raw) {
            if (err) return cb(err);
            cb(null, raw.toString('hex') + path.extname(file.originalname));
        });
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error("Error: Solo se permiten archivos de imagen (jpeg, jpg, png)!"));
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1000000 } // Limita a 1MB
}).single('fotoPerfil');

const login = (req, res) => {
    const { email, password } = req.body;
    db.login(email, password, (error, result) => {
        if (error) {
            return res.status(500).json({ message: error.message });
        }
        // Aquí deberías manejar el resultado exitoso del login
        res.status(200).json(result);
    });
};

const registrarUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.registrarusuario({ email, password: hashedPassword }, (error, result) => {
            if (error) {
                return res.status(500).json({ message: error.message });
            }
            res.status(201).json(result);
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar usuario', details: error.message });
    }
};

// Registrar una iglesia
const registrarIglesia = (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Error de Multer durante la carga
            return res.status(400).json({ message: 'Error al subir el archivo: ' + err.message });
        } else if (err) {
            // Otro tipo de error
            return res.status(500).json({ message: 'Error al subir el archivo: ' + err.message });
        }

        // Si no hay archivo, continuar sin la imagen
        const fotoPerfil = req.file ? req.file.filename : null;

        const { nombre, pastor, direccion, latitud, longitud, facebook, instagram, sitioWeb, horarios } = req.body;

        const nuevaIglesia = {
            nombre,
            pastor,
            direccion,
            latitud,
            longitud,
            fotoPerfil,
            facebook,
            instagram,
            sitioWeb,
            horarios: JSON.parse(horarios)
        };

        // Aquí llamarías a tu función para insertar la iglesia en la base de datos
        db.insertarIglesia(nuevaIglesia, (error, result) => {
            if (error) {
                return res.status(500).json({ message: error.message });
            }
            res.status(201).json(result);
        });
    });
};

module.exports = {
    login,
    registrarUsuario,
    registrarIglesia
};