const app = require('./app');
const config = require('./config');

app.listen(app.get('port'), () => {
    console.log(`Server is running on port ${config.app.port}`);
});