const db = require('../db');
const NAME_REGEX = /^[A-Z][a-z]*[ ][A-Z][a-z ]*$/;
const NUMBER_REGEX = /^[0](412|212|424|426|414|416)[0-9]{7}$/;
const contactsRouter = require('express').Router();

contactsRouter.post('/', async (request, response) => {
  try {
    //1.obtener usuario y numero del body
    const { name, phone } = request.body;
    //1.1 Verificar que el nombre y telefono sean correctos
    if (!NAME_REGEX.test(name)) {
      return response.status(400).json({
        error: 'El nombre es invalido',
      });
    } else if (!NUMBER_REGEX.test(phone)) {
      return response.status(400).json({
        error: 'El numero de telefono es invalido',
      });
    }

    //2. crea el nuevo contacto (guardarlo)
    const statement = db.prepare(`
   INSERT INTO contacts (name, phone, user_id) VALUES (?, ?, ?)
   RETURNING *
  `);
    //RETURNING ES PARA DEVOLVER EL CONTACTO
    //aqui van las
    console.log(name, phone, request.userId);
    const contact = statement.get(name, phone, request.userId);

    // 4. Enviar la respuesta
    return response.status(201).json(contact);
  } catch (error) {
    console.log('ERROR', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({
        error: 'El nombre de usuario ya existe',
      });
    }
    return response.status(500).json({ error: 'Hubo un error' });
  }
});

//los dos puntos antes del id significan parametros
contactsRouter.put('/:id', async (request, response) => {
  try {
    //1.obtener usuario y numero del body
    const { name, phone } = request.body;
    //1.1 Verificar que el nombre y telefono sean correctos
    if (!NAME_REGEX.test(name)) {
      return response.status(400).json({
        error: 'El nombre es invalido',
      });
    } else if (!NUMBER_REGEX.test(phone)) {
      return response.status(400).json({
        error: 'El numero de telefono es invalido',
      });
    }

    //2. actualizar el contacto
    const statement = db.prepare(`
   UPDATE contacts
   SET
    name = ?,
    phone = ?
   WHERE contact_id = ? AND user_id = ?
   RETURNING *
  `);
    //RETURNING ES PARA DEVOLVER EL CONTACTO
    //aqui van las

    const contact = statement.get(name, phone, request.params.id, request.userId);

    //esto es para que lo valide como un error
    if (!contact) {
      return response.status(403).json({
        error: 'No tiene los permisos',
      });
    }

    // 4. Enviar la respuesta
    return response.status(200).json(contact);
  } catch (error) {
    console.log('ERROR', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({
        error: 'Numero duplicado',
      });
    }
    return response.status(500).json({ error: 'Hubo un error' });
  }
});

contactsRouter.delete('/:id', async (request, response) => {
  try {
    //2. borrar el contacto
    const statement = db.prepare(`
   DELETE FROM contacts
   WHERE contact_id = ? AND user_id = ?
  `);

    const { changes } = statement.run(request.params.id, request.userId);
    if (!changes) {
      return response.status(400).json({
        error: 'El contacto no existe',
      });
    }

    // 4. Enviar la respuesta
    // el message es de el primer test en contacts.
    return response.status(200).json({ message: 'Contacto eliminado' });
  } catch (error) {
    console.log('ERROR', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({
        error: 'Numero duplicado',
      });
    }
    return response.status(500).json({ error: 'Hubo un error' });
  }
});

module.exports = contactsRouter;
