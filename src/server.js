import '@babel/polyfill';
import { log } from 'console';
import ExpressApplication from './express';
import configs from './config/index';


const config = configs;

const app = ExpressApplication(config);

log('[Servidor]', 'Iniciado na porta servidor...');
app.listen(config.server.port, () => {
  log('[Servidor]', `Iniciado na porta ${config.server.port}`);
});
