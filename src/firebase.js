// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, serverTimestamp, enableIndexedDbPersistence, query, orderBy, getDocs, where } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence, signInAnonymously, GoogleAuthProvider, signInWithPopup, GithubAuthProvider } from "firebase/auth";

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
const auth = getAuth(app);
const db = getFirestore(app);

// Wait for auth before enabling persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('Auth persistence enabled');
        // Enable Firestore persistence after auth is set up
        return enableIndexedDbPersistence(db);
    })
    .then(() => {
        console.log('Firestore persistence enabled');
    })
    .catch((error) => {
        if (error.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (error.code === 'unimplemented') {
            console.warn('The current browser doesn\'t support persistence.');
        } else {
            console.error('Error enabling persistence:', error);
        }
    });

// Initialize providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

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

// Function to get quiz attempts
export const getQuizAttempts = async () => {
    try {
        const attemptsRef = collection(db, 'quizAttempts');
        const q = query(attemptsRef, orderBy('lastUpdated', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting quiz attempts:', error);
        throw error;
    }
};

// Function to get all user progress (admin view)
export const getUserProgress = async () => {
    try {
        const progressRef = collection(db, 'userProgress');
        const q = query(progressRef, orderBy('lastUpdated', 'desc')); // Order by timestamp
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting user progress:', error);
        throw error;
    }
};

// Add OAuth sign in functions
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google sign in successful:', result.user.uid);
        return result.user;
    } catch (error) {
        console.error('Error in Google sign in:', error);
        throw error;
    }
};

export const signInWithGithub = async () => {
    try {
        const result = await signInWithPopup(auth, githubProvider);
        console.log('Github sign in successful:', result.user.uid);
        return result.user;
    } catch (error) {
        console.error('Error in Github sign in:', error);
        throw error;
    }
};

export { db, auth };
