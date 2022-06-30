import { Router } from 'express';
import { name, version } from '../../package.json';
import jenkins from './jenkins';

let route = Router({
  caseSensitive: true
});

route.use('/jenkins', jenkins);

route.get('/', (req, res) => {
  res.json({ name, version });
});

export default route;
