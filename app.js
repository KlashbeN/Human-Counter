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
var promise = require('promise');
var app = express();
var router = express.Router();
var vision = require('./routes/vision.js');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine' , 'ejs');

app.get('/' , function(req, res) {
	vision.getImageData().then(function(images) {
		console.log(images.length + "PLEASE");
	res.render('index' , {
		images: images
	});
});
});

/*
app.get('/', function(req,res) {
	res.render('index');
}); */


// Basic 404 handler
app.use(function (req, res) {
  res.status(404).send('Not Found');
});

// Start the server
var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
