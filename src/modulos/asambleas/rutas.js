const express = require('express');
const controlador = require('./controlador');

const router = express.Router();

router.post('/login', controlador.login);
router.post('/registro', controlador.registrarUsuario);
router.post('/registro-iglesia', controlador.registrarIglesia);
router.get('/buscar-iglesias', controlador.buscarIglesias);
router.post('/insertar-pastor', controlador.insertarPastor); // Nueva ruta para insertar pastor

module.exports = router;