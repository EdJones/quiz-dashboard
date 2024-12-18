<template>
    <div class="create-issue">
        <!-- Notification -->
        <div v-if="notification.show" :class="['notification', notification.type]">
            {{ notification.message }}
            <a v-if="notification.issueUrl" :href="notification.issueUrl" target="_blank">View Issue</a>
        </div>

        <!-- Header Controls -->
        <div class="header-controls">
            <a href="/" class="github-button">
                <svg height="16" viewBox="0 0 16 16" width="16" class="octicon">
                    <path fill="currentColor"
                        d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H6a.75.75 0 0 1 .75.75V14h2.5V9.25A.75.75 0 0 1 10 8.5h2.25a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z">
                    </path>
                </svg>
                <span>Home</span>
            </a>
            <a :href="repoUrl" target="_blank" class="github-button">
                <svg height="16" viewBox="0 0 16 16" width="16" class="octicon">
                    <path fill="currentColor"
                        d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z">
                    </path>
                </svg>
                <span>View on GitHub</span>
            </a>
        </div>



        <!-- Create Issue Form -->
        <div v-if="showForm">
            <div class="form-header">
                <h2>Create GitHub Issue</h2>
                <button @click="toggleForm" class="button-75">
                    {{ showForm ? 'Hide Form' : 'Create New Issue' }}
                </button>
            </div>
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



        <!-- Issues -->
        <h2>Issues</h2>
        <!-- State Filter -->
        <div class="state-filter">
            <div class="filter-buttons">
                <button @click="filterState = 'all'" :class="['filter-button', { active: filterState === 'all' }]">
                    All Issues
                </button>
                <button @click="filterState = 'open'" :class="['filter-button', { active: filterState === 'open' }]">
                    Open
                </button>
                <button @click="filterState = 'closed'"
                    :class="['filter-button', { active: filterState === 'closed' }]">
                    Closed
                </button>
            </div>
            <button @click="toggleForm" class="button-75">
                {{ showForm ? 'Hide New Issue Form' : 'Create New Issue' }}
            </button>
        </div>
        <div class="recent-issues">
            <div v-if="loading" class="loading">Loading issues...</div>
            <div v-else-if="error" class="error">{{ error }}</div>
            <div v-else class="issues-list">
                <div v-for="issue in filteredIssues" :key="issue.id" class="issue-item">
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
                        <div class="issue-meta-group">
                            <span class="issue-meta">#{{ issue.number }} opened {{ formatDate(issue.created_at)
                                }}</span>
                            <span :class="['issue-state', issue.state]">{{ issue.state }}</span>
                        </div>
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
            showForm: false,
            filterState: 'open'
        }
    },
    async created() {
        await this.loadIssues();
    },
    computed: {
        repoUrl() {
            return `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
        },
        filteredIssues() {
            if (this.filterState === 'all') return this.issues;
            return this.issues.filter(issue => issue.state === this.filterState);
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

                // Close the form
                this.showForm = false;

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
    padding: 1rem;
    border: 1px solid #d0d7de;
    border-radius: 4px;
    margin-bottom: 2rem;
}

.issue-form button[type="submit"] {
    align-self: flex-end;
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
    padding: .1rem;
    border: 1px solid #d0d7de;
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
    margin: 0 rem 0;
    color: var(--text-secondary);
    font-size: 0.9em;
    white-space: pre-line;
    line-height: 1.4;
}

.header-controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    justify-content: flex-end;
}

.title-and-labels {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.state-filter {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.filter-buttons {
    display: flex;
    gap: 1.5rem;
}

.filter-button {
    padding: 0;
    border: none;
    background: none;
    color: var(--text-primary);
    cursor: pointer;
    position: relative;
}

.filter-button.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: #2ea44f;
}

.filter-button:hover:not(.active) {
    opacity: 0.8;
}

.issue-meta-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.issue-meta {
    color: var(--text-secondary);
    font-size: 0.875rem;
}

.form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.form-header h2 {
    margin: 0;
}

.github-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 16px;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    white-space: nowrap;
    vertical-align: middle;
    cursor: pointer;
    user-select: none;
    border: 1px solid rgba(31, 35, 40, 0.15);
    border-radius: 6px;
    color: #24292f;
    background-color: #f6f8fa;
    text-decoration: none;
    transition: .2s;
}

.github-button:hover {
    background-color: #f3f4f6;
    border-color: rgba(31, 35, 40, 0.15);
    transition-duration: .1s;
}

.octicon {
    display: inline-block;
    overflow: visible !important;
    vertical-align: text-bottom;
    fill: currentColor;
}
</style>