import { defineStore } from 'pinia';
import { auth } from '../firebase';
import {
    GithubAuthProvider,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserLocalPersistence,
    signOut
} from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        error: null,
        isAuthReady: false
    }),

    actions: {
        async initializeAuthListener() {
            console.log('[Auth] Initializing auth listener');

            try {
                await setPersistence(auth, browserLocalPersistence);
                console.log('[Auth] Firebase persistence enabled');
            } catch (error) {
                console.error('[Auth] Error setting persistence:', error);
            }

            return new Promise((resolve) => {
                auth.onAuthStateChanged((user) => {
                    console.log('[Auth] State changed:', {
                        user: user ? user.uid : 'No user'
                    });
                    this.user = user;
                    if (!this.isAuthReady) {
                        this.isAuthReady = true;
                        resolve(user);
                    }
                });
            });
        },

        async signInWithGithub() {
            try {
                console.log('[Auth] Starting GitHub sign-in');
                const provider = new GithubAuthProvider();
                provider.addScope('user:email');
                provider.addScope('repo');

                const result = await signInWithPopup(auth, provider);
                const credential = GithubAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                localStorage.setItem('github_token', token);

                console.log('[Auth] GitHub sign-in successful');
                return result.user;
            } catch (error) {
                console.error('[Auth] Error in GitHub sign-in:', error);
                this.error = error.message;
                throw error;
            }
        },

        async signInWithGoogle() {
            try {
                console.log('[Auth] Starting Google sign-in');
                const provider = new GoogleAuthProvider();
                provider.addScope('email');
                const result = await signInWithPopup(auth, provider);
                console.log('[Auth] Google sign-in successful');
                return result.user;
            } catch (error) {
                console.error('[Auth] Error in Google sign-in:', error);
                this.error = error.message;
                throw error;
            }
        },

        async signOut() {
            try {
                await signOut(auth);
                this.user = null;
                localStorage.removeItem('github_token');
                console.log('[Auth] User signed out successfully');
            } catch (error) {
                console.error('[Auth] Error signing out:', error);
                throw error;
            }
        }
    }
});
