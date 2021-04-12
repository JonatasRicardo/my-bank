import Profiles from '../modules/Profiles/ProfilesController';
import { PermissionsMiddleware } from '../middlewares/AccessMiddleware';

module.exports = (app) => {
  // CRUD
  app.post('/api/profiles', PermissionsMiddleware(['manageProfiles']), Profiles.insert);
  app.get('/api/profiles', PermissionsMiddleware(['manageProfiles']), Profiles.list);
  app.get('/api/profile/:id', PermissionsMiddleware(['manageProfiles']), Profiles.get);
  app.put('/api/profile/:id', PermissionsMiddleware(['manageProfiles']), Profiles.update);
};
