//import { getAuth } from "firebase/auth";
//import "firebase/firestore";

import { initializeApp } from "firebase/app";
import "firebase/auth";
import "firebase/storage";

// TODO: Replace the following with your app's Firebase project configuration
export var firebaseConfig = {
  apiKey: "AIzaSyAs9BpsQZFolkkBn4ShDTzb1znu_7JM894",
  authDomain: "thumbprint-1c31n.firebaseapp.com",
  databaseURL: "https://thumbprint-1c31n.firebaseio.com",
  projectId: "thumbprint-1c31n",
  storageBucket: "thumbprint-1c31n.appspot.com",
  messagingSenderId: "782099731386",
  appId: "1:782099731386:web:0e1e03e9d0b411c5120383"
};
//if (!firebase.apps.length) {
//const auth = getAuth(firebase);
//firebase && firebase.auth && firebase.auth().useDeviceLanguage();
//firebase.firestore().enablePersistence(false);
//}
//firebase.firestore().enablePersistence({ synchronizeTabs: true });
//firebase.auth();
//firebase.storage();
/*.settings({
  cacheSizeBytes: 1048576
});*/
//firebase.firestore().settings({ persistence: false });

/*export default function firebase() {
  return firb;
}*/

const firebase = initializeApp(firebaseConfig);
export default firebase;
