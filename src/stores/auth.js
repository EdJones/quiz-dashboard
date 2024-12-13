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
        isAuthRedirecting: false,
        lastRedirectError: null
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
                console.log('[Auth] Starting GitHub sign-in redirect flow');
                this.error = null;
                this.lastRedirectError = null;
                this.isAuthRedirecting = true;

                const provider = new GithubAuthProvider();
                provider.addScope('user:email');
                provider.setCustomParameters({
                    // This ensures we get back to the correct page
                    redirect_uri: window.location.origin
                });

                // Save state before redirect
                localStorage.setItem('authRedirectPending', 'github');
                console.log('[Auth] Saving redirect state, starting GitHub auth...');

                await signInWithRedirect(auth, provider);
            } catch (error) {
                console.error('[Auth] Error initiating GitHub redirect:', error);
                this.error = error.message;
                this.lastRedirectError = error;
                this.isAuthRedirecting = false;
                localStorage.removeItem('authRedirectPending');
                throw error;
            }
        },

        async handleRedirectResult() {
            const pendingAuth = localStorage.getItem('authRedirectPending');
            console.log('[Auth] Checking redirect result. Pending auth:', pendingAuth);

            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    console.log('[Auth] Successfully authenticated:', result.user.email);
                    this.user = result.user;
                    this.isAuthRedirecting = false;
                    localStorage.removeItem('authRedirectPending');
                    return result.user;
                } else if (pendingAuth) {
                    console.log('[Auth] Redirect is pending:', pendingAuth);
                    this.isAuthRedirecting = true;
                } else {
                    console.log('[Auth] No pending redirect or result');
                    this.isAuthRedirecting = false;
                }
            } catch (error) {
                console.error('[Auth] Error handling redirect:', error);
                this.error = error.message;
                this.lastRedirectError = error;
                this.isAuthRedirecting = false;
                localStorage.removeItem('authRedirectPending');
                throw error;
            }
        },

        initializeAuthListener() {
            console.log('[Auth] Initializing auth listener');
            auth.onAuthStateChanged((user) => {
                const authState = user ? `User: ${user.email}` : 'No user';
                const pendingAuth = localStorage.getItem('authRedirectPending');
                console.log('[Auth] State changed:', authState, 'Pending:', pendingAuth);
                this.user = user;
                this.loading = false;
            });
        }
    }
}); 