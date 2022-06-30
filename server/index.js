import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import multer from 'multer';
import controllers from './controllers';

const app = express();
const upload = multer();

const { SWARM_PORT: port = '4000', NODE_ENV: env = 'production', REACT_APP_GRAFANA_HOST_URL } = process.env;

app.set('views', path.join(__dirname, '../client/build'));
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// for parsing multipart/form-data
app.use(upload.any());

app.use('/api', controllers);

app.get('/*', (req, res) => {
  res.render(path.join(__dirname, '../client/build/index.html'), { REACT_APP_GRAFANA_HOST_URL });
});

if (env !== 'test') {
  app.listen(port, err => {
    console.log(`Started on port ${port} in ${env} mode`);
  });
}

export default app;
