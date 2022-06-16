// server.js

// set up ======================================================================
// get all the tools we need
require("dotenv").config({path:'./config/.env'})

const express  = require('express');
const app      = express();
const port     = process.env.PORT || 8080;
const MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose');
const passport = require('passport');
const flash    = require('connect-flash');

// const key = require('./config/apiKeys.js')
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');
const session      = require('express-session');

const configDB = require('./config/database.js');



let db

// configuration ===============================================================
mongoose.connect(configDB.url, (err, database) => {
  if (err) return console.log(err)
  db = database
  require('./app/routes.js')(app, passport, db, stripe);
}); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))
app.use(express.json());


app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: 'rcbootcamp2021b', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


// ///////////////////
// Stripe Api
// ///////////////////



// launch ======================================================================
app.listen(port);
console.log('Boba tea is served at ' + port);