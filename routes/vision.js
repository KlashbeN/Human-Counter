'use strict';

var firebase = require("firebase"),
    fs = require('fs'),
    gm = require('gm'),
    moment = require('moment'),
    promise = require('promise'),
    async = require('async'),
    prompt = require('prompt');

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
/*firebase.initializeApp({
  databaseURL: 'https://vision-recognition-1338.firebaseio.com/',
  serviceAccount: 'serviceAccountCredentials.json'
}); */

firebase.initializeApp({
    serviceAccount: {
        projectId: 'vision-recognition-1338',
        privateKey: '-----BEGIN PRIVATE KEY-----\n' +
            'MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCN/Z+/GVV6RvdC\nB9/pCcqJvc6U4w89mbdIFcJ+L9oOhwm0M0R2CzshrVu9+ox0UKiZY9Ph4X2snUIU\n+EPg7Dm86kxDwoe0JrpFTxdLgnuXsOwokiJWx8CFAl+ma0AtrzJdmHlTTnKJnLMB\n9Y4BEKi7PiUDFGFrnajVK5KvFzd/wgfzt+YExr4VUahscuT7s9Rk86b0CpVyKTmF\nByrq9zE9v2U4LN5Thmi/2roGuPgiLJLPbR480EuW2wOn0gXZzELZlW9FS7HBQqE2\nt4El/F6/NUZcKl9THuEcFgiQOMn0PAxSHXlHbBk1iMc+w2mYe6E8g0BrZ+bSCVXG\ng5uSiaIZAgMBAAECggEAP68rgPiJ4AgISjNh+BGOJ+1bxGd6pHRXQhuQWix4Lt/e\nOFZuNEuhP9+TMEg5ysmKdRHTLJKIXW1DAEjBmRYaZ2LmxdVwLBranM92cUWazVRq\n919jy2xYKs//upKL/HGBs3z5naWntZT0rMJH6K5iH2kmDJWNhEj4OnQKnEFbgQ8I\nffEnRwwd60xTwXiieLz5n+qC5iMnMKrLRauQfxIiqmDD8i9pJJ3c96/LtsibxbNq\n9ZYhnii1SMNnmcLTL47ppu/tWHrzRlil33DIMWFO8zN4WqZo3EGIHs78B5rW/9J+\nPuzVWZKjf2URBUW9tQPm9jngAdnOGe2eEKtnE8IxAQKBgQDGStL/+T2WdNi0jew0\n8CmnVaDgWhi/9Cos4DYRmgvlBMuDiAzQPEVaLg0452Qw/dseDtiF6ngQ9EVnitm5\n2K5L2qAya/y9CY6HS1mzv0AVgTEJ0pqLsBV3LhJi6hAjYSuyxOov/rD+rAY77xSr\n45I9XAUDMbo5L4c2ABzaN6bbCQKBgQC3UDgzZiJ/wJKZ1aySzgouevxs0hWHxbVe\nnIA5JtAlAkfn3QA8vMYIlNyciLpSskTN8Zqlavi6Z5CAxfplcxFyokcVuSsuL/qk\n9Aj+qNNhU9+FqMTnu2bg19A82qaQXC66JG+arWSBwk6L2SkLnPbxI9ffckXYzNrs\nfgyrPaWCkQKBgB8HMFMrng6ABDTkjFSQTARKKt1QW9UVkM/q2asRbtEMWggf7tla\nxQNid2EzHANqhbIDYrA5y0Xj40RbfsxM8qEd+blKGoc+CpZzHPs6bv2udIzz7ojz\nKbi3ddsSgyn2F49mrrqJ4QpIwsT4GUT4XDbLwmEIk/pEzKSPifQ/hxV5AoGAaBAu\nF1+frg5QKuxV73Dv7rr6mXwZpN3jvDXzxH34I0pML6ASBmjTswNuyZ4Ex/VTgeXp\n+IXldUxdh/zbzMOp3/2nhPl9PdcW3pV6lbaZaOMIPQQ146dLG9Dn8ePeMo1iKWGN\nya0tJUx88n7xAhq1ROcoITzp0c1Zam+UGZIBZ0ECgYAmBxMaesHsyKqBikp0oKA4\noSwvO/rh3uryZ4zKQ3wzUIQokJAfOKbK6FXyDREyYzlqPy1zCUSyf1R48JEq1e3/\nICyZG4iGY2BeTGjzYuW/bkuVM0xI3rleJTpib/zbIstEqE0Ay6dyZFqd/JZSssm7\nSEQMN2x+8IsmhtBNaUfOFQ==\n-----END PRIVATE KEY-----\n',
        clientEmail: 'vision-firebase@vision-recognition-1338.iam.gserviceaccount.com'
    },
    databaseURL: 'https://vision-recognition-1338.firebaseio.com/'
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = firebase.database(),
    fbAuth = firebase.auth(),
    dbRef = db.ref(DBNAME),
    testRef = db.ref(DBNAME + "Monday July 4, 2016 " + "/09:57");

var image = 'demo.jpg',
    dates = [],
    times = [],
    uri = "gs://vision-recognition-1338.appspot.com/demo.jpg",
    url = 'https://storage.googleapis.com/vision-recognition-1338.appspot.com/demo.jpg'

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



//-------------------------Google Cloud Functions----------------------------//


function countPeople(image, callback) {
    vision.detectFaces(image, function(error, faces) {
        if (error) throw error;
        callback(faces);
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

function imageResize(image) {
    gm(image).resizeExact(640, 480).write(image, function(err) {
        if (!err) console.log('done resizing');
    });
    return image;
}

function promptUser() {
    return new promise(function(resolve, reject) {
        prompt.start();
        prompt.get(['imageName'], function(err, result) {
            if (result.imageName === 'q') {
                process.exit();
            } else {
                resolve(result.imageName);
            }
        })
    })
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


//-----------Getters---------------//

function getNumberOfPeople() {
    return numOfPeople;
}

function getAvgNum(counter, numOfPeople) {
  return numOfPeople/counter;
}

function getPublicUrl(image) {
  return 'https://storage.googleapis.com/' +
    CLOUD_BUCKET + '/' + image;
}

// Returns the Google Cloud Storage object URI.
function getStorageUri(filename) {
  return 'gs://' +
    CLOUD_BUCKET +
    '/' + filename;
}

//NOTE: Working loop for continuous input from the user.

function humanCounter() {
    promptUser().then(function(res) {
        return new Promise(function(resolve, reject) {
            countPeople( res, function(faces) {
                var numOfPeople = faces.length;
                console.log('Found ' + numOfPeople + ' face');
                resolve();
            })
        })
    }).then(function() {
        humanCounter();
    })
}
// TODO: Prompt then process the image. Loop the process non stop.


function main(image) {
    countPeople(image, function(faces){
    	var numOfPeople = faces.length;
    	console.log('Found ' + numOfPeople + ' face');
    	//writeImageData(numOfPeople,image,getPublicUrl(image));
    });
    //uploadImage(image);
    initDates().then(function() {
        return readAllData()
    }).then(function(res) {
        getImages(res)
    });
}

/*
function main() {
  humanCounter();
}
*/

exports.main = main;

module.exports = {

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
    var photo = process.argv[2];
    exports.main(url);
}
