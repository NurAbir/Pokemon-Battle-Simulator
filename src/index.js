const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { error } = require('console');
const e = require('express');

const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
    res.render('login', { title: 'login', error: null, email: null });
});

app.get("/signup", (req, res) => {
    res.render('signup', { title: 'signup' });
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
})