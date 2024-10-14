const db = require('../../DB/mysql');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        if (file.fieldname === 'imagen') {
            uploadPath = path.join(__dirname, '..', '..', '..', 'imagenes', 'iglesias'); // Cambiado a 'iglesias'
        } else {
            uploadPath = path.join(__dirname, '..', '..', '..', 'archivos');
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage }).fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'archivo', maxCount: 1 }
]);

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await new Promise((resolve, reject) => {
            db.login(email, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });

        if (result[0].length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const usuario = result[0][0];
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = generarToken(usuario);
        res.status(200).json({ 
            message: 'Inicio de sesión exitoso',
            token: token,
            usuario: {
                id: usuario.id_usuario,
                email: usuario.email,
                idRol: usuario.id_rol
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
        const fotoPerfil = req.files['imagen'] ? req.files['imagen'][0].filename : null; // Cambiado a req.files['imagen']

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

// Configuración de multer para la carga de archivos de pastores
const storagePastor = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', '..', '..', 'imagenes', 'pastores'); // Asegurarse de que esté correcto
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const uploadPastor = multer({ storage: storagePastor }).single('fotoPerfil');

const insertarPastor = (req, res) => {
    uploadPastor(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ message: 'Error al subir el archivo: ' + err.message });
        } else if (err) {
            return res.status(500).json({ message: 'Error desconocido al subir el archivo: ' + err.message });
        }

        const { 
            primer_nombre, 
            segundo_nombre, 
            primer_apellido, 
            segundo_apellido, 
            iglesia_id, 
            cargo_id,
            dpi,
            fecha_nacimiento,
            carnet_pastor,
            email,
            telefono,
            fecha_inicio_cargo,
            estudio_biblico
        } = req.body;
        const fotoPerfil = req.file ? req.file.filename : null;

        db.insertarPastor(
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            iglesia_id,
            cargo_id,
            fotoPerfil,
            dpi,
            fecha_nacimiento,
            carnet_pastor,
            email,
            telefono,
            fecha_inicio_cargo,
            estudio_biblico,
            (error, result) => {
                if (error) {
                    return res.status(500).json({ mensaje: 'Error al insertar pastor', detalles: error.message });
                }
                res.status(201).json({ mensaje: 'Pastor insertado con éxito', resultado: result });
            }
        );
    });
};

const buscarPastores = async (req, res) => {
    const { nombre, dpi } = req.query;
    
    if (!nombre && !dpi) {
        return res.status(400).json({ mensaje: 'Debe proporcionar al menos un criterio de búsqueda (nombre o dpi).' });
    }

    db.buscarPastores(nombre, dpi, (error, result) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al buscar pastores', detalles: error.message });
        }
        
        try {
            const pastoresConImagenes = result[0].map(pastor => {
                // Eliminamos el campo foto_perfil y usamos solo fotoPerfil
                const { foto_perfil, ...pastorSinFotoDuplicada } = pastor;
                return {
                    ...pastorSinFotoDuplicada,
                    fotoPerfil: foto_perfil ? `/imagenes/pastores/${foto_perfil}` : null
                };
            });
            
            res.status(200).json(pastoresConImagenes);
        } catch (err) {
            res.status(500).json({ mensaje: 'Error al procesar los pastores', detalles: err.message });
        }
    });
};

// Configuración de multer para la carga de archivos de anuncios
const storageAnuncio = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        if (file.mimetype.startsWith('image/')) {
            uploadPath = path.join(__dirname, '..', '..', '..', 'imagenes', 'anuncios');
        } else {
            uploadPath = path.join(__dirname, '..', '..', '..', 'archivos');
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido: ' + file.mimetype), false);
    }
};

const uploadAnuncio = multer({ 
    storage: storageAnuncio,
    fileFilter: fileFilter
}).fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'archivo', maxCount: 1 }
]);

const crearAnuncio = (req, res) => {

    uploadAnuncio(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ message: 'Error al subir el archivo: ' + err.message });
        } else if (err) {
            return res.status(500).json({ message: 'Error desconocido al subir el archivo: ' + err.message });
        }

        const { email, texto } = req.body;
        const imagen = req.files['imagen'] ? req.files['imagen'][0].filename : null;
        const archivo = req.files['archivo'] ? req.files['archivo'][0].filename : null;

        db.insertarAnuncio(email, texto, imagen, archivo, (error, result) => {
            if (error) {
                if (error.code === 'CUSTOM_ERROR') {
                    return res.status(400).json({ mensaje: error.message });
                }
                return res.status(500).json({ mensaje: 'Error al insertar anuncio', detalles: error.message });
            }
            res.status(201).json({ mensaje: 'Anuncio creado con éxito', resultado: result });
        });
    });
};

const obtenerAnuncios = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ mensaje: 'El email es requerido' });
    }

    try {
        // Obtener el ID del usuario a partir del email
        const usuario = await new Promise((resolve, reject) => {
            db.obtenerUsuarioPorEmail(email, (error, result) => {
                if (error) reject(error);
                else resolve(result[0]);
            });
        });

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const usuarioId = usuario.id_usuario;

        // Llamar al procedimiento almacenado
        db.query('CALL ObtenerAnuncios(?)', [usuarioId], (error, result) => {
            if (error) {
                return res.status(500).json({ mensaje: 'Error al obtener anuncios', detalles: error.message });
            }

            try {
                const anunciosConArchivos = result[0].map(anuncio => ({
                    ...anuncio,
                    imagen: anuncio.imagen ? `/imagenes/anuncios/${anuncio.imagen}` : null,
                    pdf: anuncio.pdf ? `/archivos/${anuncio.pdf}` : null,
                    foto_perfil_pastor: anuncio.foto_perfil_pastor ? `/imagenes/pastores/${anuncio.foto_perfil_pastor}` : null,
                    foto_perfil_iglesia: anuncio.foto_perfil_iglesia ? `/imagenes/iglesias/${anuncio.foto_perfil_iglesia}` : null
                }));

                res.status(200).json(anunciosConArchivos);
            } catch (err) {
                res.status(500).json({ mensaje: 'Error al procesar los anuncios', detalles: err.message });
            }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuario', detalles: error.message });
    }
};

const añadirPastorAFavoritos = (req, res) => {
    const { userEmail, pastorEmail } = req.body;

    db.añadirPastorAFavoritos(userEmail, pastorEmail, (error, result) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al añadir pastor a favoritos', detalles: error.message });
        }
        res.status(201).json({ mensaje: 'Pastor añadido a favoritos con éxito', resultado: result });
    });
};

const eliminarPastorDeFavoritos = (req, res) => {
    const { userEmail, pastorEmail } = req.body;

    db.eliminarPastorDeFavoritos(userEmail, pastorEmail, (error, result) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al eliminar pastor de favoritos', detalles: error.message });
        }
        res.status(200).json({ mensaje: 'Pastor eliminado de favoritos con éxito', resultado: result });
    });
};

module.exports = {
    login,
    registrarUsuario,
    registrarIglesia,
    buscarIglesias,
    insertarPastor,
    buscarPastores,
    crearAnuncio,
    obtenerAnuncios,
    añadirPastorAFavoritos,
    eliminarPastorDeFavoritos
};