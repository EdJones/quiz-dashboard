<template>
    <div class="login-container">
        <h2>Sign In</h2>
        <div class="oauth-buttons">
            <button class="button-75 google-btn" @click="handleGoogleSignIn">
                <font-awesome-icon :icon="['fab', 'google']" /> Sign in with Google
            </button>
            <button class="button-75 github-btn" @click="handleGithubSignIn">
                <font-awesome-icon :icon="['fab', 'github']" /> Sign in with GitHub
            </button>
        </div>
        <div v-if="error" class="error-message">
            {{ error }}
        </div>
    </div>
</template>

<script>
import { useAuthStore } from '../stores/auth';

export default {
    data() {
        return {
            error: null
        }
    },
    methods: {
        async handleGoogleSignIn() {
            try {
                const authStore = useAuthStore();
                await authStore.signInWithGoogle();
                this.$router.push('/');
            } catch (error) {
                this.error = error.message;
            }
        },
        async handleGithubSignIn() {
            try {
                const authStore = useAuthStore();
                await authStore.signInWithGithub();
                this.$router.push('/');
            } catch (error) {
                this.error = error.message;
            }
        }
    }
}
</script>

<style scoped>
.login-container {
    max-width: 400px;
    margin: 40px auto;
    padding: 20px;
    text-align: center;
}

.oauth-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 20px;
}

.button-75 {
    width: 100%;
    padding: 12px 20px;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.google-btn {
    background: #4285f4;
    color: white;
}

.github-btn {
    background: #24292e;
    color: white;
}

.anonymous-btn {
    background: #6c757d;
    color: white;
}

.error-message {
    margin-top: 20px;
    color: #dc3545;
    padding: 10px;
    border: 1px solid #dc3545;
    border-radius: 4px;
}
</style>
