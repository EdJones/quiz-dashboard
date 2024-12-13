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
                // Clear any previous state
                localStorage.removeItem('authRedirectPending');
                localStorage.removeItem('authRedirectTime');
                this.error = null;
                this.lastRedirectError = null;
                this.isAuthRedirecting = false;

                console.log('[Auth] Starting GitHub sign-in redirect flow');

                const provider = new GithubAuthProvider();
                provider.addScope('user:email');

                // Get the Firebase app instance
                const app = auth.app;

                // Log Firebase config
                console.log('[Auth] Firebase config:', {
                    authDomain: app.options.authDomain,
                    projectId: app.options.projectId,
                    deployedURL: window.location.origin
                });

                // Set production redirect URL
                provider.setCustomParameters({
                    redirect_uri: 'https://quiz-dashboard-alpha.vercel.app'
                });

                // Save state before redirect
                localStorage.setItem('authRedirectPending', 'github');
                localStorage.setItem('authRedirectTime', Date.now().toString());
                console.log('[Auth] Starting GitHub auth redirect...');

                // Try the redirect with explicit error handling
                try {
                    await signInWithRedirect(auth, provider);
                } catch (redirectError) {
                    console.error('[Auth] Immediate redirect error:', {
                        code: redirectError.code,
                        message: redirectError.message,
                        stack: redirectError.stack
                    });
                    throw redirectError;
                }
            } catch (error) {
                console.error('[Auth] Error initiating GitHub redirect:', error);
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

            try {
                console.log('[Auth] Checking redirect result:', {
                    pendingAuth,
                    redirectTime,
                    timeSinceRedirect: redirectTime ? `${(Date.now() - parseInt(redirectTime)) / 1000}s` : 'N/A',
                    currentURL: window.location.href
                });

                const result = await getRedirectResult(auth);
                if (result) {
                    console.log('[Auth] Successfully authenticated:', result.user.email);
                    this.user = result.user;
                    this.isAuthRedirecting = false;
                    localStorage.removeItem('authRedirectPending');
                    localStorage.removeItem('authRedirectTime');
                    return result.user;
                } else if (pendingAuth) {
                    console.log('[Auth] Redirect is pending, checking error state');
                    const error = auth.currentUser?.getIdTokenResult?.()?.error;
                    if (error) {
                        console.error('[Auth] Token error:', error);
                    }
                    this.isAuthRedirecting = true;
                } else {
                    console.log('[Auth] No pending redirect or result');
                    this.isAuthRedirecting = false;
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

        initializeAuthListener() {
            console.log('[Auth] Initializing auth listener');
            auth.onAuthStateChanged((user) => {
                const pendingAuth = localStorage.getItem('authRedirectPending');
                const redirectTime = localStorage.getItem('authRedirectTime');
                console.log('[Auth] State changed:', {
                    user: user ? `${user.email} (${user.uid})` : 'No user',
                    pendingAuth,
                    redirectTime
                });
                this.user = user;
                this.loading = false;
            });
        }
    }
}); 