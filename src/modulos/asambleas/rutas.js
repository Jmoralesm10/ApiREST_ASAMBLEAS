const express = require('express');
const controlador = require('./controlador');

const respuestas = require('../../red/respuestas');

const router = express.Router();

router.post('/login', controlador.login);

// Cambiamos esta línea para usar el controlador correcto
router.post('/registro', controlador.registrarUsuario);

// Ruta para registrar una iglesia
router.post('/registro-iglesia', controlador.registrarIglesia);

router.get('/buscar-iglesias', controlador.buscarIglesias);

module.exports = router;