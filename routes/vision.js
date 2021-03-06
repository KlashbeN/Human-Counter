'use strict';

var firebase = require("firebase"),
    fs = require('fs'),
    gm = require('gm'),
    moment = require('moment-timezone'),
    promise = require('promise'),
    async = require('async'),
    prompt = require('prompt'),
    config = require('../config'),
    unirest = require('unirest');

var ejs = require('ejs'),
    read = fs.readFileSync,
    join = require('path').join,
    path = join(__dirname, '../', 'views', '/index.ejs');

var gcloud = require('gcloud')({
    projectId: 'vision-recognition-1338',
    credentials: require('./keyfile.json')
});

var CLOUD_BUCKET = 'vision-recognition-1338.appspot.com';
var DBNAME = 'imageDatas/';
var GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate?key=' + config.gcloudVision.key;

var vision = gcloud.vision(),
    gcs = gcloud.storage(),
    bucket = gcs.bucket(CLOUD_BUCKET);

firebase.initializeApp({
    serviceAccount: {
        projectId: 'vision-recognition-1338',
        privateKey: config.firebase.pKey,
        clientEmail: 'vision-firebase@vision-recognition-1338.iam.gserviceaccount.com'
    },
    databaseURL: 'https://vision-recognition-1338.firebaseio.com/'
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = firebase.database(),
    fbAuth = firebase.auth(),
    dbRef = db.ref(DBNAME),
    testRef = db.ref(DBNAME + "Monday July 4, 2016 " + "/09:57");

var numOfCounters = 1,
    waitingTime = 5;
moment.tz.setDefault('Asia/Singapore');

var options = {
  maxResults: 100
};

//-------------------------Firebase Functions----------------------------//

//Write image data
function writeImageData(numOfPeople, numOfCounters, imageName, imageURL) {
    return new Promise(function(resolve) {
        var imageData = {
            numOfPeople: numOfPeople,
            numOfCounters: numOfCounters,
            imageName: imageName,
            imageURL: imageURL
        };

        var time = getTime();

        var updates = {};
        updates[dateConcat(getDate(), time)] = imageData; // Creates new branch called imageData
        dbRef.update(updates);
        resolve();
    })
}

function readAllData(dates) {
    return new Promise(function(resolve, reject) {
        var images = [];
        async.each(dates, function(date, callback) { // For Each Date
            getTimeRef(date).then(function(timeRefs) {
                async.each(timeRefs, function(timeStamp, callback) {
                    var path = getPath(date, timeStamp);
                    path.then(function(res) {
                        db.ref(res).on("value", function(snapshot) {
                            //    console.log(timeStamp);
                            //  console.log(snapshot.val());
                            images.push({
                                name: snapshot.val().imageName,
                                numOfPeople: snapshot.val().numOfPeople,
                                numOfCounters: snapshot.val().numOfCounters,
                                url: snapshot.val().imageURL,
                                time: moment(timeStamp, "HH:mm").format('LT'),
                                date: date
                            });
                            //console.log(images.length);
                        })
                    })
                }, function(err) {
                    //  console.log("Finish iterating times \n");
                    callback();
                })
            })
        }, function(err) {
            //console.log("Finish iterating!");
            callback();
        })
        resolve(images);
    });
}

function readData(date) {
    return new Promise(function(resolve, reject) {
        var images = [];
        console.log(date);
        getTimeRef(date).then(function(timeRefs) {
            async.each(timeRefs, function(timeStamp, callback) {
                var path = getPath(date, timeStamp);
                path.then(function(res) {
                    db.ref(res).on("value", function(snapshot) {
                        //  console.log(timeStamp);
                        //  console.log(snapshot.val());
                        images.push({
                            name: snapshot.val().imageName,
                            numOfPeople: snapshot.val().numOfPeople,
                            numOfCounters: snapshot.val().numOfCounters,
                            url: snapshot.val().imageURL,
                            time: timeStamp
                        });
                        //  console.log(images.length);
                        callback();
                    })
                })
            }, function(err) {
                console.log("Finish iterating date\n");
                resolve(images);
            })
        })
    })
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

function displayAllData() {
    testRef.on("value", function(snapshot) {
        console.log(snapshot.val());
    });
}


//-------------------------Google Cloud Functions----------------------------//

function countPeople(image, callback) {
    return new Promise(function(resolve, reject) {
        vision.detectFaces(image, options, function(error, faces) {
            if (error) throw error;
            callback(faces);
            resolve();
        });
    });
}

function uploadImage(image) {
    return new Promise(function(resolve, reject) {
        console.log("IN HERE");
        bucket.upload(image, function(err, file) {
            if (!err) {
                console.log("DONE");
                resolve();
            }
        });
    });
}

function retrieveImage() {
    bucket.file(image).download({
        destination: 'test1.jpg'
    }, function(err) {});
}

//---------------------------Miscelleneous------------------------------//

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

function initDates() {
    return new Promise(function(resolve, reject) {
        var dates = [];
        dbRef.on("value", function(snapshot) {
            var info = snapshot.val();
            for (var key in info) {
                dates.push(key);
            }
            dates.sort(function(a, b) {
              var firstDate = moment(a,'dddd MMMM D, YYYY').format('X'),
                  secondDate = moment(b,'dddd MMMM D, YYYY').format('X');
                return secondDate - firstDate;
            })
            resolve(dates);
        })
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

function getTime() {
    return moment().format("HH:mm");
}

function dateConcat(date, time) {
    return date + '/' + time;
}

function getDate() {
    return moment().format('dddd MMMM D, YYYY');
}

function parseDate(date) {
    var parsedDate = moment(date, "MM-DD-YYYY").format('dddd MMMM D, YYYY');
    console.log(parsedDate);
    return parsedDate;
}


//-----------Getters---------------//

function getNumberOfPeople() {
    return numOfPeople;
}

function getAvgNum(numOfPeople, counter) {
    if (numOfPeople != null) {
        return numOfPeople / counter;
    } else {
        return 0;
    }
}

function getPublicUrl(filename) {
    return 'https://storage.googleapis.com/' +
        CLOUD_BUCKET + '/' + filename;
}

// Returns the Google Cloud Storage object URI.
function getStorageUri(filename) {
    return 'gs://' +
        CLOUD_BUCKET +
        '/' + filename;
}

function getWaitingTime(avgPax) {
    return avgPax * waitingTime;
}

function humanCounter() {
    promptUser().then(function(res) {
            return new Promise(function(resolve, reject) {
                countPeople(res, function(faces) {
                    var numOfPeople = faces.length;
                    console.log('Found ' + numOfPeople + ' face');
                    writeImageData(getAvgNum(numOfPeople, numOfCounters), numOfCounters, res, getPublicUrl(res));
                    resolve(res);
                })
            })
        }).then(function() {
              initDates().then(function(dates) {
                  return readAllData(dates)
              }).then(function() {
                  humanCounter();
              })
          })
}

function main() {
    humanCounter();
}


exports.main = main;

module.exports = {

    getImageData: function() {
        return new Promise(function(resolve) {
            initDates().then(function(dates) {
                return readAllData(dates)
            }).then(function(images) {
                resolve(images)
            })
        })
    },

    writeData: function(numOfPeople, imageName, imageUrl) {
        return new Promise(function(resolve) {
            writeImageData(numOfPeople, imageName, imageUrl).then(function() {
                resolve();
            })
        })
    },

    viewSpecificDate: function(date) {
        return new Promise(function(resolve) {
            readData(parseDate(date)).then(function(images) {
                console.log(images.length + "Length of images");
                resolve(images);
            })
        })
    },

    formatDate: function(date) {
        return moment(date, "MM/DD/YYYY").format('dddd MMMM D, YYYY');
    },

    imageResize: function(image) {
        return new Promise(function(resolve) {
            gm(image).resizeExact(640, 480).write(image, function(err) {
                if (!err) {
                    console.log('done resizing')
                    resolve(image);
                } else {
                    console.log("empty");
                }
            });
        })
    },

    uploadToBucket: function(req, res, next) {
        if (!req.file) {
            next();
        }

        var gcsname = moment().format('HH:mm') + req.file.originalname;
        var file = bucket.file(gcsname);
        var stream = file.createWriteStream();

        stream.on('error', function(err) {
            req.file.cloudStorageError = err;
            next(err);
        });

        stream.on('finish', function() {
            req.file.cloudStorageObject = gcsname;
            req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
            req.file.cloudStorageUri = getStorageUri(gcsname);
            next();
        });

        stream.end(req.file.buffer);

    },

    visionProcess: function(image) {
        return new Promise(function(resolve) {
            countPeople(image.cloudStoragePublicUrl, function(faces) {
                var numOfPeople = faces.length;
                console.log('Found ' + numOfPeople + ' face');
                writeImageData(getAvgNum(numOfPeople, numOfCounters), numOfCounters, image.cloudStorageObject, getPublicUrl(image.cloudStorageObject))
                var imageData = {
                    numOfPeople: getAvgNum(numOfPeople, numOfCounters),
                    numOfCounters: numOfCounters,
                    name: image.cloudStorageObject,
                    url: getPublicUrl(image.cloudStorageObject),
                    time: moment().format('LT'),
                    waitingTime: getWaitingTime(getAvgNum(numOfPeople, numOfCounters))
                };
                resolve(imageData);
            })
        })
    },

    updateCounters: function(number) {
        return new Promise(function(resolve) {
            numOfCounters = number;
            resolve();
        });
    },

    getListOfDates: function() {
        return initDates();
    }

}
if (module == require.main) {
    var photo = process.argv[2];
    exports.main();
}
