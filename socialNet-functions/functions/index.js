const functions = require('firebase-functions');
const app = require('express')();


const { getAllScreams, postOneScream } = require('./handlers/screams');
const { login, signup, uploadImage } = require('./handlers/users');


// Middleware for verifying if the user is logged in or not
const FBAuth = require('./util/fbAuth');


// Scream Routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);


// User Routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image',  FBAuth, uploadImage);


exports.api = functions.https.onRequest(app);
