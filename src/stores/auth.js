import { defineStore } from 'pinia'
import { auth } from '../firebase'
import {
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    GithubAuthProvider,
    setPersistence,
    browserLocalPersistence,
    signOut
} from 'firebase/auth';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        error: null,
        isAuthRedirecting: false,
        lastRedirectError: null,
        isAuthReady: false
    }),
    actions: {
        async initializeAuthListener() {
            console.log('[Auth] Initializing auth listener');

            // Set persistence to LOCAL
            try {
                await setPersistence(auth, browserLocalPersistence);
                console.log('[Auth] Firebase persistence enabled');
            } catch (error) {
                console.error('[Auth] Error setting persistence:', error);
            }

            // Return a promise that resolves when initial auth state is determined
            return new Promise((resolve) => {
                auth.onAuthStateChanged((user) => {
                    console.log('[Auth] State changed:', {
                        user: user ? user.uid : 'No user',
                        pendingAuth: localStorage.getItem('authRedirectPending'),
                        redirectTime: localStorage.getItem('authRedirectTime')
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
                // Clear any previous state
                localStorage.removeItem('authRedirectPending');
                localStorage.removeItem('authRedirectTime');
                this.error = null;
                this.lastRedirectError = null;
                this.isAuthRedirecting = false;

                console.log('[Auth] Starting GitHub sign-in redirect flow');

                const provider = new GithubAuthProvider();
                provider.addScope('user:email');
                provider.addScope('repo'); // Add repo scope for creating issues

                // Get the Firebase app instance
                const app = auth.app;

                // Log Firebase config and current URL
                console.log('[Auth] Auth attempt:', {
                    authDomain: app.options.authDomain,
                    projectId: app.options.projectId,
                    currentURL: window.location.href,
                    isProduction: window.location.hostname === 'quiz-dashboard-alpha.vercel.app'
                });

                // Save state before redirect
                localStorage.setItem('authRedirectPending', 'github');
                localStorage.setItem('authRedirectTime', Date.now().toString());
                console.log('[Auth] Starting GitHub auth redirect...');

                // Let Firebase handle the redirect URI
                await signInWithRedirect(auth, provider);
            } catch (error) {
                console.error('[Auth] Error initiating GitHub redirect:', {
                    code: error.code,
                    message: error.message,
                    currentURL: window.location.href
                });
                this.error = error.message;
                this.lastRedirectError = error;
                this.isAuthRedirecting = false;
                localStorage.removeItem('authRedirectPending');
                localStorage.removeItem('authRedirectTime');
                throw error;
            }
        },

        async handleRedirectResult() {
            const pendingAuth = localStorage.getItem('authRedirectPending');
            const redirectTime = localStorage.getItem('authRedirectTime');
            const MAX_REDIRECT_AGE = 5 * 60 * 1000; // 5 minutes in milliseconds

            // Clear any stale state immediately
            if (!redirectTime || Date.now() - parseInt(redirectTime) > MAX_REDIRECT_AGE) {
                console.log('[Auth] Clearing stale or invalid redirect state');
                localStorage.removeItem('authRedirectPending');
                localStorage.removeItem('authRedirectTime');
                this.isAuthRedirecting = false;
                return null;
            }

            try {
                console.log('[Auth] Checking redirect result:', {
                    pendingAuth,
                    redirectTime,
                    timeSinceRedirect: redirectTime ? `${(Date.now() - parseInt(redirectTime)) / 1000}s` : 'N/A',
                    currentURL: window.location.href
                });

                const result = await getRedirectResult(auth);

                // Clear state after getting result
                localStorage.removeItem('authRedirectPending');
                localStorage.removeItem('authRedirectTime');

                if (result) {
                    console.log('[Auth] Successfully authenticated:', result.user.email);

                    // Store GitHub token if available
                    const credential = GithubAuthProvider.credentialFromResult(result);
                    if (credential?.accessToken) {
                        localStorage.setItem('github_token', credential.accessToken);
                    }

                    this.user = result.user;
                    this.isAuthRedirecting = false;
                    return result.user;
                } else {
                    console.log('[Auth] No redirect result');
                    this.isAuthRedirecting = false;
                    return null;
                }
            } catch (error) {
                console.error('[Auth] Error handling redirect:', {
                    code: error.code,
                    message: error.message,
                    pendingAuth,
                    redirectTime
                });
                this.error = error.message;
                this.lastRedirectError = error;
                this.isAuthRedirecting = false;
                localStorage.removeItem('authRedirectPending');
                localStorage.removeItem('authRedirectTime');
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