const mongoose = require('mongoose');

const schema = mongoose.Schema({
  name: String,
  email: String,
  address: String,
  cpf: String,
  type: {
      type: String,
      enum: ['PJ', 'PF']
  },
  cnpj: String
});

export default mongoose.model('clients', schema, 'clients');
