import path from 'path';

export default function (req, res, next) {
  if (req.url.indexOf('/api') === 0 || req.url.indexOf('/public-api') === 0) {
    next();
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'), (err) => {
      if (err) {
        res.status(500).send(err);
      }
    });
  }
}
