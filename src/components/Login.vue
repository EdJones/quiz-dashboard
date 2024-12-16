<template>
    <div class="login-container">
        <div class="auth-status">
            <h2>Authentication Status</h2>
            <div v-if="loading" class="status loading">
                Checking authentication...
            </div>
            <div v-else-if="authStore.user" class="status authenticated">
                <p>✅ Authenticated as: {{ authStore.user.email }}</p>
                <button class="button-75" @click="handleLogout">Logout</button>
                <router-link to="/" class="button-75">Go to Dashboard</router-link>
            </div>
            <div v-else class="status unauthenticated">
                <p>❌ Not authenticated</p>
                <div class="oauth-buttons">
                    <button class="button-75 google-btn" @click="handleGoogleSignIn">
                        <font-awesome-icon :icon="['fab', 'google']" /> Sign in with Google
                    </button>
                    <button class="button-75 github-btn" @click="handleGithubSignIn">
                        <font-awesome-icon :icon="['fab', 'github']" /> Sign in with GitHub
                    </button>
                </div>
            </div>
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
            error: null,
            loading: true
        }
    },
    computed: {
        authStore() {
            return useAuthStore();
        }
    },
    async created() {
        // Wait for auth to initialize
        try {
            if (!this.authStore.isAuthReady) {
                await this.authStore.initializeAuthListener();
            }
        } finally {
            this.loading = false;
        }
    },
    methods: {
        async handleGoogleSignIn() {
            try {
                this.error = null;
                await this.authStore.signInWithGoogle();
                this.$router.push('/');
            } catch (error) {
                this.error = error.message;
            }
        },
        async handleGithubSignIn() {
            try {
                this.error = null;
                await this.authStore.signInWithGithub();
                this.$router.push('/');
            } catch (error) {
                this.error = error.message;
            }
        },
        async handleLogout() {
            try {
                this.error = null;
                await this.authStore.signOut();
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

.auth-status {
    margin-bottom: 2rem;
    padding: 1rem;
    border-radius: 8px;
    background-color: var(--bg-secondary, #f5f5f5);
}

.status {
    margin: 1rem 0;
    padding: 1rem;
    border-radius: 4px;
}

.loading {
    color: #666;
    font-style: italic;
}

.authenticated {
    background-color: rgba(75, 181, 67, 0.1);
    color: #4bb543;
}

.unauthenticated {
    background-color: rgba(255, 68, 68, 0.1);
    color: #ff4444;
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
    margin: 10px 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.1s ease;
}

.button-75:hover {
    transform: translateY(-1px);
}

.button-75:active {
    transform: translateY(0);
}

.google-btn {
    background: #4285f4;
    color: white;
}

.github-btn {
    background: #24292e;
    color: white;
}

.error-message {
    margin-top: 1rem;
    padding: 1rem;
    background-color: rgba(255, 68, 68, 0.1);
    color: #ff4444;
    border-radius: 4px;
}

a.button-75 {
    text-decoration: none;
    background: #42b983;
    color: white;
}
</style>
