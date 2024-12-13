<template>
    <div style="padding: 20px; text-align: center;">
        <h1>Login</h1>
        <div style="margin: 20px;">
            <button style="margin: 10px; padding: 10px 20px; cursor: pointer;" @click="handleGithubLogin">
                Continue with GitHub
            </button>
        </div>
        <div v-if="authStore.error" style="color: red;">
            {{ authStore.error }}
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';
const authStore = useAuthStore();

const handleGithubLogin = () => {
    console.log('GitHub login clicked');
    authStore.signInWithGithub();
};
</script>
