<template>
    <div>
        <!-- Notification -->
        <div v-if="notification.show" :class="['notification', notification.type]">
            {{ notification.message }}
        </div>

        <!-- Header -->
        <div class="header-controls">
            <h1>Admin Dashboard</h1>
            <button @click="handleLogout" class="button-75">Logout</button>
        </div>

        <!-- Test buttons -->
        <div v-if="debug" class="test-controls">
            <button @click="testDatabases" class="button-75">Test Database Connections</button>
            <div v-if="testResults" class="test-results">
                <pre>{{ testResults }}</pre>
            </div>
        </div>

        <!-- Main Dashboard -->
        <h2>Quizzes Dashboard</h2>

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
                        <h4>Quiz Entry Details</h4>
                        <span class="timestamp">{{ formatDate(entry.timestamp) }}</span>
                    </div>
                    <div class="entry-details">
                        <div class="detail-row">
                            <strong>Quiz ID:</strong> {{ entry.quizId }}
                        </div>
                        <div class="detail-row">
                            <strong>Question:</strong> {{ getQuestionText(entry) }}
                        </div>
                        <div class="detail-row">
                            <strong>Title:</strong> {{ entry.title }}
                        </div>
                        <div class="detail-row" v-if="entry.subtitle">
                            <strong>Subtitle:</strong> {{ entry.subtitle }}
                        </div>
                        <div class="detail-row">
                            <strong>Options:</strong>
                            <ul v-if="hasOptions(entry)">
                                <li v-if="entry.option1">1. {{ entry.option1 }}</li>
                                <li v-if="entry.option2">2. {{ entry.option2 }}</li>
                                <li v-if="entry.option3">3. {{ entry.option3 }}</li>
                                <li v-if="entry.option4">4. {{ entry.option4 }}</li>
                                <li v-if="entry.option5">5. {{ entry.option5 }}</li>
                            </ul>
                        </div>
                        <div class="detail-row">
                            <strong>Correct Answer:</strong> {{ entry.correctAnswer }}
                        </div>
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
import { quizSets } from '../data/quizSets';

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
            entriesError: null
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
        this.loadUserProgress();
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
                await signOutUser();
                this.showNotification('Successfully logged out', 'success');
                // Router will handle redirect based on auth state
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
    margin: 1rem 0;
    color: var(--text-primary);
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
</style>
