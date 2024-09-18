const app = require('./src/app');
const config = require('./src/config');

// Definir el prefijo de ruta base
const BASE_PATH = '/api.asambleasdedios.gt/api/asambleas';

// Usar el prefijo de ruta para todas las rutas
app.use(BASE_PATH, require('./src/modulos/asambleas/rutas'));

app.listen(app.get('port'), '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en el puerto ${config.app.port}`);
});
