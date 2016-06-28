'use strict';
// Firebase,gcloud,graphicsmagick,fs services

var firebase = require("firebase"),
	fs = require('fs'),
	gm = require('gm'),
	moment = require('moment');

var gcloud = require('gcloud') ({
	projectId: 'vision-recognition-1338',
	keyFilename: 'keyfile.json'
});


var vision = gcloud.vision();

// Initialize the app with a service account, granting admin privileges
/*firebase.initializeApp({
  databaseURL: 'https://vision-recognition-1338.firebaseio.com/',
  serviceAccount: 'serviceAccountCredentials.json'
}); */

firebase.initializeApp({
	serviceAccount: { 
		projectId: 'vision-recognition-1338',
		privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCN/Z+/GVV6RvdC\nB9/pCcqJvc6U4w89mbdIFcJ+L9oOhwm0M0R2CzshrVu9+ox0UKiZY9Ph4X2snUIU\n+EPg7Dm86kxDwoe0JrpFTxdLgnuXsOwokiJWx8CFAl+ma0AtrzJdmHlTTnKJnLMB\n9Y4BEKi7PiUDFGFrnajVK5KvFzd/wgfzt+YExr4VUahscuT7s9Rk86b0CpVyKTmF\nByrq9zE9v2U4LN5Thmi/2roGuPgiLJLPbR480EuW2wOn0gXZzELZlW9FS7HBQqE2\nt4El/F6/NUZcKl9THuEcFgiQOMn0PAxSHXlHbBk1iMc+w2mYe6E8g0BrZ+bSCVXG\ng5uSiaIZAgMBAAECggEAP68rgPiJ4AgISjNh+BGOJ+1bxGd6pHRXQhuQWix4Lt/e\nOFZuNEuhP9+TMEg5ysmKdRHTLJKIXW1DAEjBmRYaZ2LmxdVwLBranM92cUWazVRq\n919jy2xYKs//upKL/HGBs3z5naWntZT0rMJH6K5iH2kmDJWNhEj4OnQKnEFbgQ8I\nffEnRwwd60xTwXiieLz5n+qC5iMnMKrLRauQfxIiqmDD8i9pJJ3c96/LtsibxbNq\n9ZYhnii1SMNnmcLTL47ppu/tWHrzRlil33DIMWFO8zN4WqZo3EGIHs78B5rW/9J+\nPuzVWZKjf2URBUW9tQPm9jngAdnOGe2eEKtnE8IxAQKBgQDGStL/+T2WdNi0jew0\n8CmnVaDgWhi/9Cos4DYRmgvlBMuDiAzQPEVaLg0452Qw/dseDtiF6ngQ9EVnitm5\n2K5L2qAya/y9CY6HS1mzv0AVgTEJ0pqLsBV3LhJi6hAjYSuyxOov/rD+rAY77xSr\n45I9XAUDMbo5L4c2ABzaN6bbCQKBgQC3UDgzZiJ/wJKZ1aySzgouevxs0hWHxbVe\nnIA5JtAlAkfn3QA8vMYIlNyciLpSskTN8Zqlavi6Z5CAxfplcxFyokcVuSsuL/qk\n9Aj+qNNhU9+FqMTnu2bg19A82qaQXC66JG+arWSBwk6L2SkLnPbxI9ffckXYzNrs\nfgyrPaWCkQKBgB8HMFMrng6ABDTkjFSQTARKKt1QW9UVkM/q2asRbtEMWggf7tla\nxQNid2EzHANqhbIDYrA5y0Xj40RbfsxM8qEd+blKGoc+CpZzHPs6bv2udIzz7ojz\nKbi3ddsSgyn2F49mrrqJ4QpIwsT4GUT4XDbLwmEIk/pEzKSPifQ/hxV5AoGAaBAu\nF1+frg5QKuxV73Dv7rr6mXwZpN3jvDXzxH34I0pML6ASBmjTswNuyZ4Ex/VTgeXp\n+IXldUxdh/zbzMOp3/2nhPl9PdcW3pV6lbaZaOMIPQQ146dLG9Dn8ePeMo1iKWGN\nya0tJUx88n7xAhq1ROcoITzp0c1Zam+UGZIBZ0ECgYAmBxMaesHsyKqBikp0oKA4\noSwvO/rh3uryZ4zKQ3wzUIQokJAfOKbK6FXyDREyYzlqPy1zCUSyf1R48JEq1e3/\nICyZG4iGY2BeTGjzYuW/bkuVM0xI3rleJTpib/zbIstEqE0Ay6dyZFqd/JZSssm7\nSEQMN2x+8IsmhtBNaUfOFQ==\n-----END PRIVATE KEY-----\n',
		clientEmail: 'vision-firebase@vision-recognition-1338.iam.gserviceaccount.com'
	},
	databaseURL: 'https://vision-recognition-1338.firebaseio.com/'
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = firebase.database();

var fbAuth = firebase.auth(),
	dbRef = db.ref('imageDatas'),
	image = 'demo.jpg';

var numOfPeople = 0;

//-------------------------Firebase Functions----------------------------//

//Write image data
function writeImageData(numOfPeople,imageName, imageData, imageURL) {

	var imageData = { 
		numOfPeople: numOfPeople,
		imageName: imageName,
		imageData: imageData,
		imageURL: imageURL
		};

	//Update the database with the image data
	var updates = {};
	updates[getDay() + '/' + getTime()] = imageData; // Creates new branch called imageDatas

	return dbRef.update(updates);
}
//Test 

function writeData(info1, info2, info3) { 
	var data = { 
		info1: info1,
		info2: info2,
		info3: info3
		};
	var newDataKey = dbRef.child('imageDatas').push().key;

	var updates = {};
	//updates[newDataKey] = data; // Creates new branch only with the newDataKey
	updates[getDay() + ' ' + getDate() + '/' + getTime()] = data;
	return dbRef.update(updates);
}

//Test
function readData() {
	dbRef.on("value", function(snapshot) {
		console.log(snapshot.val());
	}, function(errorObject) {
		console.log("Read failed:" + errorObject.code);
	});
}

function getImageData() {
	dbRef.on();
}
	

function retrieveImage() {

}

//-------------------------Google Vision Functions----------------------------//


function countPeople(image,callback) {
	vision.detectFaces(image, function(error,faces) {
		if(error) throw error;
		callback(faces);
	});
}


//---------------------------Miscelleneous------------------------------//

// -------- Moment Functions ---------- //
function getDate() {
	return moment().format('LL');
}

function getDay() {
	return moment().format('dddd');
}

function getTime() {
	return moment().format("HH:mm");
}

function getNumberOfPeople() {
	return numOfPeople;
}


function getImageMetadata(image) {

}

function imageResize(image) { 
	gm(image).resizeExact(640,480).write(image , function(err) {
		if(!err) console.log('done resizing');
	});
return image;
}

function main(image) {
	countPeople(image, function(faces){
		console.log('Found' + faces.length + 'face');
		numOfPeople = faces.length;
	}); 
	writeData('hello','world','numOfPeople');
	readData();
	console.log('done');
}

exports.main = main;

if(module == require.main) {
	exports.main(image);
}