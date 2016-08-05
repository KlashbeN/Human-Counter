// Copyright 2015-2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START app]

'use strict';

var express = require('express');
var path = require('path');
var app = express();
var router = express.Router();
var vision = require('./routes/vision.js');
var util = require('util');
var bodyParser = require('body-parser');
var passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth2').Strategy;

var cookieParser = require('cookie-parser'),
    session = require('express-session'),
    RedisStore = require('connect-redis')(session);

var config = require('./config');
var GOOGLE_CLIENT_ID = config.oauth2.clientId,
    GOOGLE_CLIENT_SECRET = config.oauth2.clientSecret;

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:8080/auth/google/callback",
        passReqToCallback: true
    },
    function(request, accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
            return done(null, profile);
          });
        }
));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'hahahah-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge:86400000 }

}));

app.use(passport.initialize());
app.use(passport.session());
/*
app.use(session({
  secret: config.secret,
  signed: true
}));


var oauth2 = require('./routes/oauth2')(config.oauth2);
app.use(oauth2.router);
app.use(oauth2.aware);
app.use(oauth2.template);

*/
// Configure routes

app.use('/', require('./routes/routes')(
    vision
));

app.get('/login', function(req, res) {
    res.render('login', {
        user: req.user
    });
});

app.get('/auth/google', passport.authenticate('google', {
    scope: [
      'openid email profile https://www.googleapis.com/auth/cloud-platform'
    ]
}));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/login'
    }));

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/account', ensureAuthenticated, function(req,res){
  res.render('account', { user: req.user});
});

// Basic 404 handler
app.use(function(req, res) {
    res.status(404).send('Not Found');
});

// Start the server
var server = app.listen(process.env.PORT || '8080', function() {
    console.log('App listening on port %s', server.address().port);
    console.log('Press Ctrl+C to quit.');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
