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
            req.user.handle = data.docs[0].data().handle;
            return next();
        })
        .catch((err) => {
            console.log("Error while verifying token ", err);
            return res.status(400).json(err);
        })
}
