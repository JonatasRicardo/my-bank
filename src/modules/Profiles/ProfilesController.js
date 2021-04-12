import { error } from 'console';

import { processFields } from '../../modules/MongooseFilterPagination';
import Profiles from './models/Profiles';

const validFields = {
  name: val => new RegExp(val, 'y'),
  template: val => new RegExp(val, 'y'),
  active: val => new RegExp(val, 'y'),
};

const validFieldsString = Object.keys(validFields).join(' ');

async function insert(req, res) {
  try {
    const { body, usuario: { profiles } } = req;

    // Verificação de acesso
    const hasAccess = profiles.some(p => p.manageUsers);

    if (!hasAccess) {
      error('Não permitido devido ao Profile - YOU...SHALL-NOT-PASS!!!!!!');
      return res.status(403).send();
    }

    const profile = await Profiles.create(body);
    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error', sysmsg: err });
  }
}

async function get(req, res) {
  const { id } = req.params;

  try {
    const profile = await Profiles.findById(id);

    if (!profile) {
      error('Profile Não encontrado');
      return res.status(404).send();
    }

    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error', sysmsg: err });
  }
}

async function list(req, res) {
  try {
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

    const total = await Profiles.find(mongoQuery).count();
    const profiles = await Profiles.find(mongoQuery)
      .select(campos.toString().trim())
      .sort(ordenacao)
      .skip(Number(startAt))
      .limit(Number(finishAt));

    return res.status(200).send({
      total,
      limit: Number(finishAt),
      offset: Number(startAt),
      data: profiles,
    });
  } catch (err) {
    error(err);
    return res.status(500).send();
  }
}

async function update(req, res) {
  try {
    const {
      usuario: { profiles },
      params: { id },
      body,
    } = req;

    // Verificação de acesso
    const hasAccess = profiles.some(p => p.manageUsers);

    if (!hasAccess) {
      error('Não permitido devido ao Profile - YOU...SHALL-NOT-PASS!!!!!!');
      return res.status(403).send();
    }

    const profile = await Profiles.findByIdAndUpdate(id, body);
    if (!profile) {
      error('Profile Não encontrado');
      return res.status(404).send();
    }

    return res.status(200).json(profile);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error', sysmsg: err });
  }
}

async function busca(req, res) {
  try {
    const profiles = await Profiles.find({ template: false });

    if (!profiles) {
      error('Profiles Não encontrado');
      return res.status(404).send();
    }

    const result = profiles.map(profile => ({ value: profile.id, label: profile.name }));

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error', sysmsg: err });
  }
}

async function getTemplates(req, res) {
  try {
    const templates = await Profiles.find({ template: true });

    if (!templates) {
      error('Templates não encontrados');
      return res.status(404).send();
    }

    const result = templates.map(profile => ({ value: profile.id, label: profile.name }));

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error', sysmsg: err });
  }
}

export default {
  list,
  get,
  insert,
  update,
  busca,
  getTemplates,
};
