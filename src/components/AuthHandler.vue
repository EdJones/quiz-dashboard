<template>
    <div class="auth-handler">
        <p>Processing authentication...</p>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
    try {
        await authStore.handleRedirectResult();
        router.push('/');
    } catch (error) {
        console.error('[AuthHandler] Error:', error);
        router.push('/login');
    }
});
</script>

<style scoped>
.auth-handler {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.2em;
    color: #666;
}
</style>