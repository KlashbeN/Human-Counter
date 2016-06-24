'use strict';
// Firebase,gcloud,graphicsmagick,fs services

var firebase = require("firebase"),
	fs = require('fs'),
	gm = require('gm');

var gcloud = require('gcloud') ({
	projectId: 'vision-recognition-1338',
	keyFilename: 'keyfile.json'
});


var vision = gcloud.vision();

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
  databaseURL: "https://vision-recognition-1338.firebaseio.com/",
  serviceAccount: "serviceAccountCredentials.json"
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = firebase.database();
var ref = db.ref("restricted_access/secret_document");
ref.once("value", function(snapshot) {
  console.log(snapshot.val());
});

var fbAuth = firebase.auth(),
	fbDatabaseRef = db.ref(),
	image = 'demo.jpg';


function main(image) {
	countPeople(image, function(faces){
		console.log('Found' + faces.length + 'face');
	});
}

//-------------------------Firebase Functions----------------------------//

//Write image data
function writeImageData(numOfPeople,imageName, imageData, imageURL) {

	var imageData = { 
		numOfPeople: numOfPeople,
		imageName: imageName,
		imageData: imageData,
		imageURL: imageURL
		};

	//New key to write into firebase database
	var newWriteKey = fbDatabaseRef.child('imageDatas').push().key;

	//Update the database with the image data
	var updates = {};
	updates['imageDatas/' + newWriteKey] = imageData;

	return fbDatabaseRef.update(updates);
}

function retrieveImage() {

}

//-------------------------Google Vision Functions----------------------------//


function countPeople(image,callback) {
	vision.detectFaces(image, function(error,faces) {
		if(error) {
			callback(error); 
		}
		callback(null,faces);
	});
}


//---------------------------Miscelleneous------------------------------//
function getImageMetadata(image) {

}

function imageResize(image) { 
	gm(image).resizeExact(640,480).write(image , function(err)) {
		if(!err) console.log('done resizing');
	}
return image;
}
exports.main = main;

if(module == require.main) {
	exports.main(image);
}

