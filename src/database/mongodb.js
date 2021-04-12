import mongoose from 'mongoose';
import bluebird from 'bluebird';
import { log, error } from 'console';

mongoose.Promise = bluebird;

function constructURI(dbconf) {
  let uri = '';
  if (dbconf.svr) {
    uri += 'mongodb+srv://';
  } else {
    uri = 'mongodb://';
  }

  if (dbconf.user) {
    if (dbconf.pass) {
      uri += `${dbconf.user}:${dbconf.pass}@`;
    }
  }

  uri += dbconf.addr;

  if (dbconf.port) {
    uri += `:${dbconf.port}`;
  }

  uri += `/${dbconf.db}`;

  if (dbconf.options) {
    uri += `?${dbconf.options}`;
  }

  return uri;
}

let time;
function connectWithRetry(uri) {
  clearTimeout(time);
  mongoose.connect(
    uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
    (err) => {
      if (err) {
        error('[MongoDB]', '"Falha ao se conectar com o servidor mongo - tentando novamente em 5 segundos...', err);
        time = setTimeout(() => connectWithRetry(uri), 5000);
      }
      log('[MongoDB]', 'Conectado!');
    },
  );
}

function activateEventsListners(uri) {
  // Exibe erro no banco de dados e tenta reconectar
  mongoose.connection.on('error', (err) => {
    error('[MongoDB]', 'Erro: ', err);
    mongoose.disconnect();
    connectWithRetry(uri);
  });

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      log('[MongoDB]', 'Mensagem: MongoDB desconectado pelo termino da aplicação.');
      process.exit(0);
    });
  });
}

function run(dbconf) {
  const uri = constructURI(dbconf);
  log('[MongoDB]', `Conectando com: ${uri}`);
  connectWithRetry(uri);
  activateEventsListners(uri);
}

export default run;
