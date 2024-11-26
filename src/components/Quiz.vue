<template>
  <span v-show="false">{{ reviewModeTracker }}</span>

  <div class="w-full place-content-center">
    <span class="lg:text-3xl sm:text-2xl">Science of Reading Quizzes</span>
    <p v-if="quizState !== 'resultSummary' && quizState !== 'end'">
      {{ numCompleted }} / {{ quizItems.length }}
    </p>
  </div>

  <div v-if="quizState === 'resultSummary'"
    class="sm:w-full md:w-9/12 lg:w-5/6 px-2 quizzes-container text-center border-solid bodrder-stone-400">
    <h5 class="text-stone-400 pt-2"></h5>
    <p class="question-text mb-2">Results</p>

    <div class="grid quiz-item w-full border-4 place-self-center place-content-center text-center">
      <p class="mt-20">You got </p>
      <p class="text-3xl"> {{ numCorrect() }} of {{ this.quizItems.length }}</p>
      <p class="mb-20">correct.</p>
    </div>
  </div>
  <div v-else-if="quizState === 'end'" class="sm:w-full md:w-9/12 lg:w-5/6 px-2 quizzes-container text-center">
    <h5 class="text-stone-400 pt-2">&nbsp;</h5>

    <div class="grid quiz-item w-full border-4 place-self-center place-content-center text-center">
      <p class="mt-20">You got </p>
      <p class="text-3xl"> {{ numCorrect() }} of {{ this.quizItems.length }}</p>
      <p class="mb-20">correct.</p>
    </div>
  </div>
  <div v-else class="sm:w-full md:w-9/12 lg:w-5/6 lg:px-4 quizzes-container text-center">
    <div v-if="debug === true" class="debug-info">
      <p>Quiz Debug (before QuizItem):
        quizState: {{ quizState }},
        reviewMode: {{ reviewMode }},
        basicMode: {{ basicMode }}
      </p>
    </div>
    <QuizItem :currentQuizItem="currentQuizItem" :itemNum="itemNum" :reviewMode="reviewMode" :basicMode="basicMode"
      v-model:userAnswer="userAnswers[itemNum]" :debug="debug" @selected="chosen = true" />
  </div>

  <!--div v-if="selectError === true">
    <p class="text-orange-500">Please select an answer.</p>
  </div-->

  <!-- Debug info -->
  <div v-if="false">
    <p>quizState: {{ quizState }}, itemNum: {{ itemNum }}, complete: {{ complete }}, chosen: {{ chosen }}, reviewMode:
      {{ reviewMode }}</p>
  </div>

  <div v-if="quizState === 'basicAsk' && chosen">
    <button class="bg-stone-400 w-32 h-10 mt-6 text-amber-400" @click="checkIt">
      'Check it' </button>
  </div>
  <div v-else-if="quizState === 'basicAsk' && !chosen">
    <button class="bg-stone-400 w-32 h-10 mt-6 text-amber-400" @click="selectionError">&nbsp; </button>
  </div>
  <div v-else-if="quizState === 'expertAsk' && chosen && complete">
    <p v-if="!basicMode && chosen && complete && !reviewMode">No more questions...</p>
    <button class="bg-stone-400 w-32 h-10 mt-6 text-amber-400" @click="submit">Submit</button>
  </div>
  <div v-else-if="quizState === 'basicResults' && complete">
    <button class="bg-stone-400 w-32 h-10 mt-3 mb-3 text-amber-400" @click="quizDone">quizDone</button>
  </div>
  <div v-else-if="quizState === 'basicResults'">
    <button class="bg-stone-400 h-10 mt-6 text-amber-400" @click="nextQuestion">Next Question</button>
  </div>
  <div v-else-if="quizState === 'expertAsk' && !chosen">
    <button class="bg-stone-400 w-32 h-10 mt-6 text-amber-400" @click="selectionError">&nbsp; </button>
  </div>
  <div v-else-if="quizState === 'expertAsk' && chosen">
    <button class="bg-stone-400 w-32 h-10 mt-6 text-amber-400" @click="nextItem">Next</button>
  </div>
  <div v-else-if="quizState === 'resultSummary'">
    <button class="bg-stone-400 h-10 mt-6 text-amber-400" @click="startReview">Let's see what's happening.</button>
  </div>
  <div v-else-if="quizState === 'expertResults' && complete">
    <button class="bg-stone-400 w-32 h-10 mt-3 mb-3 text-amber-400" @click="quizDone">Next</button>
  </div>
  <div v-else-if="quizState === 'expertResults'">
    <button class="bg-stone-400 w-32 h-10 mt-3 mb-3 text-amber-400" @click="nextReview">Next</button>
  </div>
  <div v-else-if="quizState === 'end'" class="mt-6">
    <p>Thank you!</p>
    <button class="bg-stone-400 h-10 mt-6 text-amber-400" @click="showOriginalView">Return to Quizzes</button>
  </div>
  <div v-else>
    <p>Error: Unknown quiz state: {{ quizState }}</p>
  </div>
  <span v-show="false">{{ reviewModeTracker }}</span>
</template>
<script>
import QuizItem from './QuizItem.vue';
import { quizEntries } from '../data/quiz-items.js'
import { quizSets } from '../data/quizSets.js'
import { quizStore } from '../stores/quizStore'; // Import the store
import { ref, onMounted, watch } from 'vue'
import { saveUserProgress } from '../firebase';

export default {
  name: 'Quiz',
  emits: ['change-view'],
  components: {
    QuizItem
  },
  props: {
    selectedQuiz: {
      type: Number,
      required: true
    },
    debug: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const store = quizStore();

    onMounted(() => {
      store.setCurrentQuiz(props.selectedQuiz);
    });

    return {
      store
    }
  },
  data() {
    console.log("Data item:");
    //console.log(quizItems[0]);
    const quizChoice = 1;
    const quizState = 'chooseQuiz';
    const reviewMode = false;


    return {
      quizItems: [],
      userAnswers: [],
      complete: false,
      chosen: false,
      itemNum: 0,
      basicMode: false,
      reviewMode: reviewMode,
      showEnd: false,
      selectError: false,
      debug: this.debug
    }
  },
  computed: {
    currentQuizItem() {
      console.log("In currentQuizItem, itemNum is: ", this.itemNum);
      console.log("In currentQuizItem, quizItems is: ", this.quizItems);
      console.log("In currentQuizItem, quizItems[itemNum] is: ", this.quizItems[this.itemNum]);
      return this.quizItems[this.itemNum];
    },
    numCompleted() {
      // For basic mode, it's just the current item number
      if (this.basicMode) {
        return this.itemNum;
      }

      // For expert mode, count the number of answered questions
      return this.userAnswers.filter(answer => answer !== undefined).length;
    },
    reviewModeTracker() {
      return this.reviewMode;  // Explicitly track reviewMode
    }
  },
  methods: {
    buildQuizSet() {
      // Set of 10-ish items
      console.log("Building quiz set");
      console.log("quizSets: ", quizSets[this.selectedQuiz])
      let quizSetItems = [];
      for (let i = 0; i < quizSets[this.selectedQuiz].items.length; i++) {
        console.log("In for loop", quizSets[this.selectedQuiz].items[i])
        quizSetItems[i] = quizEntries[quizSets[this.selectedQuiz].items[i]];
      }
      this.quizItems = quizSetItems;
      this.basicMode = quizSets[this.selectedQuiz].basicMode;
      if (this.basicMode) {
        this.quizState = 'basicAsk';
      } else {
        this.quizState = 'expertAsk';
      }

      console.log("in buildQuizSet, this.basicMode: ", this.basicMode)
      console.log("Returning quizItems: ", this.quizItems)
      // return quizItems;
    },
    numCorrect() {
      let correct = 0;
      console.log("Length ", this.quizItems.length);
      for (let i = 0; i < this.quizItems.length; i++) {
        console.log(this.quizItems[i].correctAnswer)
        console.log("this.$userAnswers[i]this.$userAnswers[i]", this.$userAnswers[i]);
        console.log("this.quizItems[i].correctAnswer: ", this.quizItems[i].correctAnswer);
        if (this.$userAnswers[i] == this.quizItems[i].correctAnswer) { correct++ }
        console.log("got one right")
      }
      console.log("--Finished numCorrect--");
      return correct
    },
    nextQuestion() {
      console.log("----In nextQuestion----");
      if (this.itemNum < this.quizItems.length - 1) {
        this.itemNum++;
        this.chosen = false;
        this.reviewMode = false;
        this.quizState = 'basicAsk';
      } else {
        this.complete = true;
        this.quizState = 'resultSummary';
      }
    },
    nextReview() {
      console.log("----In nextReview----");
      this.quizState = 'expertResults';
      console.log("Reviewing itemNum: ", this.itemNum, "quizItems.length: ", this.quizItems.length);
      if (this.itemNum < this.quizItems.length - 1) {
        this.itemNum++;
        this.chosen = false;
        this.complete = false;
      } else {
        this.complete = true;
        this.quizState = 'end';
      }
    },
    async nextItem() {
      console.log("----In nextItem----");
      try {
        console.log("----In nextItem----");
        const currentQuestion = this.quizItems[this.itemNum];
        const selectedAnswer = this.userAnswers[this.itemNum];
        const correctAnswer = currentQuestion.correctAnswer;
        const questionId = currentQuestion.id;
        const questionTitle = currentQuestion.title;

        console.log('Next Item Answer Check:', {
          questionNumber: this.itemNum,
          questionId: questionId,
          questionTitle: questionTitle,
          selectedAnswer: selectedAnswer,
          correctAnswer: correctAnswer
        });

        // Save to store with correctness, ID, and title
        await this.store.setUserAnswer(
          this.itemNum,
          selectedAnswer,
          correctAnswer,
          questionId,
          questionTitle,
          currentQuestion
        );

        // Save progress
        await saveUserProgress(this.selectedQuiz, {
          lastQuestionAnswered: this.itemNum,
          userAnswers: this.store.userAnswers,
          incorrectQuestions: this.store.incorrectQuestions,
          totalCorrect: this.store.userAnswers.filter(a => a.correct).length,
          totalAnswered: this.store.userAnswers.length,
          timestamp: new Date()
        });

        // Advance to next question
        console.log("itemNum: ", this.itemNum, "quizItems.length: ", this.quizItems.length);
        if (this.itemNum < this.quizItems.length - 1) {
          this.itemNum++;
          this.chosen = false;
          // this.reviewMode = false;
        } else {
          this.complete = true;
          this.quizState = 'resultSummary';
        }
      } catch (error) {
        console.error("Error in nextItem method:", error);
      }
    },
    async checkIt() {
      console.log("----In checkIt----");

      try {
        const currentQuestion = this.quizItems[this.itemNum];
        if (!currentQuestion) {
          console.error('No question found for index:', this.itemNum);
          return;
        }

        // Debug log to see what we're dealing with
        console.log('Question type:', {
          type: currentQuestion.answer_type,
          isSortable: currentQuestion.answer_type === 'sortableList'
        });

        let selectedAnswer;
        // Make sure we're checking the answer_type correctly
        if (currentQuestion.answer_type === 'sortableList' || currentQuestion.answer_type === 'sortable') {
          // For sortable lists, just use the items array
          selectedAnswer = currentQuestion.items || [];
          console.log('Using sortable items:', selectedAnswer);
        } else {
          // Only for multiple choice
          selectedAnswer = this.userAnswers[this.itemNum];
          if (selectedAnswer === undefined) {
            console.error('No valid answer for multiple choice question:', this.itemNum);
            return;
          }
        }

        const questionData = {
          selectedAnswer,
          correctAnswer: currentQuestion.correctAnswer || '',
          questionId: currentQuestion.id || '',
          questionTitle: currentQuestion.title || '',
          quizEntry: currentQuestion
        };

        await this.store.setUserAnswer(
          this.itemNum,
          questionData.selectedAnswer,
          questionData.correctAnswer,
          questionData.questionId,
          questionData.questionTitle,
          questionData.quizEntry
        );

        await saveUserProgress(this.selectedQuiz, {
          lastQuestionAnswered: this.itemNum,
          userAnswers: this.store.userAnswers,
          incorrectQuestions: this.store.incorrectQuestions,
          totalCorrect: this.store.userAnswers.filter(a => a.correct).length,
          totalAnswered: this.store.userAnswers.length,
          timestamp: new Date()
        });

        this.quizState = 'basicResults';
        this.reviewMode = true;
        console.log("In checkIt, itemNum: ", this.itemNum, "quizItems.length: ", this.quizItems.length);
        if (this.itemNum === this.quizItems.length - 1) {
          this.complete = true;


        } else {
          this.complete = false;
          // this.itemNum++;
          this.chosen = false

        }

      } catch (error) {
        console.error("Error in checkIt method:", error);
      }
    },
    answerSelected() {
      console.log("In answerSelected");
      this.selectError = false;
      // No need to set chosen here, it's handled in the event listener
    },
    submit() {
      console.log("Complete. Let's see your score. ");
      this.showResults = true;
      this.complete = false
      //this.quizState = 'resultSummary';

    },
    startReview() {
      console.log("----Start Review----", {
        beforeState: {
          quizState: this.quizState,
          itemNum: this.itemNum,
          reviewMode: this.reviewMode,
          complete: this.complete
        }
      });

      // Force all state changes in the correct order
      this.itemNum = 0;
      this.reviewMode = true;  // Set this before quizState
      this.quizState = 'expertResults';
      this.complete = false;

      console.log("After startReview:", {
        afterState: {
          quizState: this.quizState,
          itemNum: this.itemNum,
          reviewMode: this.reviewMode,
          complete: this.complete
        }
      });
    },
    selectionError() {
      console.log("In selectionError");
      this.selectError = true;
    },
    quizDone() {
      console.log("Before quizDone:", {
        currentState: this.quizState,
        complete: this.complete,
        reviewMode: this.reviewMode
      });

      // Force exit from review mode
      this.reviewMode = false;
      // Clear any intermediate states
      this.chosen = false;
      // Set final states
      this.complete = true;
      this.quizState = 'end';

      console.log("After quizDone:", {
        currentState: this.quizState,
        complete: this.complete,
        reviewMode: this.reviewMode
      });
    },
    showOriginalView() {
      this.$emit('change-view', { showQuizzes: true }); // Emit an event with the new state
    }
  },
  created() {
    this.buildQuizSet();
    // console.log("In created, ", this.quizItems)
  },
  watch: {
    quizState: {
      immediate: true,
      handler(newState) {
        console.log('quizState watcher:', {
          newState,
          isExpertResults: newState === 'expertResults',
          isBasicResults: newState === 'basicResults',
          shouldBeReviewMode: newState === 'expertResults' || newState === 'basicResults'
        });

        this.reviewMode = newState === 'expertResults' || newState === 'basicResults';

        console.log('After setting reviewMode:', {
          reviewMode: this.reviewMode,
          quizState: this.quizState
        });
      }
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  /*color: #2c3e50; */
  margin-top: 20px;
}

.lead-image {
  width: 50;
  height: 50;
}

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
</style>
