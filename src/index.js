const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { error } = require('console');
const e = require('express');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('login', { 
    title: 'login', 
    error: null, 
    email: null 
  });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'login', error: null, email: null });
});

app.get("/signup", (req, res) => {
    res.render('signup', { 
        title: 'signup', 
        error: null, 
        username: null, 
        email: null, 
        favoritePokemon: null 
    });
});

app.post('/signup', (req, res) => {
    const { username, email, password, confirmPassword, favoritePokemon } = req.body;
    
    if (password !== confirmPassword) {
        return res.render('signup', { 
            error: 'Passwords do not match!', 
            username, 
            email, 
            favoritePokemon 
        });
    }
    
    res.redirect('/login');
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
})