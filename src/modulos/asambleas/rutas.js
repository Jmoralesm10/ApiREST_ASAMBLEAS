const express = require('express');

const respuestas = require('../../red/respuestas');

const router = express.Router();

router.get('/', function(req, res) {
    respuestas.success(req, res, 'Lista de asambleas se muestra correctamente', 200);
});

router.post('/', function(req, res) {
    res.send('POST ASAMBLEAS');
});

module.exports = router;