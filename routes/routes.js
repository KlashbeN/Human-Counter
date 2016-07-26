'use strict';

var express = require('express'),
    router = express.Router();

var routes = function(vision) {

router.get('/', function(req,res) {
  vision.getImageData().then(function(images) {
    res.render('index', {
      images: images
    });
  });
});
  return router;
};

module.exports = routes;
