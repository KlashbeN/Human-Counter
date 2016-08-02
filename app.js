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
var bodyParser = require('body-parser');

//var session = require('cookie-session');

var config = require('./config');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine' , 'ejs');

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



// Basic 404 handler
app.use(function (req, res) {
  res.status(404).send('Not Found');
});

// Start the server
var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
