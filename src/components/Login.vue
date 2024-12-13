<template>
    <div class="login-container">
        <div v-if="authStore.error" class="error-message">
            {{ authStore.error }}
        </div>

        <div v-if="authStore.isAuthRedirecting" class="loading-message">
            Redirecting to login...
        </div>

        <button @click="handleGoogleLogin" :disabled="authStore.loading || authStore.isAuthRedirecting"
            class="login-button google">
            <font-awesome-icon :icon="['fab', 'google']" />
            Continue with Google
        </button>

        <button @click="handleGithubLogin" :disabled="authStore.loading || authStore.isAuthRedirecting"
            class="login-button github">
            <font-awesome-icon :icon="['fab', 'github']" />
            Continue with GitHub
        </button>
    </div>
</template>

<script setup>
import { useAuthStore } from '../main';

const authStore = useAuthStore();

const handleGoogleLogin = async () => {
    try {
        await authStore.signInWithGoogle();
    } catch (error) {
        // Error is handled in the store
    }
};

const handleGithubLogin = async () => {
    try {
        await authStore.signInWithGithub();
    } catch (error) {
        // Error is handled in the store
    }
};
</script>

<style scoped>
.login-container {
    padding: 20px;
    max-width: 400px;
    margin: 0 auto;
}

.login-button {
    width: 100%;
    padding: 12px;
    margin: 8px 0;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    transition: opacity 0.2s;
}

.login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.login-button.google {
    background-color: white;
    color: #444;
    border: 1px solid #ddd;
}

.login-button.github {
    background-color: #24292e;
    color: white;
}

.error-message {
    color: #d32f2f;
    background-color: #ffebee;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
}

.loading-message {
    text-align: center;
    padding: 12px;
    color: #666;
}
</style>
