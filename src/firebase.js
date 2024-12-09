// src/firebase.js
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInAnonymously,
    setPersistence,
    browserLocalPersistence
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Config for SORQuizzes app
const firebaseConfig1 = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Config for Dashboard app
const firebaseConfig2 = {
    apiKey: import.meta.env.VITE_FIREBASE2_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE2_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE2_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE2_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE2_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE2_APP_ID
};

// Initialize both apps with unique names
const app1 = initializeApp(firebaseConfig1, 'sorquizzes');
let app2 = null;
let db2 = null;

// Only initialize second app if we have the required config
if (firebaseConfig2.projectId) {
    app2 = initializeApp(firebaseConfig2, 'quiz-dashboard');
    db2 = getFirestore(app2);
    console.log('Dashboard DB initialized with project:', firebaseConfig2.projectId);
} else {
    console.warn('Dashboard DB not initialized: Missing configuration');
}

// Get Firestore instances for both apps
const db1 = getFirestore(app1);

// Get Auth instance (using app1 for auth)
const auth = getAuth(app1);

// Initialize analytics with the first app
const analytics = getAnalytics(app1);

// Enable Auth persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('Firebase persistence enabled');
    })
    .catch((error) => {
        console.error('Error enabling persistence:', error);
    });

// Initialize providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Auth helper functions
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

// Database helper functions
export const getQuizAttempts = async () => {
    try {
        console.log('Fetching quiz attempts from SORQuizzes DB...');
        console.log('Collection path:', 'quizAttempts');

        const attemptsRef = collection(db1, 'quizAttempts');
        const q = query(attemptsRef, orderBy('lastUpdated', 'desc'));
        const querySnapshot = await getDocs(q);

        console.log('Raw quiz attempts data:', querySnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
        })));

        console.log('Found', querySnapshot.size, 'quiz attempts');
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting quiz attempts:', error);
        throw error;
    }
};

export const getUserProgress = async () => {
    try {
        console.log('Fetching user progress from SORQuizzes DB...');
        console.log('Collection path:', 'userProgress');

        const progressRef = collection(db1, 'userProgress');
        const q = query(progressRef, orderBy('lastUpdated', 'desc'));
        const querySnapshot = await getDocs(q);

        console.log('Raw user progress data:', querySnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
        })));

        console.log('Found', querySnapshot.size, 'progress records');
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting user progress:', error);
        throw error;
    }
};

// Functions for Quiz-Dashboard database (db2)
export const saveDashboardData = async (data) => {
    if (!db2) {
        console.warn('Dashboard DB not initialized. Data not saved:', data);
        return;
    }

    try {
        console.log('Saving dashboard data to Dashboard DB...');
        const dashboardRef = doc(db2, 'dashboardData', data.id);
        await setDoc(dashboardRef, {
            ...data,
            lastUpdated: serverTimestamp()
        }, { merge: true });
        console.log('Dashboard data saved successfully:', data.id);
    } catch (error) {
        console.error('Error saving dashboard data:', error);
        throw error;
    }
};

// Add console logs for debugging
console.log('SORQuizzes DB initialized with project:', firebaseConfig1.projectId);

// Export both databases and auth
export { db1 as sorQuizzesDb, db2 as dashboardDb, auth, analytics };
