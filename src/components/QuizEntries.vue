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
            <button v-if="selectedEntries.length > 0 && showDeleteButton" class="button-75 delete-button"
                @click="confirmDelete">
                Delete Selected ({{ selectedEntries.length }})
            </button>
        </div>

        <div v-if="quizEntriesList.length" class="entries-list">
            <div v-for="entry in sortedEntries" :key="entry.id" class="entry-item" :data-entry-id="entry.id">
                <div class="entry-header">
                    <div class="entry-title">
                        <input type="checkbox" :value="entry.id" v-model="selectedEntries" class="entry-checkbox">
                        <h4>
                            {{ entry.title }}
                            <span v-if="entry.originalId" class="edit-label">
                                (Edit of <a href="#" class="history-link" :data-id="entry.originalId"
                                    @click="handleHistoryClick">#{{ entry.originalId }}↗</a>)
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
                        <div v-if="entry.originalId" class="metadata-row edit-history">
                            <span class="metadata-label">History:</span>
                            <span v-html="editHistories[entry.id] || 'Loading...'" @click="handleHistoryClick"></span>
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
                        <div v-if="entry.originalId" class="comparison-section">
                            <h4>Content and Changes:</h4>
                            <div v-for="(diff, field) in differences[entry.id] || {}" :key="field" class="diff-row">
                                <!-- Only show if either original or current has content -->
                                <div v-if="diff.original || diff.current" class="diff-content">
                                    <!-- Only show comparison if there's a change -->
                                    <template v-if="!diff.unchanged">
                                        <div class="field-row">
                                            <strong class="field-label">{{ field }}:</strong>
                                            <div class="diff-values">
                                                <div class="original">
                                                    <span class="diff-label">Was:</span>
                                                    <span class="diff-content">{{ diff.original || 'empty' }}</span>
                                                </div>
                                                <div class="current">
                                                    <span class="diff-label">Now:</span>
                                                    <span class="diff-content">{{ diff.current || 'empty' }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                    <!-- Always show current content -->
                                    <template v-else>
                                        <div class="field-row">
                                            <strong class="field-label">{{ field }}:</strong>
                                            <div class="current-content">
                                                {{ diff.current }}
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <div v-else-if="error" class="error">
            {{ error }}
        </div>
        <div v-else>
            No quiz entries found
        </div>
    </div>
</template>

<script>
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { sorQuizzesDb } from '../firebase';  // Import using the exported name
import { quizEntries } from '../data/quiz-items';
import { quizStore } from '../stores/quizStore';
import { storeToRefs } from 'pinia';

export default {
    name: 'QuizEntries',
    setup() {
        const store = quizStore();
        const { deleteError } = storeToRefs(store);
        return { store, deleteError };
    },
    data() {
        return {
            quizEntriesList: [],
            error: null,
            statusFilter: 'all',
            selectedEntries: [],
            differences: {},
            editHistories: {},
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
        },
        showDeleteButton() {
            return this.store.canDeleteEntries();
        }
    },
    watch: {
        async 'entry.originalId'(newId) {
            if (newId) {
                this.differences = await this.getDifferences(this.entry);
            }
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
                const entriesRef = collection(sorQuizzesDb, 'quizEntries');
                const querySnapshot = await getDocs(entriesRef);

                this.quizEntriesList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Load differences and histories for entries with originalId
                for (const entry of this.quizEntriesList) {
                    if (entry.originalId) {
                        this.differences[entry.id] = await this.getDifferences(entry);
                        this.editHistories[entry.id] = await this.getEditHistory(entry);
                    }
                }

                console.log('Loaded entries:', this.quizEntriesList.length);
            } catch (error) {
                console.error('Error loading quiz entries:', error);
                this.error = error.message;
            }
        },
        getQuestionText(entry) {
            return entry.question || entry.Question || entry.questionP2 || entry.title || 'No question text found';
        },
        hasOptions(entry) {
            return entry.option1 || entry.option2 || entry.option3 || entry.option4 || entry.option5;
        },
        async loadOriginalEntry(originalId) {
            console.log('Loading original entry with ID:', originalId);
            try {
                // First check the static quiz-items array using the numeric ID
                const staticEntry = quizEntries.find(entry => entry.id === parseInt(originalId));
                if (staticEntry) {
                    console.log('Found in static entries:', staticEntry);
                    return staticEntry;
                }

                console.log('Not found in static entries, trying Firestore...');
                // If not found in static array, try Firestore (for drafts of drafts)
                const docRef = doc(sorQuizzesDb, 'quizEntries', originalId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const firestoreEntry = { id: docSnap.id, ...docSnap.data() };
                    console.log('Found in Firestore:', firestoreEntry);
                    return firestoreEntry;
                }

                console.log('Entry not found in either location');
                return null;
            } catch (error) {
                console.error('Error loading original entry:', error);
                return null;
            }
        },
        async getDifferences(entry) {
            console.log('Getting differences for entry:', {
                id: entry.id,
                originalId: entry.originalId,
                title: entry.title
            });

            if (!entry.originalId) {
                console.log('No originalId found');
                return {};
            }

            const original = await this.loadOriginalEntry(entry.originalId);
            if (!original) return {};

            console.log('Comparing entries:', {
                original: { id: original.id, title: original.title },
                current: { id: entry.id, title: entry.title }
            });

            const differences = {};
            const fieldsToCompare = [
                'title', 'subtitle', 'Question', 'questionP2', 'explanation',
                'option1', 'option2', 'option3', 'option4', 'option5',
                'correctAnswer', 'explanation2', 'explanation3',
                'closingText', 'closingText2', 'caution',
                'videoUrl', 'videoId', 'imageUrl', 'imageAltText'
            ];

            for (const field of fieldsToCompare) {
                console.log(`Comparing field ${field}:`, {
                    original: original[field],
                    current: entry[field]
                });

                // Store both values regardless of whether they're different
                differences[field] = {
                    original: original[field],
                    current: entry[field],
                    unchanged: entry[field] === original[field]
                };

                console.log(`Field ${field}:`, differences[field]);
            }

            return differences;
        },
        confirmDelete() {
            if (confirm(`Are you sure you want to delete ${this.selectedEntries.length} entries?`)) {
                this.deleteSelectedEntries();
            }
        },
        async deleteSelectedEntries() {
            try {
                await this.store.deleteQuizEntries(this.selectedEntries);
                this.selectedEntries = [];
                await this.loadQuizEntries();
            } catch (error) {
                this.error = error.message;
            }
        },
        async getEditHistory(entry) {
            if (!entry.originalId) return '';

            const history = [];
            let currentEntry = entry;

            while (currentEntry.originalId) {
                const original = await this.loadOriginalEntry(currentEntry.originalId);
                if (!original) break;

                history.unshift({
                    id: currentEntry.originalId,
                    title: original.title || 'Untitled'
                });

                currentEntry = original;
            }

            if (history.length === 0) return '';

            return history.map((item, index) => {
                const isLast = index === history.length - 1;
                return `<a href="#" class="history-link" data-id="${item.id}">#${item.id}↗</a>${isLast ? '' : ' → '}`;
            }).join('');
        },
        handleHistoryClick(event) {
            if (event.target.classList.contains('history-link')) {
                event.preventDefault();
                const id = event.target.dataset.id;
                // Find the entry with this ID
                const entry = this.quizEntriesList.find(e => e.id === id);
                if (entry) {
                    // Scroll to the entry
                    const element = document.querySelector(`[data-entry-id="${id}"]`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        // Add highlight class
                        element.classList.add('highlighted-entry');
                        // Remove highlight after 3 seconds
                        setTimeout(() => {
                            element.classList.remove('highlighted-entry');
                        }, 5000);
                    }
                }
            }
        }
    },
    async mounted() {
        if (this.entry?.originalId) {
            this.differences = await this.getDifferences(this.entry);
        }
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
    transition: all 0.3s ease;
}

.highlighted-entry {
    background-color: var(--highlight-bg, #fff3cd);
    border-color: var(--highlight-border, #ffeeba);
    box-shadow: 0 0 0 2px var(--highlight-border, #ffeeba);
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
.comparison-section {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: var(--comparison-bg, #f8f9fa);
    border-radius: 8px;
    border: 1px solid var(--border-color, #ddd);
}

.diff-row {
    margin: 0.25rem 0;
    padding: 0.25rem;
}

.field-row {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.field-label {
    min-width: 100px;
    text-align: right;
    padding-top: 0.15rem;
    font-size: 0.9rem;
}

.diff-values {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.original,
.current {
    padding: 0.15rem 0.5rem;
    border-radius: 3px;
}

.original {
    background-color: var(--danger-bg-light, #fff5f5);
    color: var(--danger-text, #dc3545);
}

.current {
    background-color: var(--success-bg-light, #f0fff4);
    color: var(--success-text, #28a745);
}

.current-content {
    padding: 0.15rem 0.5rem;
}

.diff-label {
    font-weight: 500;
    min-width: 45px;
    font-size: 0.85rem;
}

h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
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

    .comparison-section {
        padding: 0.75rem;
    }

    .diff-row {
        margin: 0.5rem 0;
    }

    .diff-content {
        margin-left: 0.5rem;
    }

    .entry-checkbox {
        width: 24px;
        height: 24px;
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

.entry-checkbox {
    margin-right: 0.5rem;
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.delete-button {
    background-color: var(--danger-bg, #f8d7da);
    color: var(--danger-text, #721c24);
    border-color: var(--danger-text, #721c24);
}

.delete-button:hover {
    background-color: var(--danger-text, #721c24);
    color: white;
}

.edit-history {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-style: italic;
}

.history-link {
    color: var(--text-secondary);
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
}

.history-link:hover {
    text-decoration: underline;
}
</style>