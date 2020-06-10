const { admin, db } = require('../util/admin')

const { uuid } = require('uuidv4');

const config = require('../util/config')

const firebase = require('firebase');
firebase.initializeApp(config);

const { validateSignupDate, validateLoginData, reduceUserDetails } = require('../util/validators');


exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmpassword,
        handle: req.body.handle,
    }

    const { valid, errors } = validateSignupDate(newUser);

    if(!valid) return res.status(400).json(errors);

    const blankImage = 'blank-image.png'

    // Validate Data
    let token, userId;
    db
        .doc(`/users/${newUser.handle}`).get()
        .then((doc) => {
            if(doc.exists){
                return res.status(400).json({ handle: 'this handle is already taken'});
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idToken) => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${blankImage}?alt=media`,
                userId
            }
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({token});
        })
        .catch(err => {
            console.log(err);
            if (err.code === 'auth/email-already-in-use'){
                return res.status(400).json({ email: 'Email Already in Use'});
            } else {
                return res.status(500).json({ general: "Something went wrong, please try again" });
            }
        });
}


// Log user in
exports.login = (req, res) => {

    const user = {
        email: req.body.email,
        password: req.body.password
    };

    const { valid, errors } = validateLoginData(user);

    if(!valid) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then((data) => {
            return data.user.getIdToken();
        }) 
        .then((token) => {
            return res.json({token});
        })
        .catch((err) => {
            console.error(err);
            // 'auth/wrong-password'
            // 'auth/user-not-found'

            return res
                .status(403)
                .json({general: "wrong credential please try again"});
            
        })
}


//Get any user's details
exports.getUserDetails = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.params.handle}`).get()
        .then(doc => {
            if(doc.exists){
                userData.user = doc.data();
                return db.collection('screams').where('userHandle', '==', req.params.handle)
                    .orderBy('createdAt', 'desc')
                    .get();
            } else {
                return res.status(404).json({error: 'user not found'});
            }
        })
        .then(data => {
            userData.screams = [];
            data.forEach(doc => {
                userData.screams.push({
                    body: doc.data().body,
                    createdAt: doc.data().createdAt,
                    userHandle: doc.data().userHandle,
                    userImg: doc.data().userImg,
                    likeCount: doc.data().likeCount,
                    commentCount: doc.data().commentCount,
                    screamId: doc.id
                })
            });
            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: err.code});
        })
}


// Get Own user details
exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
    db
        .doc(`/users/${req.user.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db.collection('likes')
                        .where('userHandle', '==', req.user.handle).get();
            }
        })
        .then(data => {
            userData.likes = [];
            data.forEach(doc => {
                userData.likes.push(doc.data());
            })
            return db.collection('motifications').where('recipient', '==', req.user.handle)
                .orderBy('createdAt', 'desc').limit(10).get();
        })
        .then(data => {
            userData.notifications = []
            data.forEach(doc => {
                data.notifications.push({
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    createdAt: doc.data().createdAt,
                    screamId: doc.data().screamId,
                    type: doc.data().type,
                    read: doc.data().read,
                    notificationId: doc.id,
                });
            });
            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });

}


// Add user details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);
    db
    .doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then (() => {
        return res.json({ message: "details added successfully"});
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code});
    });
}



// Upload an image for user
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUpLoaded = {};
    let generatedToken = uuid();

    // This code will process each file uploaded.
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

        console.log(fieldname, file, filename, encoding, mimetype);

        if(mimetype != 'image/jpeg' && mimetype != 'image/png'){
            return res.status(400).json({ error: 'Wrong file type submitted' });
        }

        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFilename =  `${Math.round(Math.random()*1000000000000).toString()}.${imageExtension}`;

        // Note: os.tmpdir() points to an in-memory file system on GCF
        // Thus, any files in it must fit in the instance's memory.
        const filePath = path.join(os.tmpdir(), imageFilename);
        imageToBeUpLoaded = {filePath, mimetype, imageName:imageFilename};

        console.log("imageURL: ", imageFilename);
        file.pipe(fs.createWriteStream(filePath));

    });


    // Triggered once all uploaded files are processed by Busboy.
    // We now upload it to firebase bucket
    busboy.on('finish', () => {
        console.log("config bucket ", config.storageBucket);
        console.log(imageToBeUpLoaded, imageFileName, imageToBeUpLoaded.imageName);
        admin
            .storage()
            .bucket(config.storageBucket)
            .upload(imageToBeUpLoaded.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUpLoaded.mimetype,
                        //Generate token to be appended to imageUrl
                        firebaseStorageDownloadTokens: generatedToken,
                    },
                },
        })
        .then(() => {
            console.log("Filename: ", imageFileName);
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageToBeUpLoaded.imageName}?alt=media&token=${generatedToken}`;
            console.log("imageURL: ", imageUrl);
            return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
        })
        .then(() => {
            return res.json({ message: "image uploaded successfully "});
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: err.code})
        });
    });
    busboy.end(req.rawBody);
};


//Mark notifications read function for a user
exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach(notifId => {
        const notification = db.doc(`/notifications/${notifId}`);
        batch.update(notification, { read : true});
    });
    batch.commit()
        .then(() => {
            return res.json({ message: "Notifications Marked Read"});
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });
}


