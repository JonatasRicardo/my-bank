const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const schema = mongoose.Schema({
  nome: String,
  perfil: [{ type: ObjectId, ref: 'profiles' }],
  email: String,
  empresa: String,
  ativo: Boolean,
  modificacoes: [{
    usuario: { type: ObjectId, ref: 'usuarios' },
    data: Date,
  }],
});

export default mongoose.model('usuarios', schema, 'usuarios');
