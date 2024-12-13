// src/stores/quizStore.js
import { defineStore } from 'pinia';
import { auth, sorQuizzesDb as db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';

export const quizStore = defineStore('quiz', {
    state: () => ({

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
