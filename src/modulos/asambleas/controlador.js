const db = require('../../DB/mysql');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'D:\\PROTOTIPO ASAMBLEAS DE DIOS\\imagenes\\iglesias\\') // Nueva ruta para guardar las imágenes
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage }).single('fotoPerfil');

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
            return res.status(500).json({ message: 'Error al subir el archivo' });
        } else if (err) {
            return res.status(500).json({ message: 'Error desconocido al subir el archivo' });
        }

        const { nombre, pastor, direccion, latitud, longitud, facebook, instagram, sitioWeb, horarios } = req.body;
        const fotoPerfil = req.file ? req.file.path : null;

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