const { admin, db } = require('./admin');


module.exports =  (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
     } else {
         console.error('No Token Found');
         return res.status(403).json({error: 'Unauthorized'})
     }

     admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
            req.user = decodedToken;
            console.log("Decoded Token: " ,decodedToken);
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get();
        })
        .then((data) => {
            req.user.handle = data.docs[0].data().handle;
            console.log("Decoded data: " ,req.user); 
            console.log("Decoded data Docs: " ,data.docs); 
            return next();
        })
        .catch((err) => {
            console.log("Error while verifying token ", err);
            return res.status(400).json(err);
        })
}