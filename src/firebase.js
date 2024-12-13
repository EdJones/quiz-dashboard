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
    serverTimestamp,
    addDoc,
    where
} from "firebase/firestore";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInAnonymously,
    setPersistence,
    browserLocalPersistence,
    signOut,
    fetchSignInMethodsForEmail,
    signInWithCredential,
    linkWithCredential,
    connectAuthEmulator
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

// Connect to auth emulator in development
if (import.meta.env.DEV) {
    try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        console.log('[Firebase] Connected to auth emulator');
    } catch (error) {
        console.error('[Firebase] Error connecting to auth emulator:', error);
    }
}

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
githubProvider.addScope('repo'); // For creating issues
githubProvider.addScope('user'); // For user information

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
        console.log('Attempting GitHub sign in...');
        const currentUser = auth.currentUser;

        // If there's an anonymous user, try to link it
        if (currentUser?.isAnonymous) {
            console.log('Linking anonymous user with GitHub...');
            try {
                const result = await signInWithPopup(auth, githubProvider);
                const credential = GithubAuthProvider.credentialFromResult(result);
                const accessToken = credential.accessToken; // Get GitHub access token

                // Store the access token in localStorage or user custom claims
                localStorage.setItem('github_token', accessToken);

                if (credential) {
                    await linkWithCredential(auth.currentUser, credential);
                    console.log('Successfully linked anonymous account with GitHub');
                    return auth.currentUser;
                }
            } catch (linkError) {
                if (linkError.code === 'auth/provider-already-linked') {
                    console.log('Provider already linked, proceeding with sign in');
                    const result = await signInWithPopup(auth, githubProvider);
                    const credential = GithubAuthProvider.credentialFromResult(result);
                    const accessToken = credential.accessToken;
                    localStorage.setItem('github_token', accessToken);
                    return result.user;
                }
                throw linkError;
            }
        }

        // If no anonymous user, just do regular sign in
        const result = await signInWithPopup(auth, githubProvider);
        const credential = GithubAuthProvider.credentialFromResult(result);
        const accessToken = credential.accessToken;
        localStorage.setItem('github_token', accessToken);
        console.log('Github sign in successful:', result.user.uid);
        return result.user;
    } catch (error) {
        if (error.code === 'auth/credential-already-in-use') {
            console.log('Account already exists, signing in with GitHub...');
            const credential = GithubAuthProvider.credentialFromError(error);
            if (credential) {
                const result = await signInWithCredential(auth, credential);
                return result.user;
            }
        }

        console.error('Detailed GitHub sign in error:', {
            code: error.code,
            message: error.message,
            email: error.customData?.email,
            credential: error.credential
        });
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
        console.log('Existing user:', auth.currentUser.uid);
        return auth.currentUser;
    } catch (error) {
        console.error('Error in anonymous sign in:', error);
        throw error;
    }
};

// Add logout helper function
export const signOutUser = async () => {
    try {
        await signOut(auth);
        console.log('User signed out successfully');
    } catch (error) {
        console.error('Error signing out:', error);
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

console.log('Firebase Auth Config:', {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
});
