const supertest = require('supertest');
const app = require('../app');
const { describe, test, expect, beforeAll } = require('@jest/globals');
const db = require('../db');
const api = supertest(app);
let user = undefined;

let contacts = [
  {
    name: 'Valentina Carvajal',
    phone: '0412972755',
  },
  {
    name: 'Helen Garcia',
    phone: '04145633897',
  },
  {
    name: 'Marco Perez',
    phone: '0414563388',
  },
];

let users = [
  {
    username: 'tinita12',
    password: 'Hola.123',
  },
  {
    username: 'lolo34',
    password: 'taza.123',
  },
];

describe('test users endpoint /api/contacts', () => {
  describe('post /api/contacts', () => {
    beforeAll(() => {
      //Borra todo los usuarios y contactos
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM contacts').run();
      // Crear un usuario
      user = db
        .prepare(
          `
      INSERT INTO users (username, password) VALUES (?, ?) RETURNING *
     `,
        )
        .get('tinita12', 'Secreto.123');
    });
    test('crea un nuevo contacto cuando todo esta correcto', async () => {
      //usuario antes de agg, el asterisco significa todo
      const contactsBefore = db.prepare('SELECT * FROM contacts').all;
      const newContact = {
        name: 'Valentina Carvajal',
        phone: '04127862344',
      };
      const response = await api
        .post('/api/contacts')
        .query({ userId: user.user_id })
        .send(newContact)
        .expect(201)
        .expect('Content-Type', /json/);
      const contactsAfter = db.prepare('SELECT * FROM contacts').all();
      expect(contactsAfter.length).toBe(contactsBefore.length + 1);
      expect(response.body).toStrictEqual({
        contact_id: 1,
        name: 'Valentina Carvajal',
        phone: '04127862344',
        user_id: 1,
      });
    });
    test('no crea un contacto cuando el nombre es incorrecto', async () => {
      const contactsBefore = db.prepare('SELECT * FROM contacts').all();
      const newContact = {
        name: 'Valentina',
        phone: '04127862344',
      };
      const response = await api
        .post('/api/contacts')
        .query({ userId: user.user_id })
        .send(newContact)
        .expect(400)
        .expect('Content-Type', /json/);
      const contactsAfter = db.prepare('SELECT * FROM contacts').all();
      expect(contactsAfter.length).toBe(contactsBefore.length);
      expect(response.body).toStrictEqual({
        error: 'El nombre es invalido',
      });
    });
    test('no crea un contacto cuando el numero es incorrecto', async () => {
      const contactsBefore = db.prepare('SELECT * FROM contacts').all();
      const newContact = {
        name: 'Valentina Carvajal',
        phone: '0412342',
      };
      const response = await api
        .post('/api/contacts')
        .query({ userId: user.user_id })
        .send(newContact)
        .expect(400)
        .expect('Content-Type', /json/);
      const contactsAfter = db.prepare('SELECT * FROM contacts').all();
      expect(contactsAfter.length).toBe(contactsBefore.length);
      expect(response.body).toStrictEqual({
        error: 'El numero de telefono es invalido',
      });
    });
    test('no crea un contacto cuando el usuario no existe', async () => {
      const contactsBefore = db.prepare('SELECT * FROM contacts').all();
      const newContact = {
        name: 'Valentina',
        phone: '04127862344',
      };
      await api.post('/api/contacts').query({ userId: null }).send(newContact).expect(403);
      const contactsAfter = db.prepare('SELECT * FROM contacts').all();
      expect(contactsAfter.length).toBe(contactsBefore.length);
    });
  });
  describe('put /api/contacts', () => {
    beforeAll(() => {
      //Borra todo los usuarios y contactos
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM contacts').run();
      // Crear un usuario
      users = users.map((user) => {
        return db
          .prepare(
            `
      INSERT INTO users (username, password)
      VALUES (?, ?)
      RETURNING *
    `,
          )
          .get(user.username, user.password);
      });
      // Crear un contacto
      contacts = contacts.map((contact) => {
        return db
          .prepare(
            `
      INSERT INTO contacts (name, phone, user_id) VALUES (?, ?, ?) RETURNING *
     `,
          )
          .get(contact.name, contact.phone, users[0].user_id);
      });
    });
    test('actualiza un contacto cuando todo esta correcto', async () => {
      //parametros modificados
      const updatedParams = {
        name: 'Marco Perez',
        phone: '04146542907',
      };
      const response = await api
        .put(`/api/contacts/${contacts[0].contact_id}`)
        .query({ userId: user.user_id })
        .send(updatedParams)
        .expect(200)
        .expect('Content-type', /json/);
      //se espera que todo sea igual excepto name y user ya que se esta actualizando
      expect(response.body).toStrictEqual({
        contact_id: 1,
        name: 'Marco Perez',
        phone: '04146542907',
        user_id: 1,
      });
    });
    test('no actualiza un contacto cuando el numero es duplicado', async () => {
      const updatedParams = {
        name: 'Helen Garcia',
        phone: '04145633897',
      };
      const response = await api
        .put(`/api/contacts/${contacts[0].contact_id}`)
        .query({ userId: users[0].user_id })
        .send(updatedParams)
        .expect(409)
        .expect('Content-type', /json/);
      //se envia mensaje de error
      expect(response.body).toStrictEqual({
        error: 'Numero duplicado',
      });
    });
    test('no actualiza cuando no es el usuario (no tiene permiso)', async () => {
      const updatedParams = {
        name: 'Helen Garcia',
        phone: '02121236529',
      };
      const response = await api
        .put(`/api/contacts/${contacts[0].contact_id}`)
        .query({ userId: users[1].user_id })
        .send(updatedParams)
        .expect(403)
        .expect('Content-type', /json/);
      //se envia mensaje de error
      expect(response.body).toStrictEqual({
        error: 'No tiene los permisos',
      });
    });
  });
  describe('delete', () => {
    beforeAll(() => {
      //Borra todo los usuarios y contactos
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM contacts').run();
      // Crear un contacto
      users = users.map((user) => {
        return db
          .prepare(
            `
      INSERT INTO users (username, password)
      VALUES (?, ?)
      RETURNING *
    `,
          )
          .get(user.username, user.password);
      });
      // Crear un contacto
      contacts = contacts.map((contact) => {
        return db
          .prepare(
            `
      INSERT INTO contacts (name, phone, user_id) VALUES (?, ?, ?) RETURNING *
     `,
          )
          .get(contact.name, contact.phone, users[0].user_id);
      });
    });
    test('elimina un contacto', async () => {
      const contact = contacts[0];

      const response = await api
        .delete(`/api/contacts/${contact.contact_id}`)
        .query({ userId: users[0].user_id })
        .expect(200)
        .expect('Content-type', /json/);

      expect(response.body).toStrictEqual({
        message: 'Contacto eliminado',
      });
    });
    test('no elimina un contacto cuando el contacto no existe', async () => {
      const response = await api
        .delete(`/api/contacts/1000`)
        .query({ userId: users[0].user_id })
        .expect(400)
        .expect('Content-type', /json/);

      expect(response.body).toStrictEqual({
        error: 'El contacto no existe',
      });
    });
    test('no elimina un contacto cuando no es del usuario', async () => {
      const response = await api
        .delete(`/api/contacts/${contacts[1].contact_id}`)
        .query({ userId: users[1].user_id })
        .expect(400)
        .expect('Content-type', /json/);

      expect(response.body).toStrictEqual({
        error: 'El contacto no existe',
      });
    });
  });
});
