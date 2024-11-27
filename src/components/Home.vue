<template>
    <div>
        <h1>Admin Dashboard</h1>
        <div class="admin-dashboard">
            <div class="user-progress">
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
                                <strong>User ID:</strong> {{ progress.userId }}
                            </div>
                            <div class="detail-row">
                                <strong>Quiz ID:</strong> {{ progress.quizId }}
                            </div>
                            <div class="detail-row">
                                <div class="answers-header" @click="toggleAnswers(progress.id)">
                                    <strong>Answers</strong>
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
                            <div class="detail-row" v-if="progress.incorrectQuestions?.length">
                                <strong>Incorrect Questions:</strong>
                                <ul class="incorrect-list">
                                    <li v-for="(q, index) in progress.incorrectQuestions" :key="index">
                                        {{ q }}
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
        </div>
    </div>
</template>

<script>
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore'

export default {
    name: 'Home',
    data() {
        return {
            userProgressList: [],
            error: null,
            db: getFirestore(),
            showAnswersMap: {}
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
        }
    }
}
</script>

<style>
.progress-list {
    margin: 20px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.progress-item {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
    color: #333;
}

.timestamp {
    color: #666;
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
    color: #555;
    min-width: 120px;
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
    background-color: #e9ecef;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9em;
    cursor: pointer;
}

.toggle-btn:hover {
    background-color: #dee2e6;
}

.answers-list {
    margin-top: 8px;
    padding-left: 20px;
    border-left: 2px solid #e9ecef;
}
</style>
