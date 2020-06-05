const app = require('express')();
const functions = require('firebase-functions');
const { db } = require('./util/admin');

const { getAllScreams, 
    postOneScream, 
    getScream, 
    postCommentOnScream,
    likeScream,
    unlikeScream,
    deleteScream
} = require('./handlers/screams');

const { login, 
    signup, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser
} = require('./handlers/users');


// Middleware for verifying if the user is logged in or not
const FBAuth = require('./util/fbAuth');


// Scream Routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
// TODO delete scream
app.post('/scream/:screamId/comment', FBAuth, postCommentOnScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);

// User Routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image',  FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);


exports.api = functions.https.onRequest(app);


exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                if(doc.exists){
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like',
                        read: false,
                        screamId: snapshot.data().screamId      // doc.id => screamId
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch(err => {
                console.error(err);
                return;
            });
    });


exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
    .onCreate((snapshot) => {

        db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                if(doc.exists){
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment',
                        read: false,
                        screamId: snapshot.data().screamId      // doc.id => screamId
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch(err => {
                console.error(err);
                return;
            });

    });