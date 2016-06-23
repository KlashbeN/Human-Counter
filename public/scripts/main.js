'use strict';
// Firebase and gcloud services
var firebase = require("firebase"); 
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
	fbStorage = firebase.storage(),
	fbStorageRef = storage.ref();


