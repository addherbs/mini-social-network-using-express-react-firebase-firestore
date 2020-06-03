const { admin, db } = require('../util/admin')


exports.getAllScreams = (req, res) => {

    db  
        .collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let screams = [];
            data.forEach(doc => {
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt
                });
            });
            return res.json(screams);
    })
    .catch((err) => {
        res.status(500).json({ error: 'something went wrong while retrieving data' });
        console.error(err);
    });

}


exports.postOneScream = (req, res) => {

    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString(),
        imageUrl: req.user.imageUrl,
        likeCount: 0,
        commentCount: 0
    };

    db
        .collection('screams')
        .add(newScream)
        .then((doc) => {
            const responseScream = newScream;
            responseScream.screamId = doc.id; 
            return res.json(responseScream);
        })
        .catch((err) => {
            res.status(500).json({ error: 'something went wrong while posting data' });
            console.error(err);
        });

}


// We also create a composite-index in the collection screams, field createdAt, orderBy descending.
// A link will be given when the db query is run 1st time and just clink on the link to create the index.
exports.getScream = (req, res) => {
    let screamData = {};
    db
        .doc(`/screams/${req.params.screamId}`).get()
        .then((doc) => {
            if (!doc.exists){
                return res.status(404).json({ error: 'Scream not found'});
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            console.log("testing, ", doc.id, req.params.screamId);
            return db
                .collection('comments')
                .orderBy('createdAt', 'desc')
                .where('screamId', '==', req.params.screamId)
                .get();
        })
        .then((data) => {
            screamData.comments = [];
            data.forEach((doc) => {
                screamData.comments.push(doc.data());
            });
            return res.json(screamData);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });
}


// Post the comment on scream
exports.postCommentOnScream = (req, res) => {
    
    if(req.body.body.trim() === ''){
        return res.status(400).json({ error: "Must not be empty" });
    }

    console.log(req.body);
    console.log(req.params);
    console.log(req.user);

    let newCommentData = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        screamId: req.params.screamId,
        userHandle: req.user.userHandle,
        userImage: req.user.imageUrl
    };


    // Verify if scream exists
    db.doc(`/screams/${req.params.screamId}`).get()
        .then((doc) => {
            if(!doc.exists){
                return res.status(404).json({ error: 'scream not found'});
            }
            return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
        })
        .then(() => {
            console.log("Comment Data: ", newCommentData);
            return db.collection('comments').add(newCommentData);
        })
        .then(() => {
            res.json(newCommentData);
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({error: "Something went wrong"});
        })

}


// Liking a scream
exports.likeScream = (req, res) => {

    console.log("TEST: ", req.user.userHandle, req.params.screamId);

    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.userHandle)
        .where('screamId', '==', req.params.screamId).limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData = {};

    screamDocument.get()
        .then((doc) => {
            if(doc.exists){
                screamData = doc.data();
                screamData.screamId = req.params.screamId;
                return likeDocument.get();
            } else {
                return res.status(404).json({error: 'Scream not found'});
            }
        })
        .then((data) => {
            if(data.empty){
                return db.collection('likes').add({
                    screamId: req.params.screamId,
                    userHandle: req.user.userHandle
                })
                .then(() => {
                    screamData.likeCount++;
                    return screamDocument.update({likeCount: screamData.likeCount});
                })
                .then(() => {
                    return res.json(screamData);
                })
            } else {
                return res.status(400).json({ error: "Scream already liked"});
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ error: err.code });
        });

}



// Unlking a scream
exports.unlikeScream = (req, res) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', req.user.userHandle)
        .where('screamId', '==', req.params.screamId)
        .limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData = {};

    screamDocument.get()
        .then((doc) => {
            if(doc.exists){
                screamData = doc.data();
                screamData.screamId = req.params.screamId;
                return likeDocument.get();
            } else {
                return res.status(404).json({error: 'Scream not found'});
            }
        })
        .then((data) => {
            if(data.empty){
                return res.status(400).json({ error: "Scream already liked"});
            } else {
                return db.doc(`/likes/${data.docs[0].id}`).delete()
                .then(() => {
                    screamData.likeCount--;
                    return screamDocument.update({ likeCount: screamData.likeCount});
                })
                .then(() => {
                    res.json(screamData);
                });
            }  
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ error: err.code });
        });
}

exports.deleteScream = (req, res) => {

}
