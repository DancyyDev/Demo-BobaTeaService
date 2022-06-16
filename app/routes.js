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
        res.render('userMenu.ejs', { user: result, bobaDB: result})
      })  
    });
    
    app.get('/purchasePage', isLoggedIn, function(req, res) {
      let user = req.user._id
      console.log(user)
      db.collection('bobaDB').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('purchase.ejs', 
        {  
          user: user,
          bobaDB: result
        })
      })
    })

    app.get('/purchaseCCard', isLoggedIn, function(req, res) {
      let user = req.user
      console.log(user)
      db.collection('bobaDB').find().toArray((err, drinks) => {
        let total = 0
        for(let i=0; i < drinks.length; i++){
          console.log(drinks[i].price)
          total += parseFloat(drinks[i].price)
        }
        let sumTotal = {priceTotal: total}
        if (err) {
          return console.log(err)
        } else {
          db.collection('bobaDBaddress').find().toArray((err, delivery) => {
            if (err) {
              return console.log(err)
            } else { 
              res.render('purchaseCCard.ejs', { bobaDB: drinks, bobaDBaddress: delivery, sumTotal})
            }
               
            }) 
        }
      })
    })

    app.get('/purchaseComplete', isLoggedIn, function(req, res) {
      db.collection('bobaDB').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('purchaseComplete.ejs', { bobaDB: result})
      })  
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// create, updating and deleting orders  ===============================================================
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
    app.post('/addToOrderProgress', isLoggedIn, (req, res) => {
      db.collection('bobaDB').updateMany(
      {
        userId: req.user._id, 
      },
       {$set: {
          status: 'In Progress'// status: 'Pending', 'In Progress', 'Complete'
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/userMenu')
      })
    })

    // updates when the order is complete and sends message back to customer that order is complete
    app.post('/addToOrderComplete', isLoggedIn, (req, res) => {
      db.collection('bobaDB').updateMany(
        {
          userId: req.local.user, 
        },
         {$set: {
            status: 'Complete'// status: 'Pending', 'In Progress', 'Complete'
          }
        }, {
          sort: {_id: -1},
          upsert: true
        }, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/userMenu')
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

// /////////////////////////////
// Purchasing route/////////////
// /////////////////////////////

app.post('/address', (req, res) => {
  let user = req.user._id
  db.collection('bobaDBaddress').insertOne(
    {
      userId: user,
      address1: req.body.address1,
      address2: req.body.address2,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip
    }, (err,result) => {
      if(err) console.log(err)
      res.render('purchaseCCard.ejs')
    })
})




app.post("/create-payment-intent", async (req, res) => {
//   const calculateOrderAmount = (items) => {
//   // Replace this constant with a calculation of the order's amount
//   // Calculate the order total on the server to prevent
//   // people from directly manipulating the amount on the client
//   return req.body.orderPrice;
// };
// const { items } = req.body;
// console.log(req.body.orderPrice)
  // Create a PaymentIntent with the order amount and currency
  console.log('amount', req.body.orderPrice)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1100,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});


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