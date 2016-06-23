'use strict';
// Firebase,gcloud,exiftool,filesystem services
var firebase = require("firebase"); 
var exif = require('exiftool');
var fs = require('fs');
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
	fbDatabase = firebase.database(),
	fbDatabaseRef = fbDatabase.ref(),
	fbStorage = firebase.storage(),
	fbStorageRef = storage.ref();

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

//-------------------------Google Vision Functions----------------------------//
function countPeople(image) {

}

//---------------------------Miscelleneous------------------------------//
function getImageMetadata(image) {

}




