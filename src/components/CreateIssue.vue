<template>
    <div class="create-issue">
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

            <button type="submit" class="button-75">Create Issue</button>
        </form>
    </div>
</template>

<script>
export default {
    name: 'CreateIssue',
    data() {
        return {
            issueData: {
                title: '',
                body: '',
                labels: ''
            }
        }
    },
    methods: {
        async submitIssue() {
            try {
                // We'll implement this next
                console.log('Submitting issue:', this.issueData);
            } catch (error) {
                console.error('Error creating issue:', error);
            }
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
</style>