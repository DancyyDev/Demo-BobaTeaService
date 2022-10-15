// const { keys } = require('lodash');
const { session } = require('passport');

module.exports = function(app, passport, db, stripe) {
  const {ObjectId} = require('mongodb')
  
  require('dotenv').config()

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });


  app.get('/rewards', function(req, res) {
    res.render('rewards.ejs', { message: req.flash('loginMessage') });
});

    // Menu SECTION =========================
    
    app.get('/userMenu', isLoggedIn, function(req, res) {
      db.collection('bobaDB').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('userMenu.ejs', { 
          user: result, 
          bobaDB: result})
      })  
    });
    
    app.get('/checkout', isLoggedIn, function(req, res) {
      // let user = req.user._id
      // console.log(user)
      db.collection('bobaDB').find({
        status: "Pending"
      }).toArray((err, result) => {

        let total = 0
        for(let i=0; i < result.length; i++){
          total += parseFloat(result[i].price)
        }
        let sumTotal = {priceTotal: total}
        if (err){
          return console.log(err)
        } else {
        db.collection('bobaDBaddress').find({
          user: req.user._id
        })
        .toArray((err, address) => {
          if(err) return console.log(err)
          res.render('checkout.ejs', 
        {  
          user: req.user,
          bobaDB: result,
          bobaDBaddress: address,
          stripePublishableKey: process.env.STRIPE_PUBLIC_KEY,
          sumTotal
        })
        })
        }  
      })
    })

    app.get('/purchaseComplete', isLoggedIn, function(req, res) {
      db.collection('bobaDB').find({ userId: ObjectId(req.user._id) }).toArray((err, result) => {
        if (err) {
          return console.log(err)
        } else {
          db.collection('bobaDBaddress').find({
            user: req.user._id
          }).toArray((err, address) => {
            if(err) return console.log(err)
              res.render('purchaseComplete.ejs', { 
                bobaDB: result,
                bobaDBaddress: address,
                user: req.user
              })
          })
        } 
      })  
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
//////////////////////////////////////////////////////////
// create, updating and deleting orders /////////////////
/////////////////////////////////////////////////////////

    app.post('/addToOrder', isLoggedIn, (req, res) => {
      let user = req.user._id
      console.log(user)
      db.collection('bobaDB').insertOne(
      {
        userId: user,
        size: req.body.size.split(' ')[0],
        drink: req.body.drink,
        toppings: req.body.toppings,
        sugar: req.body.sugar,
        ice: req.body.ice,
        price: req.body.size.split(' ')[1],
        status: 'Pending'
      }, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/userMenu')
      })
    })

    // Updates the order when u finish buying drink and sends the order to the shop as status in progress

    app.put('/changeStatus', isLoggedIn, (req, res) => {
      db.collection('bobaDB').updateMany(
        {
          userId: ObjectId(req.user._id)
        },
         {$set: {
            status: req.body.status// status: 'Pending', 'In Progress', 'Complete'
          }
        }, {
          sort: {_id: -1},
          upsert: true
        }, (err, result) => {
        if (err) return console.log(err)
        console.log('Updated Status, order in progress')
      })
    })

    //deletes order on the menu page

    app.delete('/deleteOrderItem', (req, res) => {
      db.collection('bobaDB').findOneAndDelete(
        {
          _id: ObjectId(req.body._id)
        }, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

    app.delete('/deleteAll', (req, res) => {
      db.collection('bobaDB').deleteMany(
        {
          _id: ObjectId(req.body._id)
        }, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
        res.redirect('/userMenu.ejs')
      })
    })

// /////////////////////////////
// Purchasing route/////////////
// /////////////////////////////

app.post('/address', isLoggedIn, (req, res) => {
  let user = req.user._id
  db.collection('bobaDBaddress').insertOne(
    {
      user: user,
      address1: req.body.address1,
      address2: req.body.address2,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      default: true
    }, (err,result) => {
      if(err) console.log(err)
      console.log('Saved Address')
      res.redirect('/checkout')
    })
})

const calculateOrderAmount = (total) => {
  console.log('177', total)
  let price = total
  console.log(price.total)
  return price.total;
};


app.post("/create-payment-intent", isLoggedIn, async (req, res) => {
  
  const total = req.body;
console.log('205', total)
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(total),
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

// /////////////////////////
// Updating Rewards ////////
// /////////////////////////

app.put('/updateRewards', isLoggedIn, (req,res) => {
    db.collection('users').findOneAndUpdate({
      _id: ObjectId(req.user._id)
    },
    {$set:{
      'local.rewardPoints' : req.body.rewardPoints + 1
    }},
    {
      sort: {_id: -1},
      upsert: false
    }, (err, result) => {
      console.log(result)
    if (err) return console.log(err)
    console.log('update to database')
  })
})

// /////////////////////////////
//   Logged in with account   //
// /////////////////////////////

app.get('/userProfile', isLoggedIn, function(req, res) {
  db.collection('rewardsPass').find().toArray((err, result) => {
    if (err) return console.log(err)
    res.render('profile.ejs', {
      user: req.user,
      rewardPass: result
    });
  })
});

// //////////////
// Employees Only
// /////////////

app.get('/employee', function(req, res) {
    if (err) return console.log(err)
    res.render('bobaFriends.ejs');
  })

  // //////////////////////////
  // Employee Login and SignUp
  // //////////////////////////
app.post('/loginEmployee', passport.authenticate('local-login', {
    successRedirect : '/bobaScreen',
    failureRedirect : '/',
    failureFlash : true
}));

app.post('/signupEmployee', passport.authenticate('local-signup', {
  successRedirect : '/userProfile', // redirect to the secure profile section
  failureRedirect : '/signup', // redirect back to the signup page if there is an error
  failureFlash : true // allow flash messages
}));

// ////////////////////
// Eployee Screen
// ////////////////////

app.get('/bobaScreen', isLoggedIn, function(req, res) {
  db.collection('bobaDB').find().toArray((err, result) => {
    if (err) return console.log(err)
    res.render('userMenu.ejs', { 
      user: result, 
      bobaDB: result})
  })
})

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/userMenu',
            failureRedirect : '/',
            failureFlash : true
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs');
        });
// , { message: req.flash('signupMessage') }
        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/userProfile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
