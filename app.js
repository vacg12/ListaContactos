const express = require('express');
const morgan = require('morgan');
const usersRouter = require('./routes/users');
const contactsRouter = require('./routes/contacts');
const validateUser = require('./middlewares/validateUser');
const app = express();

app.use(express.json());
app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true }));

app.get('/', async (request, response) => {
  return response.status(200).json({ hola: 'mundo' });
});

app.use('/api/users', usersRouter);
app.use('/api/contacts', validateUser, contactsRouter);
//aqui al poner la ruta en el medio (validateUser) hace que se valide en todo de contacts
module.exports = app;
