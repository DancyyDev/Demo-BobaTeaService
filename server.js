// server.js

// set up ======================================================================
// get all the tools we need
require("dotenv").config({path:'./config/.env'})

const express  = require('express');
const app      = express();
const port     = process.env.PORT || 8080;
// const MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose');
const passport = require('passport');
const flash    = require('connect-flash');

const keys = require('./config/apiKeys')
// const Stripe = require('stripe');
const stripe = require('stripe')(keys.stripeSecretKey);

// const stripe = {
//   stripePublishableKey: process.env.STRIPE_PUBLIC_KEY,
//   stripeSecretKey: process.env.STRIPE_SECRET_KEY
// }

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');
const session      = require('cookie-session');

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


// launch ======================================================================
app.listen(port);
console.log('Boba tea is served at ' + port);
