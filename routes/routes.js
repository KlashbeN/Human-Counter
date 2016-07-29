'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    moment = require('moment');


var router = express.Router();


var routes = function(vision) {

    router.get('/', function(req, res) {
        vision.getImageData().then(function(images) {
            res.render('index', {
                images: images
            });
        });
    });

    router.post('/update/counter', function(req, res) { // Be sure to use the correct action
        console.log("NUMBER" + req.body.numOfCounter);
        vision.getImageData().then(function(images) {
            res.render('index', {
                images: images
            });
        });
    });

    router.post('/upload', function(req, res) {
        vision.writeData(10, 5, 6).then(function() {
            vision.getImageData().then(function(images) {
                res.render('index', {
                    images: images
                });
            });
        });
    });

    router.post('/results', function(req, res) {
        vision.viewSpecificDate(req.body.date).then(function(images) {
            res.render('results', {
                images: images,
                date: vision.formatDate(req.body.date)
            });
        });
    });

    return router;
};


module.exports = routes;
