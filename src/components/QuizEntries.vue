<template>
    <div class="quiz-entries">
        <div class="control-buttons">
            <button class="button-75" @click="loadQuizEntries">Refresh</button>
            <select v-model="statusFilter" class="status-select">
                <option value="all">All Entries</option>
                <option value="draft">Drafts</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
            </select>
        </div>

        <div v-if="quizEntriesList.length" class="entries-list">
            <div v-for="entry in sortedEntries" :key="entry.id" class="entry-item">
                <div class="entry-header">
                    <div class="entry-title">
                        <h4>
                            {{ entry.title }}
                            <span v-if="entry.originalId" class="edit-label">
                                (Edit of #{{ entry.originalId }})
                            </span>
                        </h4>
                        <span class="status-badge" :class="entry.status">{{ entry.status || 'pending' }}</span>
                    </div>
                    <div class="entry-metadata">
                        <div class="metadata-row">
                            <span class="metadata-label">ID:</span>
                            <span>{{ entry.id }}</span>
                        </div>
                        <div class="metadata-row">
                            <span class="metadata-label">Submitted:</span>
                            <span>{{ formatDate(entry.timestamp) }}</span>
                        </div>
                        <div class="metadata-row">
                            <span class="metadata-label">By:</span>
                            <span>{{ entry.isAnonymous ? 'Anonymous' : entry.userEmail }}</span>
                        </div>
                    </div>
                </div>
                <div class="entry-details">
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
                    <!-- <  div class="detail-row">
                        <strong>Correct Answer:</strong> {{ entry.correctAnswer }}
                    </div> -->

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
            db: sorQuizzesDb,
            statusFilter: 'all'
        }
    },
    computed: {
        sortedEntries() {
            let filtered = [...this.quizEntriesList];

            // Apply status filter
            if (this.statusFilter !== 'all') {
                if (this.statusFilter === 'draft') {
                    filtered = filtered.filter(entry => !entry.status || entry.status === 'draft');
                } else {
                    filtered = filtered.filter(entry => entry.status === this.statusFilter);
                }
            }

            return filtered.sort((a, b) => {
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
            if (!original || !draft) {
                return {};
            }

            const differences = {};
            const fieldsToCompare = [
                'title', 'subtitle', 'Question', 'questionP2',
                'answer_type', 'option1', 'option2', 'option3',
                'option4', 'option5', 'correctAnswer', 'explanation',
                'explanation2', 'caution'
            ];

            fieldsToCompare.forEach(field => {
                if (field in draft && field in original &&
                    draft[field] !== original[field] &&
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
            if (!entry?.originalId) return false;
            const original = this.getOriginalEntry(entry.originalId);
            if (!original) return false;

            const differences = this.compareEntries(entry, original);
            return Object.keys(differences).length > 0;
        }
    },
    mounted() {
        this.loadQuizEntries();
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
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
}

.entry-title {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: capitalize;
}

.status-badge.pending {
    background-color: var(--warning-bg, #fff3cd);
    color: var(--warning-text, #856404);
}

.status-badge.approved {
    background-color: var(--success-bg, #d4edda);
    color: var(--success-text, #155724);
}

.status-badge.rejected {
    background-color: var(--danger-bg, #f8d7da);
    color: var(--danger-text, #721c24);
}

.entry-metadata {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
}

.metadata-row {
    display: flex;
    gap: 0.5rem;
}

.metadata-label {
    color: var(--text-secondary);
    font-weight: 500;
}

.entry-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
    width: 100%;
}

.detail-row {
    display: flex;
    gap: 0.5rem;
    width: 100%;
    align-items: flex-start;
}

.detail-row strong {
    color: var(--text-secondary);
    font-size: 0.9rem;
    min-width: 100px;
    text-align: left;
}

.detail-row ul {
    margin: 0.25rem 0;
    padding-left: 1.5rem;
    list-style: none;
    width: 100%;
    font-size: 0.9rem;
}

.detail-row li {
    margin-bottom: 0.25rem;
    padding: 0.25rem;
    position: relative;
    text-align: left;
    line-height: 1.2;
}

.detail-row li:last-child {
    margin-bottom: 0;
}

.correct-option {
    background-color: rgba(127, 255, 212, 0.3);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 2px solid #4caf50;
}

.correct-option:before {
    background-color: #4caf50;
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

/* Comparison Section */
.comparison-header {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    width: 100%;
    text-align: left;
}

.comparison-header h4 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1rem;
}

.difference {
    background-color: var(--bg-secondary);
    padding: 0.75rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    width: 100%;
    text-align: left;
}

.diff-view {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
    background-color: var(--bg-primary);
    border-radius: 4px;
    padding: 0.5rem;
    width: 100%;
}

.original,
.draft {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    padding: 0.25rem;
    text-align: left;
}

.diff-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    min-width: 70px;
    font-weight: 500;
}

.diff-content {
    flex: 1;
    padding: 0.25rem;
    border-radius: 2px;
}

.original .diff-content {
    color: #cf222e;
    text-decoration: line-through;
    background-color: rgba(255, 0, 0, 0.05);
}

.draft .diff-content {
    color: #116329;
    background-color: rgba(0, 255, 0, 0.05);
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

/* Ensure feedback section is also left-aligned */
.feedback-section {
    text-align: left;
    width: 100%;
}

@media (max-width: 768px) {
    .entry-header {
        flex-direction: column;
        gap: 1rem;
    }

    .entry-metadata {
        font-size: 0.8rem;
    }

    .button-75 {
        width: 100%;
        margin-bottom: 0.5rem;
    }

    .detail-row {
        font-size: 0.9rem;
    }

    .diff-view {
        font-size: 0.9rem;
    }

    .diff-label {
        min-width: 60px;
    }
}

.edit-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: normal;
}

.detail-row li:before {
    content: "";
    position: absolute;
    left: -1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--text-secondary);
}
</style>