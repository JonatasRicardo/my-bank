import { log } from 'console';

const {
  PORT, // Por...import { log } from 'console';
  TOKEN = 'P7TPwLX8W#upnR@KhAHjTtk+MbRf!n%tvA37sdZ@SqTe&A3mCkuudYBE^N#_@dJ3Uvq!AjFVru%HX*%!WkkDbd*', // Token de segurança da aplicação
  SALT = 'yfGhTNXc$@+NwJ4=6k%h?yuYkqk4v4Ae!9fUJ9Y*%', // Sal da aplicação para hashes
  LOG_LEVEL = 'dev', // Nivel de Log: composed | dev | **custom
  SSO_URL, // Endereço externo do SSO
  SSO_API, // Endereço interno do SSO
  SSO_ENABLED, // Define se SSO está ativo ou não
  MONGO_SVR,
  MONGO_USER = false, // Usuário de acesso ao MongoDB
  MONGO_PASS = false, // Senha de acesso ao MongoDB
  MONGO_ADDR, // Endereço do MongoDB
  MONGO_PORT, // Porta do mongoDB
  MONGO_DB, // Banco do MongoDB
  MONGO_OPTIONS,
  VIRTUAL_HOST = 'localhost', // Endereco da aplicação para ser reconhecido no proxy reverso
  IS_SECURE, // A aplicação utilizará HTTPS
  CORS_ENABLED, // Filtro CORS ativado?
  CORS_ALLOWED, // Lista de endereços separados por ponto e virgula autorizados para CORS
} = process.env;

const config = {
  server: {
    port: PORT,
    isSecure: IS_SECURE === 'TRUE',
    url: VIRTUAL_HOST,
    staticPath: './src/public',
    logging: {
      level: LOG_LEVEL,
      file: false,
    },
  },
  useViewEngine: false,
  sso: {
    enabled: false,
  },
  cors: {},
  security: {
    tokenSecrete: TOKEN,
    salt: SALT,
    disabledHeader: [
      'x-powered-by',
    ],

    hidePoweredBy: 'PHP 5.5.14',
    blockXSS: true,
    nosniff: false,
  },
  database: {
    mongodb: {},
    oracle: {},
  },
};

if (SSO_ENABLED === 'TRUE') {
  const sso = { enabled: true };

  if (!SSO_URL) throw new Error('Se o SSO estiver habilitado a variável SSO_URL é obrigatório');
  if (!SSO_API) throw new Error('Se o SSO estiver habilitado a variável SSO_API é obrigatório');
  sso.url = SSO_URL;
  sso.api = SSO_API;

  config.sso = sso;
}

if (CORS_ENABLED === 'TRUE') {
  config.cors.enabled = true;
  const allowedOrigins = CORS_ALLOWED.split(';');

  if (allowedOrigins.length === 0) {
    log('ATENÇÃO:', 'CORS ativado sem nenhuma origem definida pode causar erros na aplicação.');
  }

  config.cors.allowedOrigins = allowedOrigins;
}

if (MONGO_ADDR) {
  const mongodb = {
    svr: (MONGO_SVR.toLowerCase() === 'true'),
    user: MONGO_USER,
    pass: MONGO_PASS,
    addr: MONGO_ADDR,
    port: MONGO_PORT,
    options: MONGO_OPTIONS,
  };

  if (!MONGO_DB) throw new Error('MONGO_DB deve está definido.');

  mongodb.db = MONGO_DB;
  config.database.mongodb = mongodb;
} else {
  config.database.mongodb = false;
}

export default config;
