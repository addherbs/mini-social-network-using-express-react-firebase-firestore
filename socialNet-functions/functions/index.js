const app = require('express')();
const functions = require('firebase-functions');


const { getAllScreams, postOneScream } = require('./handlers/screams');
const { login, signup, uploadImage, addUserDetails, getAuthenticatedUser} = require('./handlers/users');


// Middleware for verifying if the user is logged in or not
const FBAuth = require('./util/fbAuth');


// Scream Routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);


// User Routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image',  FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);


exports.api = functions.https.onRequest(app);
