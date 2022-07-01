import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import multer from 'multer';
import controllers from './controllers';

const app = express();
const upload = multer();

const { SWARM_PORT: port = '4000', NODE_ENV: env = 'production'} = process.env;

app.use(express.static(path.join(__dirname, '../client/build')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// for parsing multipart/form-data
app.use(upload.any());

app.use('/api', controllers);

app.get('/*', (req, res) => {
  res.sendfile(path.join(__dirname, '../client/build/index.html'));
});

if (env !== 'test') {
  app.listen(port, err => {
    console.log(`Started on port ${port} in ${env} mode`);
  });
}

export default app;
