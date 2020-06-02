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
        createdAt: new Date().toISOString()
    };

    db
        .collection('screams')
        .add(newScream)
        .then((doc) => {
            res.json({ message: `document ${doc.id} created successfully` });
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
