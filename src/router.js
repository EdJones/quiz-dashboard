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
            path: '/create-issue',
            name: 'create-issue',
            component: () => import('./components/CreateIssue.vue'),
            meta: { requiresAuth: true }
        }
    ]
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
    try {
        const authStore = useAuthStore();
        console.log('[Router] Auth store:', authStore);

        // Wait for auth to be ready
        if (!authStore.isAuthReady) {
            console.log('[Router] Waiting for auth to initialize...');
            await authStore.initializeAuthListener();
        }

        // Check if route requires auth
        const publicPages = ['/login'];
        const authRequired = !publicPages.includes(to.path);

        if (authRequired && !authStore.user) {
            console.log('[Router] Auth required, redirecting to login');
            next('/login');
        } else {
            next();
        }
    } catch (error) {
        console.error('[Router] Navigation error:', error);
        next('/login');
    }
});

export default router 