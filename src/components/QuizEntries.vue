<template>
    <div class="quiz-entries">
        <h3>Quiz Entries</h3>
        <button class="button-75" @click="loadQuizEntries">Load Quiz Entries</button>

        <div v-if="quizEntriesList.length" class="entries-list">
            <div v-for="entry in sortedEntries" :key="entry.id" class="entry-item">
                <div class="entry-header">
                    <h4 v-if="entry.originalId">Proposed Edit of quiz-item <strong>{{ entry.originalId }}</strong></h4>
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
                            <li v-if="entry.option1" :class="{ 'correct-option': 1 === parseInt(entry.correctAnswer) }">
                                1. {{ entry.option1 }}
                            </li>
                            <li v-if="entry.option2" :class="{ 'correct-option': 2 === parseInt(entry.correctAnswer) }">
                                2. {{ entry.option2 }}
                            </li>
                            <li v-if="entry.option3" :class="{ 'correct-option': 3 === parseInt(entry.correctAnswer) }">
                                3. {{ entry.option3 }}
                            </li>
                            <li v-if="entry.option4" :class="{ 'correct-option': 4 === parseInt(entry.correctAnswer) }">
                                4. {{ entry.option4 }}
                            </li>
                            <li v-if="entry.option5" :class="{ 'correct-option': 5 === parseInt(entry.correctAnswer) }">
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
</template>

<script>
import { collection, getDocs } from 'firebase/firestore';
import { sorQuizzesDb } from '../firebase';
import { quizEntries } from '../data/quiz-items';

export default {
    name: 'QuizEntries',
    data() {
        return {
            quizEntriesList: [],
            entriesError: null,
            db: sorQuizzesDb
        }
    },
    computed: {
        sortedEntries() {
            return [...this.quizEntriesList].sort((a, b) => {
                const dateA = a.timestamp?.toDate() || new Date(0);
                const dateB = b.timestamp?.toDate() || new Date(0);
                return dateB - dateA;
            });
        }
    },
    methods: {
        formatDate(timestamp) {
            if (!timestamp) return 'No date';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString();
        },
        async loadQuizEntries() {
            try {
                console.log('Loading quiz entries...');
                const entriesRef = collection(this.db, 'quizEntries');
                const querySnapshot = await getDocs(entriesRef);

                this.quizEntriesList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.error('Error loading quiz entries:', error);
                this.entriesError = error.message;
            }
        },
        getQuestionText(entry) {
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
                    (draft[field] || original[field])) {
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
.quiz-entries {
    margin-top: 1rem;
}

.entries-list {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.entry-item {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    background-color: var(--item-bg-color, #f9f9f9);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.entry-item:hover {
    background-color: var(--hover-bg);
}

.entry-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
}

.entry-header span {
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.entry-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.detail-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.detail-row strong {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.detail-row ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
    list-style: none;
}

.detail-row li {
    margin-bottom: 0.5rem;
    padding: 0.25rem;
}

.correct-option {
    background-color: rgba(127, 255, 212, 0.3);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
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

/* Comparison Section */
.comparison-header {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}

.difference {
    background-color: var(--bg-secondary);
    padding: 0.75rem;
    border-radius: 4px;
    margin: 0.5rem 0;
}

.diff-view {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.original,
.draft {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    padding: 0.25rem;
}

.diff-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    min-width: 70px;
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

/* Error State */
.error {
    color: #ff4444;
    padding: 1rem;
    border: 1px solid #ff4444;
    border-radius: 4px;
    margin: 1rem 0;
    background-color: rgba(255, 68, 68, 0.1);
}

.timestamp {
    color: var(--text-secondary);
    font-size: 0.9em;
}

@media (max-width: 768px) {
    .entry-header {
        font-size: 0.9rem;
    }

    .button-75 {
        width: 100%;
        margin-bottom: 0.5rem;
    }

    .detail-row {
        font-size: 0.9rem;
    }
}
</style>