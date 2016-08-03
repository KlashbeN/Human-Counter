'use strict';

var firebase = require("firebase"),
    fs = require('fs'),
    gm = require('gm'),
    moment = require('moment'),
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

// Initialize the app with a service account, granting admin privileges
/*firebase.initializeApp({
  databaseURL: 'https://vision-recognition-1338.firebaseio.com/',
  serviceAccount: 'serviceAccountCredentials.json'
}); */

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

//var image = 'demo2.jpg';
var numOfCounters = 1;

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

            //Update the database with the image data
            /*var day = getDay(),
                date = getDate(), */
            var time = getTime();

            var updates = {};
            //  updates[dateConcat(day, date, time)] = imageData; // Creates new branch called imageDatas
            updates[dateConcat(getDate(), time)] = imageData;
            dbRef.update(updates);
            resolve();
            //  resolve(dbRef.update(updates));
        })
        //return dbRef.update(updates);
}


// TODO: Promise initDates first and initTime, next figure out how to loop through both.
// TODO: Figure out how to get the time first for each date before obtaining the data!!
// TODO: Figure out how to transfer the data out!
// TODO: Add promise to this function, maybe we  can try for loop with a function inside the for loop?
// NOTE: DONE syncing

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
                                url: snapshot.val().imageURL,
                                time: timeStamp
                            });
                            //console.log(images.length);
                            //callback(); WAS SUPPOSE TO BE HERE
                        })
                    })
                }, function(err) {
                    //  console.log("Finish iterating times \n");
                    callback();
                })
            })
        }, function(err) {
            //console.log("Finish iterating!");
            callback(); // temporary here for testing. wasnt here before
            //  resolve(images); // WAS HERE
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
                            url: snapshot.val().imageURL,
                            time: timeStamp
                        });
                        //  console.log(images.length);
                        callback();
                        //callback(); WAS SUPPOSE TO BE HERE
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


/*function countPeople(image, callback) {
    vision.detectFaces(image, function(error, faces) {
        if (error) throw error;
        callback(faces);
    });
} */

function countPeople(image, callback) {
    return new Promise(function(resolve, reject) {
        vision.detectFaces(image, function(error, faces) {
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
// TODO: MAKE DATE EMPTY!

function initDates() {
    return new Promise(function(resolve, reject) {
        var dates = []; // MAKE THE DATE EMPTY FIRST. TRY IT.
        dbRef.on("value", function(snapshot) {
            var info = snapshot.val();
            for (var key in info) {
                dates.push(key);
            }
            resolve(dates);
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
/*function getDayDate() {
    return getDay() + ' ' + getDate();
}

function getDate() {
    return moment().format('LL');
}

function getDay() {
    return moment().format('dddd');
} */

function getTime() {
    return moment().format("HH:mm");
}

/*function dateConcat(day, date, time) {
    return day + ' ' + date + ' /' + time;
} */

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
    return numOfPeople / counter;
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

//NOTE: Working loop for continuous input from the user.

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
        }).then(function(res) {
            uploadImage(res)
        }).then(function() {
            readData("Thursday July 28, 2016")
                .then(function() {
                    humanCounter();
                })
        })
        /*  .then(function() {
              initDates().then(function(dates) {
                  return readAllData(dates)
              }).then(function() {
                  humanCounter();
              })
          }) */
}
// TODO: Prompt then process the image. Loop the process non stop.


/*function main(image) {
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
} */


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

    uploadImage1: function(image) {
        return new Promise(function(resolve) {
            console.log("I am trying to upload");
            uploadImage(image).then(function() {
                resolve();
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
        return moment(date, "MM-DD-YYYY").format('dddd MMMM D, YYYY');
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

        var gcsname = moment() + req.file.originalname;
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

  /*  visionProcess: function(image) {
        return new Promise(function(resolve) {
            countPeople(image.cloudStoragePublicUrl, function(faces) {
                var numOfPeople = faces.length;
                console.log('Found ' + numOfPeople + ' face');
                writeImageData(numOfPeople, numOfCounters, image.cloudStorageObject, getPublicUrl(image.cloudStorageObject))
            }).then(function() {
                return new Promise(function(resolve) {
                    var imageData = {
                        numOfPeople: numOfPeople,
                        numOfCounters: numOfCounters,
                        imageName: image.cloudStorageObject,
                        imageURL: getPublicUrl(image.cloudStorageObject)
                    };
                    console.log(imageData.length + "LENGTH OF IMAGE");
                    resolve(imageData);
                }).then(function(imageData) {resolve(imageData)});
        })
    })
  }, */
  visionProcess: function(image) {
        return new Promise(function(resolve) {
            countPeople(image.cloudStoragePublicUrl, function(faces) {
                var numOfPeople = faces.length;
                console.log('Found ' + numOfPeople + ' face');
                writeImageData(numOfPeople, numOfCounters, image.cloudStorageObject, getPublicUrl(image.cloudStorageObject))
                var imageData = {
                  numOfPeople: numOfPeople,
                  numOfCounters: numOfCounters,
                  name: image.cloudStorageObject,
                  url: getPublicUrl(image.cloudStorageObject),
                  time: moment().format('LT')
                };
                resolve(imageData);
              })
            })
},

    getChildAdded: function() {
        return new Promise(function(resolve) {
            dbRef.on("child_added", function(snapshot, prevChildKey) {
                var newPost = snapshot.val();
                console.log("Author: " + newPost.numOfPeople);
                console.log("Title: " + newPost.numOfPeople);
            });
        });
    },

    updateCounters: function( number) {
      return new Promise(function(resolve) {
      numOfCounters = number;
      resolve();
    });
    }



    /*.then(function() {
            console.log("Over here?");
            var data = {
              numOfPeople: numOfPeople,
              numOfCounters: numOfCounters,
              imageName: image.cloudStorageObject,
              imageURL: getPublicUrl(image.cloudStorageObject)
            };
            return data;
          })
      }); */

    /*  base64encode: function(file) {
          return new Promise(function(resolve) {
              var raw = new Buffer(file.buffer.toString(), 'base64');
              return raw;
            }).then(function(raw) {
              console.log("FILE IS HERE AND FINE",raw)
                resolve(raw);
          })
      } */

    /*  visionProcess: function(cloudStorageUri, callback) {
          return new Promise(function(resolve) {
            console.log(cloudStorageUri);
              var body = {
                  "requests": [{
                      "image": {
                          "source": {
                              "gcsImageUri": cloudStorageUri,
                          }
                      },
                      "features": [{
                          "type": "FACE_DETECTION",
                          "maxResults": 1
                      }]
                  }]
              }

              console.log("DONE");
              unirest.post(GOOGLE_VISION_API_URL)
                  .header({
                      'Content-Type': 'application/json'
                  })
                  .send(body)
                  .end(function(response) {
                      console.log(JSON.stringify(response.body.responses));
                      writeImageData(JSON.stringify(response.body.responses),0,0,0);
                  });
              resolve();
          });
      } */
}
if (module == require.main) {
    var photo = process.argv[2];
    exports.main();
}
