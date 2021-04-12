import { error } from 'console';
import axios from 'axios';

import Usuarios from './models/Usuarios';
import { processFields } from '../MongooseFilterPagination';

const { ObjectId } = require('mongoose').Types;

const validFields = {
  nome: val => new RegExp(val, 'y'),
  empresa: val => new RegExp(val, 'y'),
  email: val => new RegExp(val, 'y'),
  perfil: val => new RegExp(val, 'y'),
  ativo: val => val,
};

const validFieldsString = Object.keys(validFields).join(' ');

async function createUser(_usuario) {
  const usuario = _usuario;
  const arrUser = await Usuarios.find({
    $or: [{ rid: usuario.rid }, { ccureId: usuario.ccureId }],
  });
  const control = (usuario._id) ? 'EDITAR' : 'NOVO'; // eslint-disable-line no-underscore-dangle
  let message;
  let status;

  if ((arrUser.length > 0) && control === 'NOVO') {
    status = 500;
    message = `Usuário com rid ${usuario.rid} já cadastrado no sistema`;
    return { message, status, json: arrUser[0] };
  }

  const user = await Usuarios.findOneAndUpdate(
    { _id: new ObjectId(usuario._id) }, usuario, // eslint-disable-line no-underscore-dangle
    { upsert: true, new: true, runValidators: true },
  );

  return { message, status, json: user };
}

async function create(req, res) {
  try {
    const { body, usuario } = req;
    const { _id: autor, perfil } = usuario;
    body.autor = autor;
    body.cadastro = new Date();

    const hasAccess = perfil.some(p => p.permissions.manageUsers);
    if (!hasAccess) {
      error('Não permitido devido ao Profile - YOU...SHALL-NOT-PASS!!!!!!');
      return res.status(403).send({ message: 'Não permitido devido ao Perfil' });
    }

    const createUserInfo = await createUser(body);
    const {
      message,
      status,
      json,
    } = createUserInfo;

    if (status === 500) {
      return res.status(status).send({ message, json });
    }

    return res.json(json);
  } catch (err) {
    error('[SERV-ERROR]', err);
    return res.status(500).send();
  }
}

async function list(req, res) {
  try {
    const hasAccess = req.usuario.perfil.some(p => p.permissions.manageUsers);
    if (!hasAccess) {
      error('Não permitido devido ao Profile - YOU...SHALL-NOT-PASS!!!!!!');
      return res.status(403).send({ message: 'Não permitido devido ao Perfil' });
    }

    const {
      fields = '*',
      limit = 50,
      skip = 0,
      filter = '',
      order = 'asc',
      orderby = '',
    } = req.query;

    const startAt = limit ? skip : 0;
    const finishAt = limit === '*' ? 0 : limit;
    const sortDirection = order === 'desc' ? -1 : 1;

    const arrayFilter = filter.split(',');
    const arrayFilterSQ = filter.split(':').length;
    const emptySearch = filter === '';
    const singleSearchTerm = arrayFilter.length <= 1 && arrayFilterSQ !== 2;
    const mongoQuery = {};

    if (singleSearchTerm && !emptySearch) {
      mongoQuery.$or = [];
      Object.keys(validFields).forEach((field) => {
        mongoQuery.$or.push({ [field]: validFields[field](filter) });
      });
    } else if (!emptySearch) {
      arrayFilter.forEach(async (filterItem) => {
        const keyValue = filterItem.split(':');
        const [key, ...arrValue] = keyValue;
        const value = arrValue.join(':');

        mongoQuery[key] = validFields[key](value);
      });
    }

    const campos = fields !== '*' ? processFields(fields, Object.keys(validFields)) : validFieldsString;
    const ordenacao = {};
    if (orderby !== '') ordenacao[orderby] = sortDirection;

    const total = await Usuarios.find(mongoQuery).count();
    const usuarios = await Usuarios.find(mongoQuery)
      .select(campos.toString().trim())
      .sort(ordenacao)
      .skip(Number(startAt))
      .limit(Number(finishAt));

    return res.status(200).send({
      total,
      limit: Number(finishAt),
      offset: Number(startAt),
      data: usuarios,
    });
  } catch (err) {
    error(err);
    return res.status(500).send();
  }
}

async function update(req, res) {
  const { body, usuario } = req;
  const { _id: usuarioId, perfil } = usuario;
  const { id } = req.params;

  const hasAccess = perfil.some(p => p.permissions.manageUsers);
  if (!hasAccess) {
    error('Não permitido devido ao Profile - YOU...SHALL-NOT-PASS!!!!!!');
    return res.status(403).send({ message: 'Não permitido devido ao Perfil' });
  }

  const modificacoes = {
    usuario: usuarioId,
    data: new Date(),
  };

  delete body.modificacoes;
  delete body.cadastro;
  delete body.autor;

  try {
    const updated = await Usuarios.findOneAndUpdate(
      { _id: id },
      { $set: body, $push: { modificacoes } },
      { new: true },
    ).populate('modificacoes.usuario').populate('profiles', 'name');

    return res.json(updated);
  } catch (err) {
    error('[SERV-ERROR]', err);
    return res.status(500).send();
  }
}

async function view(req, res) {
  const { id } = req.params;

  const hasAccess = req.usuario.perfil.some(p => p.permissions.manageUsers);
  if (!hasAccess) {
    error('Não permitido devido ao Profile - YOU...SHALL-NOT-PASS!!!!!!');
    return res.status(403).send({ message: 'Não permitido devido ao Perfil' });
  }

  try {
    const responsavel = await Usuarios.findById(id).populate('profiles', 'name');
    if (!responsavel) return res.status(404).send();
    return res.json(responsavel);
  } catch (err) {
    error('[SERV-ERROR]', err);
    return res.status(500).send();
  }
}

async function currentUserInfo(req, res) {
  try {
    const { usuario } = req;
    return res.json(usuario);
  } catch (err) {
    error('[SERV-ERROR]', err);
    return res.status(500).send(err);
  }
}

async function getFoto(req, res) {
  const baseunica = process.env.API_BASE_UNICA;
  const { id } = req.params;

  try {
    const response = await axios.get(`${baseunica}/api/pessoas/${id}/img`, {
      responseType: 'arraybuffer',
    });
    res.type('jpeg');
    const bin = Buffer.from(response.data, 'binary');
    return res.end(bin);
  } catch (err) {
    error('[SERV-ERROR]', err);
    return res.status(500).send();
  }
}

async function minhaFoto(req, res) {
  try {
    req.params = {
      id: req.usuario.rid,
    };
    return getFoto(req, res);
  } catch (err) {
    error('[SERV-ERROR]', err);
    return res.status(500).send();
  }
}

async function getPersonByName(req, res) {
  const { q } = req.query;
  const { API_BASE_UNICA } = process.env;
  try {
    const { data } = await axios.get(`${API_BASE_UNICA}/api/pessoas?filter=${q}&fields=*`);
    return res.json(data);
  } catch (err) {
    error(err);
    return res.status(500).send();
  }
}

async function logout(req, res) {
  res.cookie('__SSOACCESS__', '', {
    httpOnly: true,
    expires: new Date(Date.now() - 100),
  });
  return res.status(401).send();
}

export default {
  minhaFoto,
  getFoto,
  create,
  list,
  update,
  view,
  logout,
  currentUserInfo,
  createUser,
  getPersonByName,
};
