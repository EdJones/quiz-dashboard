<template>
    <div>
        <h2>Quizzes Dashboard</h2>
        <div class="tab-container">
            <button class="tab-button" :class="{ active: activeTab === 'progress' }" @click="activeTab = 'progress'">
                User Progress
            </button>
            <button class="tab-button" :class="{ active: activeTab === 'entries' }" @click="activeTab = 'entries'">
                Quiz Entries
            </button>
        </div>
        <div class="admin-dashboard">
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
                            <div class="detail-row">
                                <div class="id-info">
                                    <div>
                                        <strong>User ID:</strong>
                                        {{ getUserDisplayName(progress.userId) }}
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
                            <div class="detail-row" v-if="entry.timestamp">
                                <strong>Timestamp:</strong> {{ formatDate(entry.timestamp) }}
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
        </div>
    </div>
</template>

<script>
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { quizSets } from '../data/quizSets.js';

export default {
    name: 'Home',
    data() {
        return {
            userProgressList: [],
            error: null,
            db: getFirestore(),
            showAnswersMap: {},
            userDisplayNames: {
                'zaM4S3yvetUssR68ycGC2rM6mf23': 'Ed Laptop',
                'I7eOVyCifVfll20Nyb5uZrXnYX22': 'Ed iPhone',
                '2MF5B1lDM5U46QZkfcFXEdQtjK83': 'Ed iPhone'
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
                console.log('Loading user progress...');
                const progressRef = collection(this.db, 'quizAttempts');
                const q = query(progressRef, orderBy('lastUpdated', 'desc'));
                const querySnapshot = await getDocs(q);

                console.log('Found', querySnapshot.docs.length, 'progress records');
                this.userProgressList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.error('Error loading user progress:', error);
                this.error = error.message;
            }
        },
        formatDate(timestamp) {
            if (!timestamp) return 'No date';
            const date = timestamp.toDate();
            return date.toLocaleString();
        },
        toggleAnswers(progressId) {
            this.showAnswersMap[progressId] = !this.showAnswersMap[progressId];
            this.showAnswersMap = { ...this.showAnswersMap };
        },
        getUserDisplayName(userId) {
            return this.userDisplayNames[userId] || userId;
        },
        formatIncorrectQuestion(question) {
            try {
                const q = typeof question === 'string' ? JSON.parse(question) : question;
                return `Q${q.id}: ${q.title} (Answered: ${q.chosenAnswer})`;
            } catch (e) {
                return question; // Fallback to original format if parsing fails
            }
        },
        getQuizTitle(quizId) {
            const quiz = quizSets.find(set =>
                set.items.includes(parseInt(quizId))
            );
            if (quiz) {
                return quiz.setName;
            }
            return `Quiz ${quizId}`;
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

<style>
.progress-list {
    margin: 20px;
    padding: 20px;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 8px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    background-color: var(--bg-color, #fff);
    color: var(--text-color, #333);
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

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.progress-header h4 {
    margin: 0;
    color: var(--text-color, #333);
}

.timestamp {
    color: var(--muted-color, #666);
    font-size: 0.9em;
}

.progress-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.detail-row {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.detail-row strong {
    color: var(--text-color, #555);
    display: block;
    margin-bottom: 8px;
}

.answers-list,
.incorrect-list {
    list-style: none;
    padding-left: 20px;
    margin: 5px 0;
}

.answers-list li,
.incorrect-list li {
    margin: 3px 0;
    padding: 3px 0;
}

.error {
    color: #dc3545;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #dc3545;
    border-radius: 4px;
    background-color: #fff;
}

.button-75 {
    margin: 10px 0;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.button-75:hover {
    background-color: #0056b3;
}

.answers-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    cursor: pointer;
    user-select: none;
}

.answers-header:hover {
    background-color: #f0f0f0;
}

.toggle-btn {
    padding: 4px 8px;
    background-color: var(--btn-bg-color, #e9ecef);
    border: 1px solid var(--border-color, #ced4da);
    border-radius: 4px;
    font-size: 0.9em;
    cursor: pointer;
    color: var(--text-color, #333);
}

.toggle-btn:hover {
    background-color: var(--btn-hover-bg-color, #dee2e6);
}

.answers-list {
    margin-top: 8px;
    padding-left: 20px;
    border-left: 2px solid #e9ecef;
}

.answers-header .header-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.question-count {
    color: var(--muted-color, #666);
    font-size: 0.9em;
    font-weight: normal;
}

.id-info {
    display: flex;
    gap: 20px;
    align-items: baseline;
}

.id-info>div {
    display: flex;
    gap: 8px;
    align-items: baseline;
}

.incorrect-list {
    list-style: none;
    padding-left: 20px;
    margin: 5px 0;
    border-left: 2px solid #e9ecef;
}

.incorrect-list li {
    margin: 8px 0;
    padding: 8px 12px;
    background-color: var(--item-bg-color, #fff);
    border: 1px solid var(--border-color, #e9ecef);
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    line-height: 1.4;
    color: var(--text-color, #333);
}

.quiz-stats {
    color: var(--muted-color, #666);
    font-size: 0.9em;
    margin-left: 8px;
}

.quiz-title {
    margin-top: 8px;
    font-weight: 500;
    color: var(--text-color, #333);
}

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
</style>
