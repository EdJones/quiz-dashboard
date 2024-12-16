<template>
    <div>
        <!-- Notification -->
        <div v-if="notification.show" :class="['notification', notification.type]">
            {{ notification.message }}
        </div>

        <!-- Header -->
        <div class="header-controls">
            <h1>Dashboard -- SORQuizzes</h1>
            <div class="header-buttons">
                <router-link to="/create-issue" class="button-75">Create Issue</router-link>
                <button @click="handleLogout" class="button-75">Logout</button>
            </div>
        </div>

        <!-- Test buttons -->
        <div v-if="debug" class="test-controls">
            <button @click="testDatabases" class="button-75">Test Database Connections</button>
            <div v-if="testResults" class="test-results">
                <pre>{{ testResults }}</pre>
            </div>
        </div>

        <!-- Main Dashboard -->
        <h2></h2>

        <!-- Tab Navigation -->
        <div class="tab-container">
            <button class="tab-button" :class="{ active: activeTab === 'progress' }" @click="activeTab = 'progress'">
                User Progress
            </button>
            <button class="tab-button" :class="{ active: activeTab === 'entries' }" @click="activeTab = 'entries'">
                Quiz Entries
            </button>
        </div>

        <!-- User Progress Tab -->
        <div v-if="activeTab === 'progress'" class="user-progress">
            <h3>User Progress</h3>
            <button class="button-75" @click="loadUserProgress">Load User Progress</button>

            <div v-if="userProgressList.length" class="progress-list">
                <div v-for="progress in sortedProgress" :key="progress.id" class="progress-item">
                    <div class="progress-header">
                        <h4>Quiz Attempt Details</h4>
                        <span class="timestamp">{{ formatDate(progress.lastUpdated) }}</span>
                    </div>

                    <div class="progress-details">
                        <div class="id-info">
                            <div>
                                <strong>User ID:</strong> {{ getUserDisplayName(progress.userId) }}
                            </div>
                            <div>
                                <strong>Quiz ID:</strong> {{ progress.quizId }}
                                <span v-if="progress.userAnswers?.length" class="quiz-stats">
                                    ({{ progress.userAnswers.length - progress.incorrectQuestions.length }}
                                    of {{ progress.userAnswers.length }} correct)
                                </span>
                            </div>
                            <div class="quiz-title">
                                {{ getQuizTitle(progress.quizId) }}
                            </div>
                        </div>

                        <div class="detail-row" v-if="progress.incorrectQuestions?.length">
                            <strong>Incorrect Questions:</strong>
                            <ul class="incorrect-list">
                                <li v-for="(q, index) in progress.incorrectQuestions" :key="index">
                                    {{ formatIncorrectQuestion(q) }}
                                </li>
                            </ul>
                        </div>

                        <div class="detail-row">
                            <div class="answers-header" @click="toggleAnswers(progress.id)">
                                <div class="header-info">
                                    <strong>Answers</strong>
                                    <span class="question-count" v-if="progress.userAnswers?.length">
                                        (Question {{ progress.userAnswers.length }})
                                    </span>
                                </div>
                                <button class="toggle-btn">
                                    {{ showAnswersMap[progress.id] ? 'Hide' : 'Show' }}
                                </button>
                            </div>
                            <ul class="answers-list" v-if="showAnswersMap[progress.id]">
                                <li v-for="(answer, index) in progress.userAnswers" :key="index">
                                    Q{{ index + 1 }}: {{ answer }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else-if="error" class="error">
                {{ error }}
            </div>
            <div v-else>
                No user progress found
            </div>
        </div>

        <!-- Quiz Entries Tab -->
        <div v-if="activeTab === 'entries'" class="quiz-entries">
            <h3>Quiz Entries</h3>
            <button class="button-75" @click="loadQuizEntries">Load Quiz Entries</button>

            <div v-if="quizEntriesList.length" class="entries-list">
                <div v-for="entry in sortedEntries" :key="entry.id" class="entry-item">
                    <div class="entry-header">
                        <h4 v-if="entry.originalId">Proposed Edit of quiz-item <strong>{{
                            entry.originalId }}</strong></h4>
                        <h4 v-else>Suggested New Quiz Entry</h4>
                        <span>ID: {{ entry.id }}</span>
                        <span>Quiz ID: {{ entry.quizId }}</span>
                        <span class="timestamp">{{ formatDate(entry.timestamp) }}</span>
                    </div>
                    <div class="entry-details">
                        <div class="detail-row">
                            <strong>Title:</strong> {{ entry.title }}
                        </div>
                        <div class="detail-row">
                            <strong>Question:</strong> {{ getQuestionText(entry) }}
                        </div>
                        <div class="detail-row" v-if="entry.questionP2">
                            <strong>Question Part 2:</strong> {{ entry.questionP2 }}
                        </div>
                        <div class="detail-row">
                            <strong>Answer Type:</strong> {{ entry.answer_type }}
                        </div>
                        <div class="detail-row" v-if="entry.subtitle">
                            <strong>Subtitle:</strong> {{ entry.subtitle }}
                        </div>
                        <div class="detail-row">
                            <strong>Options:</strong>
                            <ul v-if="hasOptions(entry)">
                                <li v-if="entry.option1"
                                    :class="{ 'correct-option': 1 === parseInt(entry.correctAnswer) }">
                                    1. {{ entry.option1 }}
                                </li>
                                <li v-if="entry.option2"
                                    :class="{ 'correct-option': 2 === parseInt(entry.correctAnswer) }">
                                    2. {{ entry.option2 }}
                                </li>
                                <li v-if="entry.option3"
                                    :class="{ 'correct-option': 3 === parseInt(entry.correctAnswer) }">
                                    3. {{ entry.option3 }}
                                </li>
                                <li v-if="entry.option4"
                                    :class="{ 'correct-option': 4 === parseInt(entry.correctAnswer) }">
                                    4. {{ entry.option4 }}
                                </li>
                                <li v-if="entry.option5"
                                    :class="{ 'correct-option': 5 === parseInt(entry.correctAnswer) }">
                                    5. {{ entry.option5 }}
                                </li>
                            </ul>
                        </div>
                        <div class="detail-row">
                            <strong>Correct Answer:</strong> {{ entry.correctAnswer }}
                        </div>

                        <template v-if="entry.originalId">
                            <div class="comparison-header" v-if="hasDifferences(entry)">
                                <h4>Changes from Original:</h4>
                            </div>

                            <template
                                v-for="(field, fieldName) in compareEntries(entry, getOriginalEntry(entry.originalId))"
                                :key="fieldName">
                                <div class="detail-row difference">
                                    <strong>{{ fieldName }}:</strong>
                                    <div class="diff-view">
                                        <div class="original">
                                            <span class="diff-label">Original:</span>
                                            <span class="diff-content">{{ field.original || 'empty' }}</span>
                                        </div>
                                        <div class="draft">
                                            <span class="diff-label">Draft:</span>
                                            <span class="diff-content">{{ field.draft || 'empty' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </template>
                    </div>
                </div>
            </div>
            <div v-else-if="entriesError" class="error">
                {{ entriesError }}
            </div>
            <div v-else>
                No quiz entries found
            </div>
        </div>

        <!-- Dashboard Data Section -->
        <div class="dashboard-data">
            <h3>Dashboard Analytics</h3>
            <button class="button-75" @click="saveDashboardSummary">Save Current Summary</button>
            <div v-if="dashboardSummary" class="summary-display">
                <p>Total Users: {{ dashboardSummary.totalUsers }}</p>
                <p>Total Attempts: {{ dashboardSummary.totalAttempts }}</p>
                <p>Last Updated: {{ formatDate(dashboardSummary.lastUpdated) }}</p>
            </div>
        </div>
    </div>
</template>

<script>
import {
    getQuizAttempts,
    getUserProgress,
    saveDashboardData,
    sorQuizzesDb,
    dashboardDb,
    auth,
    signOutUser
} from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { quizSets } from '../data/quizSets';
import { quizEntries } from '../data/quiz-items';
import { useAuthStore } from '../stores/auth';

export default {
    name: 'Home',
    data() {
        return {
            userProgressList: [],
            dashboardSummary: null,
            error: null,
            showAnswersMap: {},
            userDisplayNames: {
                'zaM4S3yvetUssR68ycGC2rM6mf23': 'Ed Laptop',
                'I7eOVyCifVfll20Nyb5uZrXnYX22': 'Ed iPhone',
                '2MF5B1lDM5U46QZkfcFXEdQtjK83': 'Ed iPhone'
            },
            debug: false,
            testResults: null,
            notification: {
                show: false,
                message: '',
                type: 'success' // or 'error'
            },
            activeTab: 'progress',
            quizEntriesList: [],
            entriesError: null,
            db: sorQuizzesDb
        }
    },
    computed: {
        sortedProgress() {
            return [...this.userProgressList].sort((a, b) => {
                const dateA = a.lastUpdated?.toDate() || new Date(0);
                const dateB = b.lastUpdated?.toDate() || new Date(0);
                return dateB - dateA;
            });
        },
        sortedEntries() {
            return [...this.quizEntriesList].sort((a, b) => {
                const dateA = a.timestamp?.toDate() || new Date(0);
                const dateB = b.timestamp?.toDate() || new Date(0);
                return dateB - dateA;
            });
        }
    },
    mounted() {
        // Remove automatic data loading
        // We'll load data after confirming auth
    },
    async created() {
        const authStore = useAuthStore();

        // Wait for auth to be ready
        if (!authStore.user) {
            console.log('[Home] No authenticated user, redirecting to login');
            this.$router.push('/login');
            return;
        }

        // Only load data if we have an authenticated user
        console.log('[Home] User authenticated, loading data...');
        await this.loadUserProgress();
    },
    methods: {
        async loadUserProgress() {
            try {
                console.log('Loading all user data...');

                // Get all quiz attempts
                const attempts = await getQuizAttempts();
                console.log('Quiz attempts loaded:', attempts.length);

                // Get all user progress
                const progress = await getUserProgress();
                console.log('User progress loaded:', progress.length);

                // Combine the data
                this.userProgressList = [...attempts, ...progress];

            } catch (error) {
                console.error('Error loading data:', error);
                this.error = error.message;
            }
        },

        async saveDashboardSummary() {
            try {
                const summary = {
                    id: 'latest-summary',
                    totalUsers: new Set(this.userProgressList.map(p => p.userId)).size,
                    totalAttempts: this.userProgressList.length,
                    quizDistribution: this.getQuizDistribution(),
                };

                await saveDashboardData(summary);
                this.dashboardSummary = summary;
                console.log('Dashboard summary saved');
            } catch (error) {
                console.error('Error saving dashboard summary:', error);
                this.error = error.message;
            }
        },

        getQuizDistribution() {
            const distribution = {};
            this.userProgressList.forEach(progress => {
                distribution[progress.quizId] = (distribution[progress.quizId] || 0) + 1;
            });
            return distribution;
        },

        formatDate(timestamp) {
            if (!timestamp) return 'No date';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString();
        },

        toggleAnswers(progressId) {
            this.showAnswersMap[progressId] = !this.showAnswersMap[progressId];
            this.showAnswersMap = { ...this.showAnswersMap };
        },

        getUserDisplayName(userId) {
            return this.userDisplayNames[userId] || userId;
        },

        getQuizTitle(quizId) {
            const quiz = quizSets.find(set =>
                set.items.includes(parseInt(quizId))
            );
            return quiz ? quiz.setName : `Quiz ${quizId}`;
        },

        async testDatabases() {
            this.testResults = 'Testing databases...\n';

            try {
                // Test SORQuizzes DB
                const attempts = await getQuizAttempts();
                this.testResults += `✅ SORQuizzes DB: Found ${attempts.length} quiz attempts\n`;

                // Test Dashboard DB
                const testData = {
                    id: 'test-' + Date.now(),
                    message: 'Test data'
                };
                await saveDashboardData(testData);
                this.testResults += '✅ Dashboard DB: Successfully saved test data\n';

            } catch (error) {
                this.testResults += `❌ Error: ${error.message}\n`;
                console.error('Database test error:', error);
            }
        },

        formatIncorrectQuestion(question) {
            if (!question) return '';

            return {
                id: question.id || '',
                title: question.title || '',
                chosenAnswer: question.chosenAnswer || ''
            };
        },

        async handleLogout() {
            try {
                const authStore = useAuthStore();
                await authStore.signOut();
                this.showNotification('Successfully logged out', 'success');
                this.$router.push('/login');
            } catch (error) {
                console.error('Logout error:', error);
                this.showNotification('Error logging out: ' + error.message, 'error');
            }
        },
        showNotification(message, type = 'success') {
            this.notification = {
                show: true,
                message,
                type
            };
            // Hide notification after 3 seconds
            setTimeout(() => {
                this.notification.show = false;
            }, 3000);
        },
        async loadQuizEntries() {
            try {
                console.log('Loading quiz entries...');
                const entriesRef = collection(this.db, 'quizEntries');
                const querySnapshot = await getDocs(entriesRef);

                console.log('Found', querySnapshot.docs.length, 'quiz entries');
                this.quizEntriesList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log('Entry ID:', doc.id);
                    console.log('Question field:', data.question);
                    console.log('Question type:', typeof data.question);
                    console.log('All fields:', Object.keys(data));
                    return {
                        id: doc.id,
                        ...data
                    };
                });
            } catch (error) {
                console.error('Error loading quiz entries:', error);
                this.entriesError = error.message;
            }
        },
        getQuestionText(entry) {
            // Check all possible question field variations
            return entry.question || entry.Question || entry.questionP2 || entry.title || 'No question text found';
        },
        hasOptions(entry) {
            return entry.option1 || entry.option2 || entry.option3 || entry.option4 || entry.option5;
        },
        getOriginalEntry(originalId) {
            return quizEntries.find(entry => entry.id === parseInt(originalId));
        },
        compareEntries(draft, original) {
            const differences = {};
            const fieldsToCompare = [
                'title', 'subtitle', 'Question', 'questionP2',
                'answer_type', 'option1', 'option2', 'option3',
                'option4', 'option5', 'correctAnswer', 'explanation',
                'explanation2', 'caution'
            ];

            fieldsToCompare.forEach(field => {
                if (draft[field] !== original[field] &&
                    (draft[field] || original[field])) { // Only if at least one has a value
                    differences[field] = {
                        draft: draft[field],
                        original: original[field]
                    };
                }
            });

            return differences;
        },
        hasDifferences(entry) {
            if (!entry.originalId) return false;
            const original = this.getOriginalEntry(entry.originalId);
            if (!original) return false;

            const differences = this.compareEntries(entry, original);
            return Object.keys(differences).length > 0;
        }
    }
}
</script>

<style scoped>
/* CSS Variables */
:root {
    --text-primary: #333;
    --text-secondary: #666;
    --bg-primary: #fff;
    --bg-secondary: #f5f5f5;
    --border-color: #ddd;
    --item-bg-color: #f9f9f9;
    --hover-bg: #f0f0f0;
}

@media (prefers-color-scheme: dark) {
    :root {
        --text-primary: #fff;
        --text-secondary: #ccc;
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --border-color: #444;
        --item-bg-color: #2d2d2d;
        --hover-bg: #3d3d3d;
    }
}

/* Progress List Styling */
.progress-list {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.progress-item {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    background-color: var(--item-bg-color, #f9f9f9);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    color: var(--text-color, #333);
}

.progress-item:hover {
    background-color: var(--hover-bg);
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
}

.detail-row {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    align-items: flex-start;
}

.id-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.quiz-title {
    font-style: italic;
    color: var(--text-secondary);
}

.quiz-stats {
    color: var(--text-secondary);
    margin-left: 0.5rem;
}

.timestamp {
    color: var(--text-secondary);
    font-size: 0.9em;
}

/* Answers Section */
.answers-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 0.5rem 0;
}

.header-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.question-count {
    color: var(--text-secondary);
    font-size: 0.9em;
}

.answers-list {
    list-style: none;
    padding-left: 1rem;
    margin-top: 0.5rem;
}

.incorrect-list {
    list-style: none;
    padding-left: 1rem;
    margin-top: 0.5rem;
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

.toggle-btn {
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.9em;
}

/* Test Controls */
.test-controls {
    margin: 1rem 0;
    padding: 1rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
}

.test-results {
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-family: monospace;
    white-space: pre-wrap;
    color: var(--text-primary);
}

/* Dashboard Data */
.dashboard-data {
    margin-top: 2rem;
    padding: 1.5rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
}

.summary-display {
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--item-bg-color);
    border-radius: 4px;
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

/* Responsive Design */
@media (max-width: 768px) {
    .progress-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .button-75 {
        width: 100%;
        margin-bottom: 0.5rem;
    }
}

/* Header Controls */
.header-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

/* Add notification styles */
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

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;

        .tab-container {
            display: flex;
            gap: 10px;
            margin: 20px auto;
            max-width: 800px;
        }

        .tab-button {
            padding: 10px 20px;
            border: 1px solid var(--border-color, #ccc);
            border-radius: 4px;
            background-color: var(--bg-color, #fff);
            color: var(--text-color, #333);
            cursor: pointer;
            flex: 1;
            max-width: 200px;
        }

        .tab-button.active {
            background-color: var(--btn-bg-color, #007bff);
            color: white;
            border-color: var(--btn-bg-color, #007bff);
        }

        .tab-button:hover {
            background-color: var(--btn-hover-bg-color, #0056b3);
            color: white;
        }

        .entries-list {
            margin: 20px;
            padding: 20px;
            border: 1px solid var(--border-color, #ccc);
            border-radius: 8px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }

        .entry-item {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid var(--border-color, #ddd);
            border-radius: 8px;
            background-color: var(--item-bg-color, #f9f9f9);
        }

        .entry-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-color, #eee);
        }

        .entry-details {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        /* Add dark mode support */
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #1a1a1a;
                --item-bg-color: #2d2d2d;
                --text-color: #e0e0e0;
                --muted-color: #a0a0a0;
                --border-color: #333;
                --btn-bg-color: #333;
                --btn-hover-bg-color: #555;
            }
        }
    }
}

.header-buttons {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.quiz-entries {
    margin-top: 1rem;
}

.entries-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.entry-item {
    padding: 1rem;
    border: 1px solid #d0d7de;
    border-radius: 4px;
    background-color: var(--bg-primary);
}

.entry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #d0d7de;
}

.entry-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.detail-row {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    align-items: flex-start;
}

.detail-row strong {
    color: var(--text-secondary);
    font-size: 0.875rem;
    min-width: 120px;
}

.detail-row ul {
    margin: 0.5rem 0;
    padding-left: 0;
    list-style: none;
}

.detail-row li {
    margin-bottom: 0.25rem;
    display: flex;
    align-items: flex-start;
}

h1 {
    font-size: 2rem;
    font-weight: bold;
}

.comparison-header {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #d0d7de;
}

.difference {
    background-color: #f6f8fa;
    padding: 0.75rem;
    border-radius: 4px;
    margin: 0.5rem 0;
}

.diff-view {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.original,
.draft {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
}

.diff-label {
    font-size: 0.75rem;
    color: #57606a;
    min-width: 60px;
}

.diff-content {
    flex: 1;
}

.original .diff-content {
    color: #cf222e;
    text-decoration: line-through;
}

.draft .diff-content {
    color: #116329;
}

.correct-option {
    background-color: rgba(127, 255, 212, 0.3);
    /* Lighter aquamarine with transparency */
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    margin-left: -0.5rem;
    /* Compensate for padding */
    margin-right: -0.5rem;
}
</style>