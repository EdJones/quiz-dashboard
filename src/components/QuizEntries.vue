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
/* Copy all the relevant CSS from Home.vue */
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

/* ... Add all other relevant CSS from Home.vue ... */
</style>