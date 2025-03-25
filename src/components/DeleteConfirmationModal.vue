<template>
    <div v-if="show" class="modal-overlay">
        <div class="modal-content">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete {{ entries.length }} entries?</p>

            <div class="entries-preview">
                <div v-for="entry in entries" :key="entry.id" class="entry-preview">
                    <div class="entry-header">
                        <div class="entry-id">#{{ entry.id }}</div>
                        <div class="entry-title">{{ entry.title || 'Untitled' }}</div>
                    </div>
                    <div class="entry-question">
                        {{ entry.Question || entry.question || 'No question text' }}
                    </div>
                    <div class="entry-status" v-if="entry.status">
                        Status: {{ entry.status }}
                    </div>
                </div>
            </div>

            <div class="modal-actions">
                <button @click="$emit('cancel')" class="cancel-button">Cancel</button>
                <button @click="$emit('confirm')" class="confirm-button">Delete</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DeleteConfirmationModal',
    props: {
        show: {
            type: Boolean,
            required: true
        },
        entries: {
            type: Array,
            required: true
        }
    }
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.5rem;
}

.entries-preview {
    margin: 1.5rem 0;
    max-height: 400px;
    overflow-y: auto;
}

.entry-preview {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 1rem;
    background-color: #f8f9fa;
}

.entry-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.entry-id {
    color: #666;
    font-family: monospace;
    font-size: 0.9rem;
    padding: 0.2rem 0.5rem;
    background-color: #e9ecef;
    border-radius: 4px;
}

.entry-title {
    font-weight: 600;
    color: #333;
    font-size: 1.1rem;
}

.entry-question {
    color: #555;
    margin: 0.5rem 0;
    line-height: 1.4;
    font-size: 0.95rem;
    padding: 0.5rem;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #eee;
}

.entry-status {
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.5rem;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
}

button {
    padding: 0.5rem 1.5rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    font-size: 1rem;
}

.cancel-button {
    background-color: #f0f0f0;
    color: #333;
}

.confirm-button {
    background-color: #dc3545;
    color: white;
}

.cancel-button:hover {
    background-color: #e0e0e0;
}

.confirm-button:hover {
    background-color: #c82333;
}
</style>