const db = require('../../DB/mysql');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken'); // Importación de la librería jwt para generar tokens
const fs = require('fs').promises;

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', '..', '..', 'imagenes', 'iglesias');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage }).single('imagen');

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await new Promise((resolve, reject) => {
            db.login(email, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });

        if (result.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const usuario = result[0];
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = generarToken(usuario);
        res.status(200).json({ 
            message: 'Inicio de sesión exitoso',
            token: token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                // Otros datos del usuario que quieras enviar
            }
        });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Función para generar un token JWT
const generarToken = (usuario) => {
    return jwt.sign({ id: usuario.id, email: usuario.email }, 'tu_secreto', { expiresIn: '1h' });
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
            return res.status(500).json({ message: 'Error al subir el archivo: ' + err.message });
        } else if (err) {
            return res.status(500).json({ message: 'Error desconocido al subir el archivo: ' + err.message });
        }

        const { nombre, pastor, direccion, latitud, longitud, facebook, instagram, sitioWeb, horarios } = req.body;
        const fotoPerfil = req.file ? req.file.filename : null; // Guardamos solo el nombre del archivo

        // Convertir horarios a formato array de objetos
        let horariosFormateados;
        try {
            const horariosObj = JSON.parse(horarios);
            horariosFormateados = Object.entries(horariosObj).reduce((acc, [dia, horas]) => {
                horas.forEach(hora => {
                    acc.push({ dia, hora });
                });
                return acc;
            }, []);
        } catch (error) {
            return res.status(400).json({ message: 'Error al procesar los horarios: ' + error.message });
        }

        console.log('Horarios formateados:', horariosFormateados);

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
            horarios: JSON.stringify(horariosFormateados)
        };

        db.insertarIglesia(nuevaIglesia, (error, result) => {
            if (error) {
                console.error('Error al insertar iglesia:', error);
                return res.status(500).json({ message: error.message });
            }
            res.status(201).json(result);
        });
    });
};

const buscarIglesias = async (req, res) => {
    const { nombre } = req.query;
    db.buscarIglesiaPorNombre(nombre, async (error, result) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al buscar iglesias', detalles: error.message });
        }
        
        try {
            const iglesiasConImagenes = result[0].map(iglesia => {
                const redesSociales = {};
                const horariosServicios = {};

                if (iglesia.redes_sociales) {
                    // Modificación aquí: Manejar URLs con caracteres especiales
                    const redesArray = iglesia.redes_sociales.split(';');
                    redesArray.forEach(red => {
                        const [plataforma, ...urlParts] = red.split(':');
                        const url = urlParts.join(':').trim(); // Reunir todas las partes de la URL
                        redesSociales[plataforma.trim()] = url.replace(/^@/, ''); // Eliminar el @ inicial si existe
                    });
                }

                if (iglesia.horarios_servicios) {
                    iglesia.horarios_servicios.split(';').forEach(horario => {
                        const [dia, hora] = horario.split(':');
                        if (!horariosServicios[dia.trim()]) {
                            horariosServicios[dia.trim()] = [];
                        }
                        horariosServicios[dia.trim()].push(hora.trim());
                    });
                }

                return {
                    ...iglesia,
                    fotoPerfil: iglesia.fotoPerfil ? `/imagenes/iglesias/${iglesia.fotoPerfil}` : null,
                    redes_sociales: redesSociales,
                    horarios_servicios: horariosServicios
                };
            });
            
            res.status(200).json(iglesiasConImagenes);
        } catch (err) {
            res.status(500).json({ mensaje: 'Error al procesar las iglesias', detalles: err.message });
        }
    });
};

const insertarPastor = (req, res) => {
    uploadPastor(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ message: 'Error al subir el archivo: ' + err.message });
        } else if (err) {
            return res.status(500).json({ message: 'Error desconocido al subir el archivo: ' + err.message });
        }

        const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, iglesia_id, cargo_id } = req.body;
        const fotoPerfil = req.file ? req.file.filename : null;

        db.insertarPastor(
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            iglesia_id,
            cargo_id,
            fotoPerfil,
            (error, result) => {
                if (error) {
                    console.error('Error al insertar pastor:', error);
                    return res.status(500).json({ mensaje: 'Error al insertar pastor', detalles: error.message });
                }
                res.status(201).json({ mensaje: 'Pastor insertado con éxito', resultado: result });
            }
        );
    });
};

// Configuración de multer para la carga de archivos de pastores
const storagePastor = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', '..', '..', 'imagenes', 'pastores');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const uploadPastor = multer({ storage: storagePastor }).single('fotoPerfil');

module.exports = {
    login,
    registrarUsuario,
    registrarIglesia,
    buscarIglesias,
    insertarPastor // Añadir esta nueva función al módulo de exportación
};