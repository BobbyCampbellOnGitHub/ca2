const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const app = express();
 
const storage = multer.diskStorage({
    destination: (req,file, cb ) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
 
const upload = multer({ storage: storage });
 
const connection = mysql.createConnection({
 
    host: 'c237-all.mysql.database.azure.com',
    port: 3306,
    user: 'c237admin',
    password: 'c2372025!',
    database: 'c237_userdb_027_aston'
  });
 
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});
 
 
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({
    extended: false
}));
 
 
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
 
app.use(flash());
 
 
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/login');
    }
};
 
const checkAdmin = (req, res, next) => {
    if (req.session.user.role === 'admin') {
        return next();
    } else {
        req.flash('error', 'Access denied');
        res.redirect('/shop');
    }
};
 
 
const validateRegistration = (req, res, next) => {
    const { username, email, password, address, contact, role } = req.body;
 
    if (!username || !email || !password || !address || !contact || !role) {
        return res.status(400).send('All fields are required.');
    }
   
    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next();
};
 
app.get('/register', (req, res) => {
    res.render('register', { messages: req.flash('error'), formData: req.flash('formData')[0] });
});
 
app.post('/register', validateRegistration, (req, res) => {
 
    const { username, email, password, address, contact, role } = req.body;
 
    const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)';
    connection.query(sql, [username, email, password, address, contact, role], (err, result) => {
        if (err) {
            throw err;
        }
        console.log(result);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
});
 
app.get('/login', (req, res) => {
    res.render('login', { messages: req.flash('success'), errors: req.flash('error') });
});
 
 
app.post('/login', (req, res) => {
    const { email, password } = req.body;
 
    if (!email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/login');
    }
 
    const sql = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)';
    connection.query(sql, [email, password], (err, results) => {
        if (err) {
            throw err;
        }
 
        if (results.length > 0) {
            // Successful login
            req.session.user = results[0];
            req.flash('success', 'Login successful!');
            if(req.session.user.role == 'user')
                res.redirect('/shop');
            else
                res.redirect('/inventory');
        } else {
            // Invalid credentials
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    });
});
 
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});
 
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 

