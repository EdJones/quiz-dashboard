<template>
    <div class="summary">
        <h3>Summary</h3>
        <button class="button-75" @click="loadSummary">Load Summary</button>

        <div v-if="summaryData" class="summary-content">
            <div class="summary-card">
                <h4>Quiz Attempts</h4>
                <div class="stat-value">{{ summaryData.totalProgress }}</div>
                <div class="stat-label">Total Attempts</div>
            </div>
            <div class="summary-card">
                <h4>Questions Answered</h4>
                <div class="stat-value">{{ summaryData.totalQuestions }}</div>
                <div class="stat-label">Total Questions</div>
            </div>
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
import { getUserProgress } from '../firebase';

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
                const progress = await getUserProgress();
                const totalQuestions = progress.reduce((sum, attempt) =>
                    sum + (attempt.userAnswers?.length || 0), 0);

                this.summaryData = {
                    totalProgress: progress.length,
                    totalQuestions: totalQuestions
                };
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
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.summary-card {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    min-width: 200px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.summary-card h4 {
    margin: 0 0 1rem 0;
    color: var(--text-secondary);
    font-size: 1rem;
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
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
    margin-bottom: 1rem;
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