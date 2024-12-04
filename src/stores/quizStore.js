// src/stores/quizStore.js
import { defineStore } from 'pinia';
import { auth, sorQuizzesDb as db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';

export const quizStore = defineStore('quiz', {
    state: () => ({
        quizAttempts: [],
        quizEdits: [],
        userAnswers: [], // Will now store objects instead of just answer values
        currentQuizId: null,
        draftQuizEntry: {
            title: 'Sample Title',
            subtitle: 'Sample Subtitle',
            Question: 'What is your question?',
            questionP2: '',
            answer_type: 'mc',
            option1: 'First option',
            option2: 'Second option',
            option3: 'Third option',
            option4: 'Fourth option',
            option5: 'Fifth option',
            correctAnswer: 1,
            explanation: 'Here is why option 1 is correct...',
            explanation2: '',
            videoUrl: '',
            videoId: '',
            image: '',
            imageUrl: '',
            imageAltText: '',
            podcastEpisode: {
                title: 'Episode Title',
                EpisodeUrl: '',
                audioUrl: '',
                description: '',
                podcastStartTime: 0,
            },
            podcastEpisode2: {
                title: '',
                EpisodeUrl: '',
                audioUrl: '',
                description: '',
                podcastStartTime: 0,
            },
            cautionLevel: '',
            caution: '',
            citations: [],
            ref1: '',
            ref2: '',
            resources: [],
            closingText: '',
            closingText2: '',
            modal: ''
        },
        saveStatus: {
            message: '',
            type: '', // 'success' or 'error'
            show: false
        },
        incorrectQuestions: []  // Changed from incorrectQuestionIds to store more info
    }),
    actions: {
        async recordQuizAttempt(quizStarted) {
            const userId = auth.currentUser?.uid;
            console.log('Recording quiz attempt to SORQuizzes DB...');

            const attempt = {
                userId,  // Add user ID
                quizId: this.currentQuizId,
                quizStarted,
                userAnswers: this.userAnswers,
                timestamp: serverTimestamp()
            };

            try {
                const docRef = await addDoc(collection(db, 'quizAttempts'), attempt);
                console.log("Quiz attempt saved with ID: ", docRef.id);
                this.quizAttempts.push(attempt);
            } catch (e) {
                console.error("Error saving quiz attempt: ", e);
                throw e;
            }
        },
        async saveUserAnswers() {
            // Check if userAnswers is defined and not empty
            if (!this.userAnswers || this.userAnswers.length === 0) {
                console.error("No user answers to save.");
                return; // Exit if there are no answers to save
            }

            console.log('Saving user answers to SORQuizzes DB...');

            const attempt = {
                userAnswers: this.userAnswers,  // Changed from userAnswers to this.userAnswers
                timestamp: new Date(),
            };

            // Firestore logic to save user answers
            try {
                const docRef = await addDoc(collection(db, 'userAnswers'), attempt);
                console.log("User answers saved with ID: ", docRef.id);
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        },
        setUserAnswers(answers) {
            this.userAnswers = answers; // Update user answers
        },
        updateDraftQuizEntry(entry) {
            this.draftQuizEntry = { ...this.draftQuizEntry, ...entry };
        },
        resetDraftQuizEntry() {
            this.draftQuizEntry = {
                // Reset to initial state
                title: '',
                subtitle: '',
                // ... (all other fields reset)
            };
        },
        async saveDraftQuizEntry() {
            try {
                console.log('Saving quiz entry to SORQuizzes DB...');
                // Add validation/initialization
                const entryToSave = {
                    ...this.draftQuizEntry,
                    podcastEpisode: this.draftQuizEntry.podcastEpisode || {
                        title: '',
                        EpisodeUrl: '',
                        audioUrl: '',
                        description: '',
                        podcastStartTime: 0
                    },
                    podcastEpisode2: this.draftQuizEntry.podcastEpisode2 || {
                        title: '',
                        EpisodeUrl: '',
                        audioUrl: '',
                        description: '',
                        podcastStartTime: 0
                    },
                    timestamp: new Date(),
                };

                console.log('Saving entry with podcast data:', entryToSave);
                const docRef = await addDoc(collection(db, 'quizEntries'), entryToSave);
                console.log('Document written with ID: ', docRef.id);
                this.saveStatus = {
                    message: 'Quiz entry saved successfully!',
                    type: 'success',
                    show: true
                };
                return docRef.id;
            } catch (e) {
                console.error('Error adding document: ', e);
                this.saveStatus = {
                    message: 'Error saving quiz entry: ' + e.message,
                    type: 'error',
                    show: true
                };
                throw e;
            }
        },
        clearSaveStatus() {
            this.saveStatus = {
                message: '',
                type: '',
                show: false
            };
        },
        setCurrentQuiz(quizId) {
            console.log('Setting current quiz:', quizId);
            this.currentQuizId = quizId;
            this.userAnswers = []; // Reset answers when starting new quiz
            this.incorrectQuestions = [];  // Reset incorrect questions
        },
        async setUserAnswer(index, selectedAnswer, correctAnswer, questionId, questionTitle, quizEntry) {
            // Validate inputs before proceeding
            if (selectedAnswer === undefined) {
                console.error('Invalid selectedAnswer:', selectedAnswer);
                return;
            }

            // Skip correctness check for sortable lists
            if (Array.isArray(selectedAnswer)) {
                console.log('Sortable list answer - skipping correctness check');

                this.userAnswers[index] = {
                    selected: selectedAnswer,
                    questionId: questionId || '',
                    questionTitle: questionTitle || '',
                    timestamp: new Date().toISOString()
                };

                // Don't add to incorrectQuestions for sortable lists
                return;
            }

            // Regular multiple choice handling
            const isCorrect = selectedAnswer === correctAnswer;

            this.userAnswers[index] = {
                selected: selectedAnswer,
                correct: isCorrect,
                questionId: questionId || '',
                questionTitle: questionTitle || '',
                timestamp: new Date().toISOString()
            };

            if (!isCorrect && !this.incorrectQuestions.some(q => q.id === questionId)) {
                const chosenOptionText = quizEntry?.[`option${selectedAnswer}`] || '';
                this.incorrectQuestions.push({
                    id: questionId || '',
                    title: questionTitle || '',
                    chosenAnswer: chosenOptionText?.substring(0, 100) || ''
                });
            }

            try {
                const userId = auth.currentUser?.uid;
                if (!userId) {
                    console.error('No user ID available');
                    return;
                }

                console.log('Saving user answer to SORQuizzes DB...');
                const cleanUserAnswers = this.userAnswers.filter(answer =>
                    answer !== null && answer !== undefined
                );

                const cleanIncorrectQuestions = this.incorrectQuestions.filter(q =>
                    q !== null && q !== undefined
                );

                const attemptRef = doc(db, 'quizAttempts', `${userId}_${this.currentQuizId}`);
                await setDoc(attemptRef, {
                    userId,
                    quizId: this.currentQuizId,
                    userAnswers: cleanUserAnswers,
                    incorrectQuestions: cleanIncorrectQuestions,
                    lastUpdated: serverTimestamp()
                }, { merge: true });

            } catch (error) {
                console.error('Firebase save error:', error);
                throw error;
            }
        },
        async recordQuizEdit(quizStarted) {
            const quizEdit = {
                timestamp: new Date(),
            };

            try {
                const docRef = await addDoc(collection(db, 'quizEdit'), quizEdit);
                console.log("Quiz attempt saved with ID: ", docRef.id);
                this.quizEdits.push(quizEdit);
            } catch (e) {
                console.error("Error saving quiz attempt: ", e);
                throw e;
            }
        },
    },
});
