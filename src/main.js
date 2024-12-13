import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons'
import { faCircleMinus } from '@fortawesome/free-solid-svg-icons'
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons'
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { faUserSecret } from '@fortawesome/free-solid-svg-icons'
import { faFlaskVial } from '@fortawesome/free-solid-svg-icons'
import { faPodcast } from '@fortawesome/free-solid-svg-icons'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { faBook } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics only in production
if (import.meta.env.PROD) {
    inject({
        mode: 'production',
        debug: false,
    });
}

//import * as LottiePlayer from "@lottiefiles/lottie-player";
import Vue3Lottie from 'vue3-lottie'

import LiteYouTubeEmbed from 'vue-lite-youtube-embed';
import 'vue-lite-youtube-embed/style.css'

import { auth, signInAnonymouslyWithPersistence, signInWithGoogle, signInWithGithub, analytics } from './firebase';

import {
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    GithubAuthProvider
} from 'firebase/auth';

library.add(faUserSecret)
library.add(faCircleQuestion)
library.add(faCircleMinus)
library.add(faCircleXmark)
library.add(faCircleCheck)
library.add(faCheck)
library.add(faFlaskVial)
library.add(faPodcast)
library.add(faExternalLinkAlt)
library.add(faBook)
library.add(faGoogle)
library.add(faGithub)
const app = createApp(App)
const pinia = createPinia(); // Create a Pinia store instance

app.config.globalProperties.$userAnswers = []
app.use(Vue3Lottie)
app.component(LiteYouTubeEmbed)
app.component('font-awesome-icon', FontAwesomeIcon)

import { createRouter, createWebHistory } from 'vue-router'; // Import the router
//import App from './App.vue'; // Import the main App component
import NewItem from './components/NewItem.vue'; // Import the new component
import Login from './components/Login.vue';
import CreateIssue from './components/CreateIssue.vue';

// Define your routes
const routes = [
    { path: '/', component: App }, // Main application route
    { path: '/new-item', component: NewItem }, // New item route
    { path: '/login', component: Login },
    { path: '/create-issue', component: CreateIssue }
];

// Create the router instance
const router = createRouter({
    history: createWebHistory(),
    routes,
});

app.use(pinia);
app.use(router); // Use the router

// NOW we can import and use the store
import { useAuthStore } from './stores/auth'

// Initialize auth store
const authStore = useAuthStore()

// Initialize auth listener
authStore.initializeAuthListener()

// Handle any pending redirect results
authStore.handleRedirectResult().catch(console.error)

// Add navigation guard
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const publicPages = ['/login'];
    const authRequired = !publicPages.includes(to.path);

    // Wait for initial auth state to be resolved
    if (authStore.loading) {
        // Wait for the auth state to be determined
        await new Promise(resolve => {
            const unsubscribe = auth.onAuthStateChanged(() => {
                unsubscribe();
                resolve();
            });
        });
    }

    if (authRequired && !authStore.user) {
        // Not logged in, redirect to login page
        next('/login');
    } else if (to.path === '/login' && authStore.user) {
        // Already logged in, redirect to home
        next('/');
    } else {
        // Proceed as normal
        next();
    }
});

app.mount('#app')
