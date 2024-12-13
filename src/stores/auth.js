import { defineStore } from 'pinia'
import { auth } from '../firebase'
import {
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    GithubAuthProvider
} from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        loading: true,
        error: null,
        isAuthRedirecting: false
    }),
    actions: {
        async signInWithGoogle() {
            try {
                this.error = null;
                this.isAuthRedirecting = true;
                await signInWithRedirect(auth, new GoogleAuthProvider());
            } catch (error) {
                console.error('Error starting Google sign-in:', error);
                this.error = error.message;
                this.isAuthRedirecting = false;
                throw error;
            }
        },

        async signInWithGithub() {
            try {
                console.log('Starting GitHub sign-in...');
                this.error = null;
                this.isAuthRedirecting = true;
                const provider = new GithubAuthProvider();
                provider.addScope('user:email');
                console.log('Initiating redirect...');
                await signInWithRedirect(auth, provider);
            } catch (error) {
                console.error('Error starting Github sign-in:', error);
                this.error = error.message;
                this.isAuthRedirecting = false;
                throw error;
            }
        },

        async handleRedirectResult() {
            try {
                console.log('Checking redirect result...');
                const result = await getRedirectResult(auth);
                console.log('Redirect result:', result ? 'Success' : 'No result');
                if (result) {
                    console.log('User authenticated:', result.user.email);
                    this.user = result.user;
                    this.isAuthRedirecting = false;
                    return result.user;
                }
            } catch (error) {
                console.error('Error completing sign-in:', error);
                this.error = error.message;
                this.isAuthRedirecting = false;
                throw error;
            }
        },

        initializeAuthListener() {
            console.log('Initializing auth listener...');
            auth.onAuthStateChanged((user) => {
                console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
                this.user = user;
                this.loading = false;
            });
        }
    }
}); 