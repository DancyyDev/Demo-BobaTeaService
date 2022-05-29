module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs', { message: req.flash('loginMessage') });
    });

    app.get('/profile', function(req, res) {
      db.collection('rewardsPass').find().toArray((err, complete) => {
        if (err) return console.log(err)
        res.render('profile.ejs', {
          user: req.user,
          rewardPass: complete
        });
      })
  });

  app.get('/rewards', function(req, res) {
    res.render('rewards.ejs', { message: req.flash('loginMessage') });
});

    // Menu SECTION =========================
    app.get('/menu', function(req, res) {
        // db.collection('previousOrders').find().toArray((err, result) => {
        //   if (err) return console.log(err)
        //   res.render('menu.ejs', {
        //     user : req.user,
        //     previousOrders: result
        //   })
        // })
        res.render('menu.ejs')
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// create and deleting orders  ===============================================================
    app.post('/addToOrder', isLoggedIn, (rqe, res) => {
      db.collection('newOrders').insert({
        order: req.body
      }, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/menu', {order: result})
      })
    })

    app.delete('/addToOrder', (req, res) => {
      db.collection('newOrders').findOneAndDelete(
        {
          name: req.body.name, 
          newOrder: req.body.order
        }, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================

        // process the login form
        app.post('/logIn', passport.authenticate('local-login', {
            successRedirect : '/menu', // redirect to the secure profile section
            failureRedirect : '/', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs');
        });
// , { message: req.flash('signupMessage') }
        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
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
