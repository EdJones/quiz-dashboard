// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('Firebase persistence enabled');
    })
    .catch((error) => {
        console.error('Error enabling persistence:', error);
    });

// Auth helper functions
export const signInAnonymouslyWithPersistence = async () => {
    try {
        if (!auth.currentUser) {
            const credential = await signInAnonymously(auth);
            console.log('New anonymous user signed in:', credential.user.uid);
            return credential.user;
        }
        console.log('Existing anonymous user:', auth.currentUser.uid);
        return auth.currentUser;
    } catch (error) {
        console.error('Error in anonymous sign in:', error);
        throw error;
    }
};

export const saveUserProgress = async (quizId, progress) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('No authenticated user');

        const progressRef = doc(db, 'userProgress', `${userId}_${quizId}`);
        await setDoc(progressRef, {
            userId,
            quizId,
            ...progress,
            lastUpdated: serverTimestamp()
        }, { merge: true });
        console.log('Progress saved:', progressRef.id);
    } catch (error) {
        console.error('Error saving progress:', error);
        throw error;
    }
};
export { db, auth };
