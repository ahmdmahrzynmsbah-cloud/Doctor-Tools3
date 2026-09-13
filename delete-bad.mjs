import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "pos1-d562e",
  appId: "1:607061495520:web:86e73b21063ba9c494ca85",
  apiKey: "AIzaSyCmeCCutt5Q9NLuILm8i_XtM1QCSV4_aUo",
  authDomain: "pos1-d562e.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-remixremixdoctor-f0577ee1-2a87-41e0-87d5-9d60e34ff5bd");

deleteDoc(doc(db, 'users', 'main_store', 'customers', 'cdbae8a5-07f1-4ba6-ae46-689643ed86a0')).then(() => {
  console.log("Deleted");
  process.exit(0);
});
