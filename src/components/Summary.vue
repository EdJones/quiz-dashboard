<template>
    <div class="summary">
        <h3>Summary</h3>
        <button class="button-75" @click="loadSummary">Load Summary</button>

        <div v-if="summaryData" class="summary-content">
            <!-- Summary content will go here -->
            <p>Summary data loaded</p>
        </div>
        <div v-else-if="error" class="error">
            {{ error }}
        </div>
        <div v-else>
            No summary data found
        </div>
    </div>
</template>

<script>
export default {
    name: 'Summary',
    data() {
        return {
            summaryData: null,
            error: null
        }
    },
    methods: {
        async loadSummary() {
            try {
                console.log('Loading summary data...');
                // Add summary loading logic here
            } catch (error) {
                console.error('Error loading summary:', error);
                this.error = error.message;
            }
        }
    }
}
</script>

<style scoped>
.summary {
    margin-top: 1rem;
}

.summary-content {
    margin-top: 1rem;
}

/* Button Styling */
.button-75 {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
    font-weight: 500;
    text-decoration: none;
    display: inline-block;
}

.button-75:hover {
    background-color: var(--hover-bg);
    transform: translateY(-1px);
}

.button-75:active {
    transform: translateY(0);
}

/* Error State */
.error {
    color: #ff4444;
    padding: 1rem;
    border: 1px solid #ff4444;
    border-radius: 4px;
    margin: 1rem 0;
    background-color: rgba(255, 68, 68, 0.1);
}
</style>