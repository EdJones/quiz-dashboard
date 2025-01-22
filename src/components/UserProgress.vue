<template>
    <div class="user-progress">
        <div class="control-buttons">
            <button class="button-75" @click="loadUserProgress">Refresh</button>
            <button class="button-75" @click="toggleTestUsers">
                {{ includeTestUsers ? 'Hide Test Users' : 'Show Test Users' }}
            </button>
        </div>

        <div v-if="userProgressList.length" class="progress-list">
            <div v-for="progress in sortedProgress" :key="progress.id" class="progress-item">
                <div class="progress-header">
                    <p class="progress-header-text">
                        <span class="timestamp">{{ formatDate(progress.lastUpdated) }}</span><br>
                        User {{ getUserDisplayName(progress.userId) }}<br>
                        Quiz {{ progress.quizId }} - {{ getQuizTitle(progress.quizId) }}<br>
                        ({{ getCorrectAnswerCount(progress) }} of {{ progress.userAnswers?.length || 0 }} correct)<br>
                    </p>
                </div>

                <div class="progress-details">
                    <!-- Feedback section -->
                    <div class="detail-row feedback-section" v-if="progress.feedback">
                        <strong>Feedback:</strong> {{ progress.feedback }}
                    </div>

                    <!-- Answers section -->
                    <div class="detail-row2">
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

                        <!-- Show either the table or the list based on showAnswersMap -->
                        <div v-if="showAnswersMap[progress.id]">
                            <table class="incorrect-table">
                                <thead>
                                    <tr>
                                        <th>QuizItem</th>
                                        <th>Question</th>
                                        <th>Answer Chosen</th>
                                        <th>Answer Text</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(answer, index) in progress.userAnswers" :key="index"
                                        :class="{ 'incorrect-answer': isAnswerIncorrect(answer.questionId, answer.selected) }">
                                        <td>{{ answer.questionId || 'N/A' }}</td>
                                        <td>{{ answer.questionTitle || 'N/A' }} <br>
                                            {{ getQuestionFromQuizEntries(answer.questionId) || 'N/A' }}</td>
                                        <td>{{ answer.selected || 'N/A' }}</td>
                                        <td>{{ getAnswerText(answer.questionId, answer.selected) || 'N/A' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
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
</template>

<script>
import { getQuizAttempts, getUserProgress } from '../firebase';
import { quizSets } from '../data/quizSets';
import { quizEntries } from '../data/quiz-items';

const TEST_USER_IDS = [
    'zaM4S3yvetUssR68ycGC2rM6mf23',  // Ed Laptop
    'I7eOVyCifVfll20Nyb5uZrXnYX22',  // Ed iPhone
    '2MF5B1lDM5U46QZkfcFXEdQtjK83',  // Ed iPhone
    'KmfQrAykhVdK17QbOxSM2RwZdeB3',  // localhost - ed
    '3MbjAzyDZqXtrmE5AclsIiWy3hX2',  // vercel - ed
    '6wV6GSAkLNUMIxostc4pjQ5AWzx1'  // vercel - ed
];

export default {
    name: 'UserProgress',
    data() {
        return {
            userProgressList: [],
            allProgress: [],
            error: null,
            showAnswersMap: {},
            includeTestUsers: false,
            userDisplayNames: {
                'zaM4S3yvetUssR68ycGC2rM6mf23': 'Ed Laptop',
                'I7eOVyCifVfll20Nyb5uZrXnYX22': 'Ed iPhone',
                '2MF5B1lDM5U46QZkfcFXEdQtjK83': 'Ed iPhone',
                'KmfQrAykhVdK17QbOxSM2RwZdeB3': 'localhost - ed'
            }
        }
    },
    computed: {
        sortedProgress() {
            return [...this.userProgressList].sort((a, b) => {
                const dateA = a.lastUpdated?.toDate() || new Date(0);
                const dateB = b.lastUpdated?.toDate() || new Date(0);
                return dateB - dateA;
            });
        }
    },
    methods: {
        async loadUserProgress() {
            try {
                console.log('Loading all user data...');
                const progress = await getUserProgress();
                this.allProgress = progress;
                this.filterProgress();
            } catch (error) {
                console.error('Error loading data:', error);
                this.error = error.message;
            }
        },
        filterProgress() {
            this.userProgressList = this.includeTestUsers
                ? [...this.allProgress]
                : this.allProgress.filter(p => !TEST_USER_IDS.includes(p.userId));
            console.log('User progress loaded:', this.userProgressList.length);
        },
        toggleTestUsers() {
            this.includeTestUsers = !this.includeTestUsers;
            this.filterProgress();
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
        getAnswerText(questionId, selectedNumber) {
            if (!questionId || !selectedNumber) return null;
            const quizItem = quizEntries.find(item => item.id === questionId);
            if (!quizItem) return null;
            const optionKey = `option${selectedNumber}`;
            return quizItem[optionKey];
        },
        getQuestionFromQuizEntries(questionId) {
            if (!questionId) return null;
            const quizItem = quizEntries.find(item => item.id === questionId);
            return quizItem?.Question || null;
        },
        isAnswerIncorrect(questionId, selectedAnswer) {
            if (!questionId || !selectedAnswer) return false;
            const quizItem = quizEntries.find(item => item.id === questionId);
            return quizItem && parseInt(quizItem.correctAnswer) !== parseInt(selectedAnswer);
        },
        getCorrectAnswerCount(progress) {
            const totalAnswers = progress.userAnswers?.length || 0;
            const incorrectCount = progress.incorrectQuestions?.length || 0;
            return totalAnswers - incorrectCount;
        }
    },
    mounted() {
        this.loadUserProgress();
    }
}
</script>

<style scoped>
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

.progress-header-text {
    text-align: left;
    font-size: 0.9rem;
}

.detail-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
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

.answers-list li {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background-color: var(--bg-secondary);
    border-radius: 4px;
    border: 1px solid var(--border-color);
}

.answers-list li:last-child {
    margin-bottom: 0;
}

.answers-list li:hover {
    background-color: var(--hover-bg);
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

/* Table Styling */
.incorrect-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 0.5rem;
    margin-top: 0.25rem;
    font-size: 0.9rem;
}

.incorrect-table th,
.incorrect-table td {
    padding: 0.35rem;
    text-align: left;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
}

.incorrect-table th {
    background-color: var(--bg-secondary);
    font-weight: bold;
}

.incorrect-table tr:nth-child(even) {
    background-color: var(--bg-secondary);
}

.incorrect-table tr:hover {
    background-color: var(--hover-bg);
}

.incorrect-answer {
    background-color: rgba(255, 0, 0, 0.1) !important;
    color: #dc3545;
}

/* Add rounded corners to cells */
.incorrect-table tr td:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
}

.incorrect-table tr td:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
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

.control-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

@media (max-width: 768px) {
    .progress-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .progress-header-text {
        font-size: x-small;
        text-align: left;
    }

    .button-75 {
        width: 100%;
        margin-bottom: 0.5rem;
    }

    .control-buttons {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>