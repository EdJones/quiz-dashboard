<template>
    <div class="create-issue">
        <!-- Notification -->
        <div v-if="notification.show" :class="['notification', notification.type]">
            {{ notification.message }}
            <a v-if="notification.issueUrl" :href="notification.issueUrl" target="_blank">View Issue</a>
        </div>

        <!-- Toggle Button -->
        <button @click="toggleForm" class="button-75">
            {{ showForm ? 'Hide Form' : 'Create New Issue' }}
        </button>

        <!-- Create Issue Form -->
        <div v-if="showForm">
            <h2>Create GitHub Issue</h2>
            <form @submit.prevent="submitIssue" class="issue-form">
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input id="title" v-model="issueData.title" type="text" required placeholder="Issue title" />
                </div>

                <div class="form-group">
                    <label for="body">Description:</label>
                    <textarea id="body" v-model="issueData.body" required placeholder="Describe the issue..."
                        rows="5"></textarea>
                </div>

                <div class="form-group">
                    <label for="labels">Labels:</label>
                    <input id="labels" v-model="issueData.labels" type="text"
                        placeholder="bug, enhancement (comma separated)" />
                </div>

                <button type="submit" class="button-75" :disabled="isSubmitting">
                    {{ isSubmitting ? 'Creating...' : 'Create Issue' }}
                </button>
            </form>
        </div>

        <!-- Recent Issues -->
        <div class="recent-issues">
            <h3>Recent Issues</h3>
            <div v-if="loading" class="loading">Loading issues...</div>
            <div v-else-if="error" class="error">{{ error }}</div>
            <div v-else class="issues-list">
                <div v-for="issue in issues" :key="issue.id" class="issue-item">
                    <div class="issue-header">
                        <h4>
                            <a :href="issue.html_url" target="_blank">{{ issue.title }}</a>
                        </h4>
                        <span :class="['issue-state', issue.state]">{{ issue.state }}</span>
                    </div>
                    <div class="issue-meta">
                        #{{ issue.number }} opened {{ formatDate(issue.created_at) }}
                    </div>
                    <div class="issue-body-preview" v-if="issue.body">
                        {{ getBodyPreview(issue.body) }}
                    </div>
                    <div class="issue-labels" v-if="issue.labels.length">
                        <span v-for="label in issue.labels" :key="label.id" class="label"
                            :style="{ backgroundColor: `#${label.color}` }">
                            {{ label.name }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { createGithubIssue, getGithubIssues } from '../services/github';

export default {
    name: 'CreateIssue',
    data() {
        return {
            issueData: {
                title: '',
                body: '',
                labels: ''
            },
            isSubmitting: false,
            error: null,
            notification: {
                show: false,
                message: '',
                type: 'success',
                issueUrl: null
            },
            issues: [],
            loading: false,
            showForm: false
        }
    },
    async created() {
        await this.loadIssues();
    },
    methods: {
        toggleForm() {
            this.showForm = !this.showForm;
        },
        async submitIssue() {
            this.isSubmitting = true;
            this.error = null;

            try {
                // Get the GitHub access token from localStorage
                const token = localStorage.getItem('github_token');
                if (!token) {
                    throw new Error('No GitHub access token available');
                }

                const result = await createGithubIssue(this.issueData, token);
                console.log('Issue created:', result);
                // Show success notification
                this.showNotification('Issue created successfully!', 'success', result.html_url);

                // Clear the form
                this.issueData = {
                    title: '',
                    body: '',
                    labels: ''
                };

                // Reload issues list
                await this.loadIssues();
            } catch (error) {
                console.error('Error submitting issue:', error);
                this.showNotification(error.message, 'error');
            } finally {
                this.isSubmitting = false;
            }
        },
        async loadIssues() {
            this.loading = true;
            this.error = null;

            try {
                const token = localStorage.getItem('github_token');
                if (!token) {
                    throw new Error('No GitHub access token available');
                }

                this.issues = await getGithubIssues(token);
            } catch (error) {
                console.error('Error loading issues:', error);
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },
        showNotification(message, type = 'success', issueUrl = null) {
            this.notification = {
                show: true,
                message,
                type,
                issueUrl
            };
            setTimeout(() => {
                this.notification.show = false;
            }, 5000);
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString();
        },
        getBodyPreview(body) {
            // Get first two lines, limited to 200 characters
            const preview = body.split('\n').slice(0, 2).join('\n');
            return preview.length > 200 ? preview.substring(0, 200) + '...' : preview;
        }
    }
}
</script>

<style scoped>
.create-issue {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1rem;
}

.issue-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

label {
    font-weight: 500;
    color: var(--text-primary);
}

input,
textarea {
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

input:focus,
textarea:focus {
    outline: none;
    border-color: #0366d6;
}

button {
    align-self: flex-start;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 2rem;
    border-radius: 4px;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
}

.notification.success {
    background-color: #4caf50;
    color: white;
}

.notification.error {
    background-color: #f44336;
    color: white;
}

.notification a {
    color: white;
    text-decoration: underline;
    margin-left: 1rem;
}

.recent-issues {
    margin-top: 3rem;
}

.issues-list {
    margin-top: 1rem;
}

.issue-item {
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    margin-bottom: 1rem;
    background-color: var(--bg-primary);
}

.issue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.issue-state {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
}

.issue-state.open {
    background-color: #2ea44f;
    color: white;
}

.issue-state.closed {
    background-color: #8250df;
    color: white;
}

.issue-meta {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-top: 0.5rem;
}

.issue-labels {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.label {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    color: white;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
}

.error {
    color: #f44336;
    padding: 1rem;
    border: 1px solid #f44336;
    border-radius: 4px;
    margin: 1rem 0;
}

.issue-body-preview {
    margin: 0.75rem 0;
    color: var(--text-secondary);
    font-size: 0.9em;
    white-space: pre-line;
    line-height: 1.4;
}
</style>