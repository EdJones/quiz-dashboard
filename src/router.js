import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('./components/Home.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('./components/Login.vue')
        },
        {
            path: '/__/auth/handler',
            name: 'auth-handler',
            component: () => import('./components/AuthHandler.vue')
        }
    ]
})

// Initialize auth store
const authStore = useAuthStore()

// Navigation guard
router.beforeEach(async (to, from, next) => {
    // Wait for auth to be ready before first navigation
    if (!authStore.isAuthReady) {
        console.log('[Router] Waiting for auth to initialize...');
        await authStore.initializeAuthListener();
    }

    // Handle auth redirects
    if (to.path.startsWith('/__/auth')) {
        console.log('[Router] Handling auth callback');
        try {
            await authStore.handleRedirectResult();
            next('/');
        } catch (error) {
            console.error('[Router] Auth redirect error:', error);
            next('/login');
        }
        return;
    }

    // Check if route requires auth
    if (to.matched.some(record => record.meta.requiresAuth)) {
        // Check if user is logged in
        if (!authStore.user) {
            console.log('[Router] Unauthenticated user attempting to access:', to.path);
            next('/login');
            return;
        }
    }

    next();
})

export default router 