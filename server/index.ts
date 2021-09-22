import dotenv from 'dotenv';
dotenv.config();
import {App} from './app';

const app = new App().App;
const port = process.env.PORT || 8080;

app.listen(port, (err: any) => {
    if (err) {
        return console.error(err);
    }
    return console.log('Application is running on port - ', port);
});

process.on('uncaughtException', (err) => {
    // Handle the error in the code, if this happens.
    console.error('Uncaught Exception occurred while execution, Root cause: ', err);
});
