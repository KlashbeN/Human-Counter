'use strict';

// Firebase,gcloud,graphicsmagick,fs,ejs services

var firebase = require("firebase"),
    fs = require('fs'),
    gm = require('gm'),
    moment = require('moment'),
    promise = require('promise'),
    async = require('async');

var ejs = require('ejs'),
    read = fs.readFileSync,
    join = require('path').join,
    path = join(__dirname, '../', 'views', '/index.ejs');

var gcloud = require('gcloud')({
    projectId: 'vision-recognition-1338',
    keyFilename: 'keyfile.json'
});

var CLOUD_BUCKET = 'vision-recognition-1338.appspot.com';
var DBNAME = 'imageDatas/';
var DATE = 'imageDatas/' + getDayDate();

var vision = gcloud.vision(),
    gcs = gcloud.storage(),
    bucket = gcs.bucket(CLOUD_BUCKET);

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
  databaseURL: 'https://vision-recognition-1338.firebaseio.com/',
  serviceAccount: 'serviceAccountCredentials.json'
});


// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = firebase.database(),
    fbAuth = firebase.auth(),
    dbRef = db.ref(DBNAME),
    testRef = db.ref(DBNAME + "Monday July 4, 2016 " + "/09:57");

var image = 'demo.jpg',
    dates = [],
    times = [];

//-------------------------Firebase Functions----------------------------//

//Write image data
function writeImageData(numOfPeople, imageName, imageURL) {

    var imageData = {
        numOfPeople: numOfPeople,
        imageName: imageName,
        imageURL: imageURL
    };

    //Update the database with the image data
    var day = getDay(),
        date = getDate(),
        time = getTime();

    var updates = {};
    updates[dateConcat(day, date, time)] = imageData; // Creates new branch called imageDatas

    return dbRef.update(updates);
}


// TODO: Promise initDates first and initTime, next figure out how to loop through both.
// TODO: Figure out how to get the time first for each date before obtaining the data!!
// TODO: Figure out how to transfer the data out!
// TODO: Add promise to this function, maybe we  can try for loop with a function inside the for loop?
// TODO" Try promise.each
// NOTE: DONE syncing

function readAllData() {
    return new Promise(function(resolve, reject) {
        var images = [];
        async.each(dates, function(date, callback) {
            getTimeRef(date).then(function(timeRefs) {
                async.each(timeRefs, function(timeStamp, callback) {
                    var path = getPath(date, timeStamp);
                    path.then(function(res) {
                        db.ref(res).on("value", function(snapshot) {
                            console.log(timeStamp);
                            console.log(snapshot.val());
                            images.push({
                                name: snapshot.val().imageName,
                                numOfPeople: snapshot.val().numOfPeople,
                                url: snapshot.val().imageURL,
                                time: timeStamp
                            });
                            console.log(images.length);
                            callback();
                        })
                    })
                }, function(err) {
                    console.log("Finish iterating times \n");
                    callback();
                })
            })
        }, function(err) {
            console.log("Finish iterating!");
            resolve(images);
        });
    });
}


function getImages(images) {
    console.log(images.length + "LENGTH");
    images.forEach(function(image) {
        console.log(image.name + " " + image.numOfPeople);
        console.log(image.url + " " + image.time + "\n");
    });
}

function getPath(date, timeStamp) {
    return new Promise(function(resolve, reject) {
        resolve(DBNAME + date + "/" + timeStamp);
    });
}

function readData(path) {
    db.ref(path).on("value", function(snapshot) {
        console.log(snapshot.val());
    }, function(errorObject) {
        console.log("Read failed:" + errorObject.code);
    });
}


function displayAllData() {
    testRef.on("value", function(snapshot) {
        console.log(snapshot.val());
    });
}

function readData() {
    timeRef.on("value", function(snapshot) {
        console.log(snapshot.val());
    }, function(errorObject) {
        console.log("Read failed:" + errorObject.code);
        // Now we have both childs, try iterating through and getting only the key for each of them.
    });
}

function uploadImage(image) {
    bucket.upload(image, function(err, file) {
        if (!err) {
            console.log('successful upload')
        }
    });
}

function retrieveImage() {
    bucket.file(image).download({
        destination: 'test1.jpg'
    }, function(err) {});
}

function getPublicUrl(image) {
    return 'https://storage.googleapis.com/' + CLOUD_BUCKET + '/' + image;
}

//-------------------------Google Vision Functions----------------------------//


function countPeople(image, callback) {
    vision.detectFaces(image, function(error, faces) {
        if (error) throw error;
        callback(faces);
    });
}


//---------------------------Miscelleneous------------------------------//


// TODO: Figure out how to utilize all of the timing of all dates

function getTimeRef(date) {
    return new Promise(function(resolve, reject) {
        var timeRefs = [];
        var ref = db.ref('imageDatas' + "/" + date);
        ref.on("value", function(snapshot) {
            var timeStamps = snapshot.val();
            for (var timeStamp in timeStamps) {
                timeRefs.push(timeStamp);
            }
            resolve(timeRefs);
        });
    });
}


// TODO: Utilize this to get all of the data

function initDates() {
    return new Promise(function(resolve, reject) {
        dbRef.on("value", function(snapshot) {
            var info = snapshot.val();
            for (var key in info) {
                dates.push(key);
            }
            resolve();
        });
    });
}
// -------- Moment Functions ---------- //
function getDayDate() {
    return getDay() + ' ' + getDate();
}

function getDate() {
    return moment().format('LL');
}

function getDay() {
    return moment().format('dddd');
}

function getTime() {
    return moment().format("HH:mm");
}

function dateConcat(day, date, time) {
    return day + ' ' + date + ' /' + time;
}
//---------------------------------//
function getNumberOfPeople() {
    return numOfPeople;
}


function getImageMetadata(image) {

}

function imageResize(image) {
    gm(image).resizeExact(640, 480).write(image, function(err) {
        if (!err) console.log('done resizing');
    });
    return image;
}

function main(image) {
    /*countPeople(image, function(faces){
    	var numOfPeople = faces.length;
    	console.log('Found ' + numOfPeople + ' face');
    	writeImageDat
    	a(numOfPeople,image,getPublicUrl(image));
    }); */
    //writeImageData(10,'demo.jpg', getPublicUrl(image));
    //uploadImage(image);
    console.log("hi");
    initDates().then(function() {
        return readAllData()
    }).then(function(res) {
        getImages(res)
    });
}

exports.main = main;

module.exports = {
    getUsers: function() {
        var users = [{
            name: 'Tobi',
            age: 2,
            species: 'ferret'
        }, {
            name: 'Loki',
            age: 2,
            species: 'ferret'
        }, {
            name: 'Jane',
            age: 6,
            species: 'ferret'
        }];

        return users;
    },
    getImage: function() {
        var info = readAllData()
        info.then(function(res) {
            getImages(res)
        });
        this.data = function() {
            return images
        };
    },
    getImageData: function() {
        return new Promise(function(resolve) {
            initDates().then(function() {
                return readAllData()
            }).then(function(images) {
                resolve(images)
            })
        })
    }
}


if (module == require.main) {
    exports.main(image);
}
