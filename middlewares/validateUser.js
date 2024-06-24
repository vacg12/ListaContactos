const db = require('../db');

const validateUser = (request, response, next) => {
  const userId = Number(request.query.userId);

  if (!userId) {
    //403 no tiene permiso
    console.log(1);
    return response.sendStatus(403);
  }

  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);

  if (!user) {
    console.log(2);
    return response.sendStatus(403);
  }

  //user_id es el nombre como esta en las tablas
  request.userId = user.user_id;
  return next();
};

module.exports = validateUser;
