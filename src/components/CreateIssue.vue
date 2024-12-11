<template>
    <div class="create-issue">
        <!-- Notification -->
        <div v-if="notification.show" :class="['notification', notification.type]">
            {{ notification.message }}
            <a v-if="notification.issueUrl" :href="notification.issueUrl" target="_blank">View Issue</a>
        </div>

        <!-- Header Controls -->
        <div class="header-controls">
            <button @click="toggleForm" class="button-75">
                {{ showForm ? 'Hide Form' : 'Create New Issue' }}
            </button>
            <a :href="repoUrl" target="_blank" class="button-75">Go to Repository</a>
        </div>

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
                        <div class="title-and-labels">
                            <h4>
                                <a :href="issue.html_url" target="_blank">{{ issue.title }}</a>
                            </h4>
                            <div class="issue-labels" v-if="issue.labels.length">
                                <span v-for="label in issue.labels" :key="label.id" class="label">
                                    {{ label.name }}
                                </span>
                            </div>
                        </div>
                        <span :class="['issue-state', issue.state]">{{ issue.state }}</span>
                    </div>
                    <div class="issue-meta">
                        #{{ issue.number }} opened {{ formatDate(issue.created_at) }}
                    </div>
                    <div class="issue-body-preview" v-if="issue.body">
                        {{ getBodyPreview(issue.body) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { createGithubIssue, getGithubIssues, REPO_OWNER, REPO_NAME } from '../services/github';

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
    computed: {
        repoUrl() {
            return `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
        }
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
                console.log('Labels:', this.issues.map(issue => ({
                    title: issue.title,
                    labels: issue.labels.map(label => ({
                        name: label.name,
                        color: `#${label.color}`
                    }))
                })));
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
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 12px;
    font-size: 0.875rem;
}

.issue-state.open {
    background-color: #2ea44f;
    color: white;
    border: 1px solid #2ea44f;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    height: 20px;



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
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    font-size: 0.75rem;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #cbd2db;
    background-color: #6b717b;
    border: 1px solid #9da7b0;
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

.header-controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.title-and-labels {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
}
</style>