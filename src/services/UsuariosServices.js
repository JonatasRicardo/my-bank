import Usuarios from '../models/Usuarios';


export function getUsuariosByProfilesArray(profiles) {
  if (!Array.isArray(profiles)) return Promise.reject(new Error(`O tipo de profiles deve ser Array ao inves disso encontramos ${typeof profiles}`));
  return Usuarios.aggregate([
    {
      $lookup: {
        from: 'profiles',
        localField: 'profiles',
        foreignField: '_id',
        as: 'profiles',
      },
    },
    {
      $unwind: '$profiles',
    },
    {
      $match: { 'profiles.name': { $in: profiles } },
    },
  ]);
}

export default {
  getUsuariosByProfilesArray,
};
