const { admin, db } = require('./admin');


module.exports =  (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        console.log(0);
        idToken = req.headers.authorization.split('Bearer ')[1];
     } else {
         console.error('No Token Found');
         return res.status(403).json({error: 'Unauthorized'})
     }
     console.log(1);
     admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
            req.user = decodedToken;
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get();
        })
        .then((data) => {
            req.user.userHandle = data.docs[0].data().handle;
            req.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
        })
        .catch((err) => {
            console.log("Error while verifying token ", err);
            return res.status(400).json(err);
        })
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
