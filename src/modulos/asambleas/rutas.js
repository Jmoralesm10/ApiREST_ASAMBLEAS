const express = require('express');
const controlador = require('./controlador');

const respuestas = require('../../red/respuestas');

const router = express.Router();


router.post('/login', controlador.login);

module.exports = router;