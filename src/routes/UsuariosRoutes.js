import Usuarios from '../modules/Usuarios/UsuariosController';
import { PermissionsMiddleware } from '../middlewares/AccessMiddleware';

module.exports = (app) => {
  app.get('/api/usuarios', PermissionsMiddleware(['manageUsers']), Usuarios.list);
  app.get('/api/usuarios/:id', PermissionsMiddleware(['manageUsers']), Usuarios.view);
  app.put('/api/usuarios/:id', PermissionsMiddleware(['manageUsers']), Usuarios.update);
  app.post('/api/usuarios', PermissionsMiddleware(['manageUsers']), Usuarios.create);
  app.get('/api/currentUserInfo', Usuarios.currentUserInfo);
};
