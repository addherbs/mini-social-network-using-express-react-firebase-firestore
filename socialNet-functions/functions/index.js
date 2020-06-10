const app = require('express')();
const functions = require('firebase-functions');
const { db } = require('./util/admin');
const { uuid } = require('uuidv4');


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
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
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
app.get('/user/:handle', getUserDetails);   // pulic route
app.post('/notifications', FBAuth, markNotificationsRead);


exports.api = functions.https.onRequest(app);
 

exports.createNotificationOnLike = functions.firestore
.document('likes/{id}')
.onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then(doc => {
            if(doc.exists && doc.data().userHandle != snapshot.data.userHandle){
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
        .catch(err => 
            console.error(err));
});



exports.deleteNotificationOnUnlike = functions.firestore
.document('likes/{id}')
.onDelete((snapshot) => {

    return db.doc(`/notifications/${snapshot.id}`)
        .delete()
        .catch((err) => 
            console.error(err));
});



exports.createNotificationOnComment = functions.firestore
.document('comments/{id}')
.onCreate((snapshot) => {

    return db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then(doc => {
            if(doc.exists && doc.data().userHandle != snapshot.data.userHandle){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    screamId: snapshot.data().screamId 
                });
            }
        })
        .catch(err => 
            console.error(err));

});


// update imageUrl of all the screams by user if the user changes the image
exports.onUserImageChange = functions.firestore
.document('users/{userId}')
.onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());

    if(change.before.data().imageUrl != change.after.data().imageUrl) {

        let batch = db.batch();
        return db.collection('screams').where('userHandle', '==', change.before.data.handle).get()
            .then((data) => {
                data.forEach(doc => {
                    const scream = db.doc(`/screams/${doc.id}`);
                    batch.update(scream, { userImage: change.after.data().imageUrl });
                })
                return batch.commit(); 
            })
    }

});

