import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('./components/Home.vue')
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('./components/Login.vue')
        },
        // Add a catch-all route for the auth handler
        {
            path: '/__/auth/handler',
            name: 'auth-handler',
            component: () => import('./components/AuthHandler.vue')
        }
    ]
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

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

    next();
})

export default router 