export function processFields(fields, validFields) {
  let planFields = '';
  if (!fields) {
    return planFields;
  }
  fields.split(',').forEach((f) => {
    if (validFields.includes(f)) {
      planFields += f.concat(' ');
    }
  });
  return (planFields.toString().trim());
}

export function mongoSelectStringToProjectObject(selectString) {
  const selectFields = selectString.toString().trim().split(' ').map(item => `"${item}": 1`);
  const $project = JSON.parse(`{ ${selectFields} }`);
  return $project;
}


/**
 * @fileOverview Mongoose Filter and Pagination
 * @function mongooseFilterPagination
 * @param {Object} config - configuration
 * @param {String} config.fields - fields to return.
 * Use "*" to select all fields or "field1, field2" to select specific fields
 * @param {Number} config.limit - qty of items to return
 * @param {Number} config.skip - index of the first item
 * @param {String} config.filter - search filter. Use field1:value1,field2:value2
 * @param {String} config.order - ordering method: "asc" or "desc"
 * @param {String} config.orderby - field to be ordered by
 * @param {Object} config.allowedFields - allowed fields
 * to return: fieldName and field match function
 * @param {Object} config.allowedFields.key - allowed fields name
 * @param {Object} config.allowedFields.value - allowed fields match function
 * @param {Object} config.mongooseModel - mongoose model
 * @param {Object} config.accessCondition - mongoose restriction query
 * @returns {Object} { total, limit, offset, data }
 * @example
 * const testList = await mongooseFilterPagination({
 *     fields: '*',
 *     limit: 5,
 *     skip: 0,
 *     filter: '',
 *     order: 'asc',
 *     orderby: '',
 *     validFields: {
 *         campo1: val => new RegExp(val, 'y'),
            campo2: val => new RegExp(val, 'y'),
 *         campo3: val => new RegExp(val, 'y'),
 *         campo4: val => new RegExp(val, 'y'),
 *         value: val => val,
 *     },
 *     mongooseModel: modelTest,
 *     accessCondition: { author: '123' }
 * });
 */
export default async function mongooseFilterPagination(config) {
  const {
    fields = '*',
    limit = 50,
    skip = 0,
    filter = '',
    order = 'asc',
    orderby = '',
    allowedFields = {
      nome: val => new RegExp(val, 'y'),
    },
    mongooseModel,
    accessCondition = {},
    unwind = null,
    aggregate = [],
  } = config;
  const allowedFieldsString = Object.keys(allowedFields).join(' ');
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
    Object.keys(allowedFields).forEach((field) => {
      mongoQuery.$or.push({
        [field]: allowedFields[field](filter),
      });
    });
  } else if (!emptySearch) {
    arrayFilter.forEach(async (filterItem) => {
      const keyValue = filterItem.split(':');
      const [key, ...arrValue] = keyValue;
      const value = arrValue.join(':');

      if (allowedFields[key]) {
        mongoQuery[key] = allowedFields[key](value);
      }
    });
  }

  const mongooseRestrictQuery = {
    ...mongoQuery,
    ...accessCondition,
  };

  const selectFields = (fields === '*' || !fields) ? allowedFieldsString : processFields(fields, Object.keys(allowedFields));
  const sort = [];
  if (orderby !== '') {
    sort.push({
      $sort: {
        [orderby]: sortDirection,
      },
    });
  }

  let total = await mongooseModel.aggregate([{
    $match: mongooseRestrictQuery,
  }]);
  total = total.length;

  const $project = mongoSelectStringToProjectObject(selectFields);

  let unwinds = [];
  if (unwind) {
    const unwindList = Array.isArray(unwind) ? unwind : unwind.trim().split(' ');
    unwinds = unwindList.map(uwnd => (typeof uwnd === 'string' ? {
      $unwind: {
        path: uwnd,
        preserveNullAndEmptyArrays: true,
      },
    } : {
      $unwind: uwnd,
    }));
  }

  const data = await mongooseModel.aggregate([
    {
      $match: mongooseRestrictQuery,
    },
    ...aggregate,
    {
      $project,
    },
    ...sort,
    ...unwinds,
    {
      $skip: Number(startAt),
    },
    {
      $limit: Number(finishAt),
    },
  ]);

  return {
    total,
    limit: Number(finishAt),
    offset: Number(startAt),
    data,
  };
}
