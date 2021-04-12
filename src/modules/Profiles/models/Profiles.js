const mongoose = require('mongoose');

const schema = mongoose.Schema({
  name: String,
  active: Boolean,
  template: Boolean,
  extendsFrom: String,
  permissions: {
    manageUsers: Boolean,
    manageProfiles: Boolean,
  },
});

export default mongoose.model('profiles', schema, 'profiles');
