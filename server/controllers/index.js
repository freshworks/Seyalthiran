import { Router } from 'express';
import { name, version } from '../../package.json';
import jenkins from './jenkins';
const { REACT_APP_GRAFANA_HOST_URL } = process.env;

let route = Router({
  caseSensitive: true
});

route.use('/jenkins', jenkins);

route.get('/getGrafanaHost', (req, res) => {
  res.status(200).send({ REACT_APP_GRAFANA_HOST_URL });
})

route.get('/', (req, res) => {
  res.json({ name, version });
});

export default route;
