const express = require('express');
const controlador = require('./controlador');

const router = express.Router();

router.post('/login', controlador.login);
router.post('/registro', controlador.registrarUsuario);
router.post('/registro-iglesia', controlador.registrarIglesia);
router.get('/buscar-iglesias', controlador.buscarIglesias);
router.get('/buscar-pastores', controlador.buscarPastores);
router.post('/crear-anuncio', controlador.crearAnuncio);
router.get('/obtener-anuncios', controlador.obtenerAnuncios);
router.post('/insertar-pastor', controlador.insertarPastor);
router.post('/agregar-favorito', controlador.añadirPastorAFavoritos);
router.post('/eliminar-favorito', controlador.eliminarPastorDeFavoritos);

module.exports = router;