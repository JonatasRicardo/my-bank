import jwt from 'jsonwebtoken';
import { error } from 'console';

const Mongoose = require('mongoose');

export default function (req, res, next) {
  const config = req.app.get('config');
  const { header: { Accept } } = req;

  const isJson = (Accept === 'application/json');

  const redirect = `${config.sso.url}/?do=${config.server.isSecure ? 'https' : 'http'}://${config.server.url}`;

  if (!req.cookies) {
    if (isJson) {
      return res.status(401).json({ goto: redirect });
    }

    return res.redirect(redirect);
  }

  const { __SSOACCESS__ } = req.cookies;

  jwt.verify(__SSOACCESS__, config.security.tokenSecrete, async (err, token) => {
    if (err) {
      if (isJson) {
        return res.status(401).json({ goto: redirect });
      }

      return res.redirect(redirect);
    }

    const Usuarios = Mongoose.model('usuarios');

    try {
      const usuario = await Usuarios.findOne({ rid: token.rid, ativo: true }).populate('perfil', ['name', 'permissions']);
      if (!usuario) {
        if (isJson) {
          return res.status(401).json({ goto: redirect });
        }

        return res.redirect(redirect);
      }

      const userJson = usuario.toJSON();
      // eslint-disable-next-line no-underscore-dangle
      const profilesName = userJson.perfil.map(profile => profile._id);
      usuario.profilesName = profilesName;

      req.usuario = usuario;
      next();
      return '';
    } catch (err1) {
      error(err1);
      return '';
    }
  });

  return '';
}
