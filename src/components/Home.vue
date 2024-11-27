<template>
    <div>
        <h1>Admin Dashboard</h1>
        <div class="admin-dashboard">
            <div class="user-progress">
                <h3>User Progress</h3>
                <button class="button-75" @click="loadUserProgress">Load User Progress</button>
                <div v-if="userProgressList.length" class="progress-list">
                    <div v-for="progress in sortedProgress" :key="progress.id" class="progress-item">
                        <h4>User: {{ progress.userId }}</h4>
                        <p>Quiz: {{ progress.quizId }}</p>
                        <p>Last Updated: {{ formatDate(progress.lastUpdated) }}</p>
                        <pre>{{ JSON.stringify(progress, null, 2) }}</pre>
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
            db: getFirestore()
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
}

.progress-item {
    margin-bottom: 20px;
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
}

.error {
    color: red;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid red;
    border-radius: 4px;
}
</style>
