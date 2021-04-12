import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import expressLoad from 'express-load';
import fileUpload from 'express-fileupload';
import helmet from 'helmet';
import fs from 'fs';
import rfs from 'rotating-file-stream';
import path from 'path';
import { log } from 'console';
import MongoDBCli from './database/mongodb';
import SSOMiddleware from './middlewares/SSOMiddleware';

const morgan = require('morgan');
const bodyParser = require('body-parser');

module.exports = (conf) => {
  log('[Express]', 'Iniciando Framework');
  const app = express();

  if (conf.useViewEngine) {
    app.set('view engine', 'ejs');
    app.set('views', 'src/views');
  }
  /**
   * Banco de dados
   */
  // Inicia MongoDB
  if (conf.database.mongodb) {
    MongoDBCli(conf.database.mongodb);
  }

  /**
   * Define o nivel de log e se o log vai ser na tela ou em arquivo
   */
  if (conf.server.logging.file) {
    const logDir = path.join(__dirname, '..', 'log');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    const accessLogStream = rfs('access.log', {
      interval: '1d',
      path: logDir,
    });

    app.use(morgan(conf.server.logging.level, {
      stream: accessLogStream,
    }));
  } else {
    app.use(morgan(conf.server.logging.level));
  }

  /**
   * Carrega as diretivas e middlewares basicos do express
   */
  // Carrega configuração para dentro da aplicação
  app.set('config', conf);

  // Interpreta cookie e injeta na requisição
  app.use(cookieParser());

  // Interpreta body params e injeta na requisição
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Recebe arquivos e injeta na requisição
  app.use(fileUpload());

  /**
   * Responde filtro cors
   */
  if (conf.cors.enabled === true) {
    app.use(cors({
      origin: (origin, callback) => {
        if (typeof origin === 'undefined') {
          callback(null, true);
        } else if (conf.cors.allowedOrigins
          && conf.cors.allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Bloqueado no CORS'));
        }
      },
      optionsSuccessStatus: 200,
      methods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      exposedHeaders: ['X-Request-Width', 'Content-Type', 'X-Codingpedia', 'Credentials', 'Origin'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'cache-control', 'expires', 'pragma'],
    }));
  }

  /**
   * Adiciona middleware do SSO
   */
  if (conf.sso.enabled === true) {
    app.use(SSOMiddleware);
  }

  /**
   * Configura o diretório public com base no arquivo de configurção
   * O diretório estatico será definido na propiedade 'server.staticPath'
   * caso esta estiver definida como false o diretório estático será
   * definido como: './public'
   */
  app.use(express.static(conf.server.staticPath || './public'));

  // Carrega as rotas e modelos
  expressLoad('routes', { cwd: 'src' }).into(app);

  /**
   * Define os parâmetros de segurança da aplicação via HelmetJS
   */
  // Iniciao o HelmetJS
  app.use(helmet());

  // Desabilita os cabeçalhos listados na configuração
  conf.security.disabledHeader.forEach((e) => {
    app.disable(e);
  });

  // Modifica o PoweredBy para a string desejada
  if (conf.security.hidePoweredBy) {
    app.use(helmet.hidePoweredBy(conf.security.hidePoweredBy));
  }

  // Bloqueia tentativas de XSS
  if (conf.security.blockXSS) {
    app.use(helmet.xssFilter());
  }

  // Bloqueia tentativas de Sniff
  if (conf.security.nosniff) {
    app.use(helmet.noSniff());
  }

  return app;
};
