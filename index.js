const app = require('./src/app');
const config = require('./src/config');

// Usar el prefijo de ruta para todas las rutas
app.use('/api.asambleasdedios.gt/api/asambleas', require('./src/modulos/asambleas/rutas'));

  app.get('/api.asambleasdedios.gt/api/asambleas', (req, res) => {
    res.send('It works! API ASAMBLEAS DE DIOS');
  });

app.listen(app.get('port'), '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en el puerto ${config.app.port}`);
});
