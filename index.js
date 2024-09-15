const app = require('./src/app');
const config = require('./src/config');

app.listen(app.get('port'), () => {
    console.log(`Server is running on port ${config.app.port}`);
});