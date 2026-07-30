import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyA742ivL9YWQElCmBs2gFQqlzxC70zBoWc",
  authDomain:        "al-saeedah8.firebaseapp.com",
  projectId:         "al-saeedah8",
  messagingSenderId: "54441603865",
  appId:             "1:54441603865:web:fd6cf275a14c0530f64b88"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = "alsaeedah8@gmail.com";
const password = "770822310saeed";

async function test() {
    let userCredential;
    try {
        console.log('Attempting sign in...');
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in success! UID:', userCredential.user.uid);
    } catch (authError) {
        console.log('Sign in failed:', authError.code, authError.message);
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
            try {
                console.log('Attempting to create user...');
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('User created! UID:', userCredential.user.uid);
                
                console.log('Attempting to write to Firestore...');
                const roleRef = doc(db, 'managers', userCredential.user.uid);
                await setDoc(roleRef, {
                    email: email,
                    name: 'المدير العام',
                    role: 'super_admin',
                    permissions: { products: true, orders: true, users: true, managers: true },
                    is_active: true
                });
                console.log('Firestore write success!');
            } catch (createErr) {
                console.error('Create user/Firestore error:', createErr.code, createErr.message);
                return;
            }
        } else {
            return;
        }
    }

    try {
        console.log('Attempting to read from Firestore...');
        const docSnap = await getDoc(doc(db, 'managers', userCredential.user.uid));
        if (!docSnap.exists()) {
            console.log('No permissions found');
        } else {
            console.log('Firestore data:', docSnap.data());
        }
    } catch (err) {
        console.error('Firestore read error:', err.code, err.message);
    }
}

test().then(() => process.exit(0)).catch(e => console.error(e));
