function hasAccess(roles, userProfiles = []) {
  let canAccess = false;
  roles.forEach((currentRole) => {
    canAccess = userProfiles.some(({ permissions = { } }) => permissions[currentRole])
      ? true
      : canAccess;
  });
  return canAccess;
}

export function PermissionsMiddleware(roles) {
  return function profileAccess(req, res, next) {
    if (hasAccess(roles, req.usuario.perfil)) {
      next();
      return '';
    }
    return res.status(403).json({ message: 'Acesso não autorizado' });
  };
}

export default {
  PermissionsMiddleware,
};
