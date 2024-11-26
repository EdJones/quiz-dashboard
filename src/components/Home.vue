<template>
    <div>
        <h1>Home</h1>
        <div v-if="!currentUser || currentUser.isAnonymous" class="auth-section">
            <h2>Admin Login</h2>
            <form @submit.prevent="signIn">
                <input v-model="email" type="email" placeholder="Email" required>
                <input v-model="password" type="password" placeholder="Password" required>
                <button class="button-75" type="submit">Sign In</button>
            </form>
        </div>
        <div v-if="isAdmin" class="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <div class="admin-controls">
                <div class="quiz-management">
                    <h3>Quiz Management</h3>
                    <button class="button-75" @click="loadQuizzes">Load Quizzes</button>
                    <div v-if="quizList.length" class="quiz-list">
                        <div v-for="quiz in quizList" :key="quiz.id" class="quiz-item">
                            <h4>{{ quiz.title }}</h4>
                            <button class="button-75" @click="editQuiz(quiz)">Edit</button>
                            <button class="button-75" @click="deleteQuiz(quiz.id)">Delete</button>
                        </div>
                    </div>
                    <div v-else class="no-quizzes">
                        <p>No quizzes found. Check the console for any errors.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Quiz from './Quiz.vue';
import { quizStore } from '../stores/quizStore';
import { quizSets } from '../data/quizSets'; // Import quizSets
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';

export default {
    name: 'Home',
    components: {
        Quiz
    },
    data() {
        return {
            quiz: quizStore(),
            quizSets: quizSets,
            debug: false,
            isAdmin: false,
            quizList: [],
            db: getFirestore(),
            currentUser: null,
            auth: getAuth(),
            email: '',
            password: ''
        }
    },
    mounted() {
        console.log('Component mounted, isAdmin:', this.isAdmin);
        this.loadQuizzes();
        // Set up authentication listener
        onAuthStateChanged(this.auth, (user) => {
            console.log('Auth state changed:', user);
            this.currentUser = user;
            if (user && !user.isAnonymous) {
                // Only check admin status for non-anonymous users
                this.checkAdminStatus(user);
            } else {
                this.isAdmin = false;
            }
        });
    },
    methods: {
        async loadQuizzes() {
            console.log('Loading quizzes...');
            try {
                const querySnapshot = await getDocs(collection(this.db, 'quizzes'));
                console.log('Query snapshot:', querySnapshot.docs.length, 'documents found');
                this.quizList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('Quizzes loaded:', this.quizList);
            } catch (error) {
                console.error('Error loading quizzes:', error);
            }
        },
        editQuiz(quiz) {
            // Implement edit functionality
            console.log('Edit quiz:', quiz);
        },
        async deleteQuiz(quizId) {
            if (confirm('Are you sure you want to delete this quiz?')) {
                try {
                    await deleteDoc(doc(this.db, 'quizzes', quizId));
                    await this.loadQuizzes(); // Reload the quizzes
                } catch (error) {
                    console.error('Error deleting quiz:', error);
                }
            }
        },
        async checkAdminStatus(user) {
            // Replace 'your.admin@email.com' with the email you just created
            const adminEmails = ['your.admin@email.com'];

            this.isAdmin = adminEmails.includes(user.email);
            console.log('Admin status:', this.isAdmin);

            if (this.isAdmin) {
                this.loadQuizzes();
            }
        },
        async signIn() {
            try {
                const auth = getAuth();
                const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
                console.log('Signed in:', userCredential.user);
            } catch (error) {
                console.error('Sign in error:', error);
            }
        }
    }
}
</script>

<style>
.quizzes-container {
    display: flex;
    margin-left: auto;
    margin-right: auto;
    justify-content: space-evenly;
    flex-flow: column nowrap;
}

.quiz-item {
    border-style: solid;
    border-top-right-radius: 2dvw;
    border-radius: 2dvw;
}

.lead-image {
    width: 50;
    height: 50;
}



/* CSS */
.button-75 {
    align-items: center;
    background-image: linear-gradient(90deg, #4a7ff3 40%, #702afa);
    border: 0;
    border-radius: 10px;
    box-sizing: border-box;
    color: #fff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font-family: "Codec cold", sans-serif;
    font-size: 12px;
    font-weight: 100;
    height: 24px;
    justify-content: center;
    letter-spacing: .4px;
    line-height: 1;
    max-width: fit-content;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 3px;
    margin-top: 10px;
    text-decoration: none;
    text-transform: uppercase;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
}

.button-75:active {
    outline: 0;
}

.button-75:hover {
    outline: 0;
}

.button-75 span {
    transition: all 200ms;
}

.button-75:hover span {
    transform: scale(.9);
    opacity: .75;
}

@media screen and (max-width: 991px) {
    .button-75 {
        font-size: 15px;
        height: 24px;
    }

    .button-75 span {
        line-height: 24px;
    }
}

/* Add any other styles that were previously in App.vue and are needed for the Home component */

.router-link-container {
    display: flex;
    justify-content: center;
    margin-top: 10px;
}

.auth-section {
    max-width: 400px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.auth-section input {
    display: block;
    width: 100%;
    margin: 10px 0;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}
</style>
