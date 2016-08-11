'use strict';

var express = require('express'),
    moment = require('moment'),
    multer = require('multer'),
    path = require('path');


var options = multer.diskStorage({
  destination: 'uploads/',
  filename: function(req,file,cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

var storage = multer.memoryStorage();

var uploadImg = multer({storage: storage})

var router = express.Router();


var routes = function(vision) {

    router.get('/', function(req, res) {
        vision.getImageData().then(function(images) {
            res.render('index', {
                images: images,
                user: req.user,
                date: ""
            });
        });
    });

    router.post('/update/counter', function(req, res) { // Be sure to use the correct action
        console.log("NUMBER" + req.body.numOfCounter);
        vision.updateCounters(req.body.numOfCounter).then(function() {
        vision.getImageData().then(function(images) {
            res.render('index', {
                images: images,
                user: req.user
            });
          });
        });
    });

    router.post('/upload', uploadImg.single('img'),vision.uploadToBucket,function(req, res) {
          return vision.visionProcess(req.file).then(function(images) {
                res.render('result', {
                    images: images,
                    user: req.user
                });
            });
    });

    router.post('/results', function(req, res) {
        vision.viewSpecificDate(req.body.date).then(function(images) {
            res.render('results', {
                images: images,
                date: vision.formatDate(req.body.date),
                user: req.user
            });
        });
    });

    return router;
};


module.exports = routes;
