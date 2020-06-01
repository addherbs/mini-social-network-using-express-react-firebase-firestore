var admin = require("firebase-admin");

var serviceAccount = require("../service_account_permission.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialnet-84158.firebaseio.com"
});


const db = admin.firestore();


module.exports = { admin, db }
