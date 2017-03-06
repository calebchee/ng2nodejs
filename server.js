// =======================
// get the packages we need ============
// =======================
var cors = require('cors');
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
    
// =======================
// configuration =========
// =======================
app.use(cors());

var port = process.env.PORT || 3000; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database

app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
app.get('/setup', function(req, res) {

  // create a sample user
  var nick = new User({ 
    username: 'tester', 
    password: 'password',
    firstname: 'John',
    lastname: 'Smith',
    location: 'Melbourne',
    admin: true 
  });

  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
  
});


// =======================
// basic route
app.get('/', function(req, res) {
    res.send('Wrong Way. Go Home.');
});

// API ROUTES -------------------

// get an instance of the router for api routes
var apiRoutes = express.Router(); 

// TODO: route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) throw err;

    if(user === undefined || user === null){
      res.json({ success: false, message: 'Body Empty' });
    } else if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = 'Bearer' + ' ' + jwt.sign(user, app.get('superSecret'), {
          expiresIn : 86400 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          username: user.username,
          token: token
        });
      }   

    }

  });
});

// TODO: route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.get('Authorization');
    console.log(token)

  // decode token
  if (token) {
    token = token.substring(7);
    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});


// TODO: route to delete a user by name (POST http://localhost:8080/api/update)
apiRoutes.post('/update', function(req, res) {
    User.findOneAndUpdate({ 
        username: req.body.username 
    }, { 
        firstname: req.body.firstname,
        fastname: req.body.lastname 
    }, function(err, user) {
      if (err) throw err;
      // we have the updated user returned to us
      console.log(user);
      res.json({ success: true });
    });
});

// TODO: route to delete a user by name (POST http://localhost:8080/api/delete)
apiRoutes.post('/delete', function(req, res) {
    User.findOneAndRemove({ 
        username: req.body.username 
    }, function(err) {
        if (err) throw err;
        // we have deleted the user
        console.log('User deleted!');
        res.json({ success: true });
    }); 
});

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the coolest API on earth!' });
});

// route to return users by name (GET http://localhost:8080/api/user)
apiRoutes.post('/user', function(req, res) {
  User.find({
      username: req.body.username 
  }, function(err, user) {
      if (err) throw err;      
      console.log('User found!');
      res.json(user);
  });
});   

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});  

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);