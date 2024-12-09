<template>
  <div class="new-item-form">
    <div v-if="submitStatus.show" :class="['status-message', submitStatus.type]">
      <div class="button-group mb-4">
        <button @click="resetForm" class="preview-toggle">
          Add Another Quiz Item
        </button>
        <button @click="returnToQuizzes" class="preview-toggle">
          Return to Quizzes
        </button>
      </div>

      {{ submitStatus.message }}

      <div v-if="submitStatus.type === 'success' && submittedEntry" class="submitted-preview mt-4">
        <h3>Your submitted quiz item:</h3>
        <QuizItem :currentQuizItem="submittedEntry" :itemNum="0" :reviewMode="true" :basicMode="false"
          :userAnswer="submittedEntry.correctAnswer" />
      </div>
    </div>

    <div class="preview-controls">
      <span class="preview-controls-text">Help build these quizzes. </span>
      <div class="button-group">
        <button type="button" @click="returnToQuizzes"
          :class="['return-button smaller-button', { active: returnButton.active }]">
          Return to Quizzes
        </button>
        <button type="button" @click="previewMode = !previewMode" :class="['preview-toggle', { active: previewMode }]">
          {{ previewMode ? 'Edit Mode' : 'Preview Mode' }}
        </button>
        <button type="button" @click="jsonPreviewMode = !jsonPreviewMode"
          :class="['preview-toggle', { active: jsonPreviewMode }]">
          {{ jsonPreviewMode ? 'Hide JSON' : 'Show JSON' }}
        </button>
      </div>
    </div>

    <div v-if="jsonPreviewMode" class="json-preview">
      <vue-json-pretty :data="newEntry" :deep="2" :showLength="true" :showLine="true" :showDoubleQuotes="true"
        :highlightMouseoverNode="true" />
    </div>

    <div v-if="previewMode" class="preview-section">
      <QuizItem :currentQuizItem="newEntry" :itemNum="0" :reviewMode="true" :basicMode="false"
        :userAnswer="newEntry.correctAnswer" />
    </div>

    <form v-else @submit.prevent="submitForm">
      <!-- Question Group -->
      <div class="form-group-section question-section">
        <h2></h2>
        <div class="question-content-wrapper">
          <!-- Basic Information -->
          <details>
            <summary class="section-summary">
              <span class="summary-text">Pose a Question</span>
              <span class="arrow-indicator">▼</span>
            </summary>
            <div class="form-section">
              <div class="form-group">
                <label for="title">Title:</label>
                <input type="text" id="title" v-model="newEntry.title" :placeholder="newEntry.title"
                  @focus="handleFocus($event, 'title')" @blur="handleBlur($event, 'title')" />
              </div>
              <div class="form-group">
                <label for="subtitle">Subtitle:</label>
                <input type="text" id="subtitle" v-model="newEntry.subtitle" :placeholder="newEntry.subtitle"
                  @focus="handleFocus($event, 'subtitle')" @blur="handleBlur($event, 'subtitle')" />
              </div>
              <div class="form-group">
                <label for="question">Question:</label>
                <textarea id="question" v-model="newEntry.Question" :placeholder="newEntry.Question"
                  @focus="handleFocus($event, 'Question')" @blur="handleBlur($event, 'Question')"></textarea>
              </div>
              <div class="form-group">
                <label for="questionP2">Question Line 2 (optional):</label>
                <textarea id="questionP2" v-model="newEntry.questionP2" :placeholder="newEntry.questionP2"
                  @focus="handleFocus($event, 'questionP2')" @blur="handleBlur($event, 'questionP2')"></textarea>
              </div>
            </div>
          </details>

          <!-- Multiple Choice Options -->
          <details>
            <summary class="section-summary">
              <span class="summary-text">Add/Edit Answer Options</span>
              <span class="arrow-indicator">▼</span>
            </summary>
            <div class="form-section">
              <div class="form-group">
                <label for="option1">Option 1:</label>
                <input type="text" id="option1" v-model="newEntry.option1" :placeholder="newEntry.option1"
                  @focus="handleFocus($event, 'option1')" @blur="handleBlur($event, 'option1')" />
              </div>
              <div class="form-group">
                <label for="option2">Option 2:</label>
                <input type="text" id="option2" v-model="newEntry.option2" :placeholder="newEntry.option2"
                  @focus="handleFocus($event, 'option2')" @blur="handleBlur($event, 'option2')" />
              </div>
              <div class="form-group">
                <label for="option3">Option 3:</label>
                <input type="text" id="option3" v-model="newEntry.option3" :placeholder="newEntry.option3"
                  @focus="handleFocus($event, 'option3')" @blur="handleBlur($event, 'option3')" />
              </div>
              <div class="form-group">
                <label for="option4">Option 4:</label>
                <input type="text" id="option4" v-model="newEntry.option4" :placeholder="newEntry.option4"
                  @focus="handleFocus($event, 'option4')" @blur="handleBlur($event, 'option4')" />
              </div>
              <div class="form-group">
                <label for="option5">Option 5:</label>
                <input type="text" id="option5" v-model="newEntry.option5" :placeholder="newEntry.option5"
                  @focus="handleFocus($event, 'option5')" @blur="handleBlur($event, 'option5')" />
              </div>
              <div class="form-group">
                <label for="correctAnswer">Correct Answer (1-5):</label>
                <input type="number" id="correctAnswer" v-model="newEntry.correctAnswer" min="1" max="5" required
                  :placeholder="newEntry.correctAnswer" @focus="handleFocus($event, 'correctAnswer')"
                  @blur="handleBlur($event, 'correctAnswer')" />
              </div>
            </div>
          </details>

          <!-- Explanation toggle -->
          <div class="section-summary" @click="showExplanationSection = !showExplanationSection">
            <span class="summary-text">Add/Edit Explanation Section</span>
            <span class="arrow-indicator" :class="{ 'rotated': !showExplanationSection }">▼</span>
          </div>
        </div>
      </div>

      <!-- Wrap explanation section in v-show -->
      <div v-show="showExplanationSection" class="form-group-section explanation-section">
        <div class="explanation-toggles">
          <button type="button" @click="activeSection = activeSection === 'explanations' ? '' : 'explanations'"
            :class="['section-button', { active: activeSection === 'explanations' }]">
            Explanations
          </button>
          <button type="button" @click="activeSection = activeSection === 'media' ? '' : 'media'"
            :class="['section-button', { active: activeSection === 'media' }]">
            Media
          </button>
          <button type="button" @click="activeSection = activeSection === 'podcasts' ? '' : 'podcasts'"
            :class="['section-button', { active: activeSection === 'podcasts' }]">
            Podcasts
          </button>
          <button type="button" @click="handleCitationsClick"
            :class="['section-button', { active: activeSection === 'citations' }]">
            Citations
          </button>
          <button type="button" @click="handleResourcesClick"
            :class="['section-button', { active: activeSection === 'resources' }]">
            Resources
          </button>
          <button type="button" @click="activeSection = activeSection === 'cautions' ? '' : 'cautions'"
            :class="['section-button', { active: activeSection === 'cautions' }]">
            Cautions
          </button>
          <button type="button" @click="activeSection = activeSection === 'closing' ? '' : 'closing'"
            :class="['section-button', { active: activeSection === 'closing' }]">
            Closing
          </button>
        </div>

        <div class="explanation-content-wrapper">
          <!-- Explanations -->
          <div v-show="activeSection === 'explanations'" class="form-section">
            <div class="form-group">
              <label for="explanation">Primary Explanation:</label>
              <textarea id="explanation" v-model="newEntry.explanation" :placeholder="newEntry.explanation"
                @focus="handleFocus($event, 'explanation')" @blur="handleBlur($event, 'explanation')"></textarea>
            </div>
            <div class="form-group">
              <label for="explanation2">Secondary Explanation:</label>
              <textarea id="explanation2" v-model="newEntry.explanation2" :placeholder="newEntry.explanation2"
                @focus="handleFocus($event, 'explanation2')" @blur="handleBlur($event, 'explanation2')"></textarea>
            </div>
          </div>

          <!-- Media -->
          <div v-show="activeSection === 'media'" class="form-section">
            <div class="form-group">
              <label for="videoId">YouTube Video ID:</label>
              <input type="text" id="videoId" v-model="newEntry.videoId" :placeholder="newEntry.videoId"
                @focus="handleFocus($event, 'videoId')" @blur="handleBlur($event, 'videoId')" />
            </div>
            <div class="form-group">
              <label for="imageUrl">Image URL:</label>
              <input type="text" id="imageUrl" v-model="newEntry.imageUrl" :placeholder="newEntry.imageUrl"
                @focus="handleFocus($event, 'imageUrl')" @blur="handleBlur($event, 'imageUrl')" />
            </div>
            <div class="form-group">
              <label for="imageAltText">Image Alt Text:</label>
              <input type="text" id="imageAltText" v-model="newEntry.imageAltText" :placeholder="newEntry.imageAltText"
                @focus="handleFocus($event, 'imageAltText')" @blur="handleBlur($event, 'imageAltText')" />
            </div>
          </div>

          <!-- Podcast Episodes -->
          <div v-show="activeSection === 'podcasts'" class="form-section">
            <div class="form-group">
              <label for="podcastEpisode1-title">Episode 1 Title:</label>
              <input type="text" id="podcastEpisode1-title" v-model="newEntry.podcastEpisode.title"
                :placeholder="newEntry.podcastEpisode.title" @focus="handleFocus($event, 'podcastEpisode1-title')"
                @blur="handleBlur($event, 'podcastEpisode1-title')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode1-url">Episode 1 URL:</label>
              <input type="text" id="podcastEpisode1-url" v-model="newEntry.podcastEpisode.EpisodeUrl"
                :placeholder="newEntry.podcastEpisode.EpisodeUrl" @focus="handleFocus($event, 'podcastEpisode1-url')"
                @blur="handleBlur($event, 'podcastEpisode1-url')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode1-audio">Episode 1 Audio URL:</label>
              <input type="text" id="podcastEpisode1-audio" v-model="newEntry.podcastEpisode.audioUrl"
                :placeholder="newEntry.podcastEpisode.audioUrl" @focus="handleFocus($event, 'podcastEpisode1-audio')"
                @blur="handleBlur($event, 'podcastEpisode1-audio')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode1-desc">Episode 1 Description:</label>
              <textarea id="podcastEpisode1-desc" v-model="newEntry.podcastEpisode.description"
                :placeholder="newEntry.podcastEpisode.description" @focus="handleFocus($event, 'podcastEpisode1-desc')"
                @blur="handleBlur($event, 'podcastEpisode1-desc')"></textarea>
            </div>
            <div class="form-group">
              <label for="podcastEpisode1-time">Episode 1 Start Time (seconds):</label>
              <input type="number" id="podcastEpisode1-time" v-model="newEntry.podcastEpisode.podcastStartTime" min="0"
                :placeholder="newEntry.podcastEpisode.podcastStartTime"
                @focus="handleFocus($event, 'podcastEpisode1-time')"
                @blur="handleBlur($event, 'podcastEpisode1-time')" />
            </div>

            <hr class="section-divider">

            <div class="form-group">
              <label for="podcastEpisode2-title">Episode 2 Title:</label>
              <input type="text" id="podcastEpisode2-title" v-model="newEntry.podcastEpisode2.title"
                :placeholder="newEntry.podcastEpisode2.title" @focus="handleFocus($event, 'podcastEpisode2-title')"
                @blur="handleBlur($event, 'podcastEpisode2-title')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode2-url">Episode 2 URL:</label>
              <input type="text" id="podcastEpisode2-url" v-model="newEntry.podcastEpisode2.EpisodeUrl"
                :placeholder="newEntry.podcastEpisode2.EpisodeUrl" @focus="handleFocus($event, 'podcastEpisode2-url')"
                @blur="handleBlur($event, 'podcastEpisode2-url')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode2-audio">Episode 2 Audio URL:</label>
              <input type="text" id="podcastEpisode2-audio" v-model="newEntry.podcastEpisode2.audioUrl"
                :placeholder="newEntry.podcastEpisode2.audioUrl" @focus="handleFocus($event, 'podcastEpisode2-audio')"
                @blur="handleBlur($event, 'podcastEpisode2-audio')" />
            </div>
            <div class="form-group">
              <label for="podcastEpisode2-desc">Episode 2 Description:</label>
              <textarea id="podcastEpisode2-desc" v-model="newEntry.podcastEpisode2.description"
                :placeholder="newEntry.podcastEpisode2.description" @focus="handleFocus($event, 'podcastEpisode2-desc')"
                @blur="handleBlur($event, 'podcastEpisode2-desc')"></textarea>
            </div>
            <div class="form-group">
              <label for="podcastEpisode2-time">Episode 2 Start Time (seconds):</label>
              <input type="number" id="podcastEpisode2-time" v-model="newEntry.podcastEpisode2.podcastStartTime" min="0"
                :placeholder="newEntry.podcastEpisode2.podcastStartTime"
                @focus="handleFocus($event, 'podcastEpisode2-time')"
                @blur="handleBlur($event, 'podcastEpisode2-time')" />
            </div>
          </div>

          <!-- Citations -->
          <div v-show="activeSection === 'citations'" class="form-section">
            <div v-for="(citation, index) in newEntry.citations" :key="index" class="citation-group">
              <h3>Citation {{ index + 1 }}</h3>
              <div class="form-group">
                <label :for="`citation-${index}-title`">Title:</label>
                <input type="text" :id="`citation-${index}-title`" v-model="citation.title"
                  :placeholder="citation.title" @focus="handleFocus($event, `citation-${index}-title`)"
                  @blur="handleBlur($event, `citation-${index}-title`)" />
              </div>
              <div class="form-group">
                <label :for="`citation-${index}-author`">Author:</label>
                <input type="text" :id="`citation-${index}-author`" v-model="citation.author"
                  :placeholder="citation.author" @focus="handleFocus($event, `citation-${index}-author`)"
                  @blur="handleBlur($event, `citation-${index}-author`)" />
              </div>
              <div class="form-group">
                <label :for="`citation-${index}-url`">URL:</label>
                <input type="text" :id="`citation-${index}-url`" v-model="citation.url" :placeholder="citation.url"
                  @focus="handleFocus($event, `citation-${index}-url`)"
                  @blur="handleBlur($event, `citation-${index}-url`)" />
              </div>
              <div class="form-group">
                <label :for="`citation-${index}-year`">Year:</label>
                <input type="text" :id="`citation-${index}-year`" v-model="citation.year" :placeholder="citation.year"
                  @focus="handleFocus($event, `citation-${index}-year`)"
                  @blur="handleBlur($event, `citation-${index}-year`)" />
              </div>
              <div class="form-group">
                <label :for="`citation-${index}-image`">Image URL:</label>
                <input type="text" :id="`citation-${index}-image`" v-model="citation.imageUrl"
                  :placeholder="citation.imageUrl" @focus="handleFocus($event, `citation-${index}-image`)"
                  @blur="handleBlur($event, `citation-${index}-image`)" />
              </div>
            </div>
            <button type="button" @click="addCitation" class="add-button">Add Another Citation</button>
          </div>

          <!-- Resources -->
          <div v-show="activeSection === 'resources'" class="form-section">
            <div v-for="(resource, index) in newEntry.resources" :key="index" class="resource-group">
              <h3>Resource {{ index + 1 }}</h3>
              <div class="form-group">
                <label :for="`resource-${index}-title`">Title:</label>
                <input type="text" :id="`resource-${index}-title`" v-model="resource.title"
                  :placeholder="resource.title" @focus="handleFocus($event, `resource-${index}-title`)"
                  @blur="handleBlur($event, `resource-${index}-title`)" />
              </div>
              <div class="form-group">
                <label :for="`resource-${index}-author`">Author:</label>
                <input type="text" :id="`resource-${index}-author`" v-model="resource.author"
                  :placeholder="resource.author" @focus="handleFocus($event, `resource-${index}-author`)"
                  @blur="handleBlur($event, `resource-${index}-author`)" />
              </div>
              <div class="form-group">
                <label :for="`resource-${index}-url`">URL:</label>
                <input type="text" :id="`resource-${index}-url`" v-model="resource.url" :placeholder="resource.url"
                  @focus="handleFocus($event, `resource-${index}-url`)"
                  @blur="handleBlur($event, `resource-${index}-url`)" />
              </div>
              <div class="form-group">
                <label :for="`resource-${index}-description`">Description:</label>
                <textarea :id="`resource-${index}-description`" v-model="resource.description"
                  :placeholder="resource.description" @focus="handleFocus($event, `resource-${index}-description`)"
                  @blur="handleBlur($event, `resource-${index}-description`)"></textarea>
              </div>
            </div>
            <button type="button" @click="addResource" class="add-button">Add Another Resource</button>
          </div>

          <!-- Cautions -->
          <div v-show="activeSection === 'cautions'" class="form-section">
            <div class="form-group">
              <label for="cautionLevel">Caution Level:</label>
              <input type="text" id="cautionLevel" v-model="newEntry.cautionLevel" :placeholder="newEntry.cautionLevel"
                @focus="handleFocus($event, 'cautionLevel')" @blur="handleBlur($event, 'cautionLevel')" />
            </div>
            <div class="form-group">
              <label for="caution">Caution Text:</label>
              <textarea id="caution" v-model="newEntry.caution" :placeholder="newEntry.caution"
                @focus="handleFocus($event, 'caution')" @blur="handleBlur($event, 'caution')"></textarea>
            </div>
          </div>

          <!-- Closing -->
          <div v-show="activeSection === 'closing'" class="form-section">
            <div class="form-group">
              <label for="closingText">Closing Text:</label>
              <textarea id="closingText" v-model="newEntry.closingText" :placeholder="newEntry.closingText"
                @focus="handleFocus($event, 'closingText')" @blur="handleBlur($event, 'closingText')"></textarea>
            </div>
            <div class="form-group">
              <label for="closingText2">Additional Closing Text:</label>
              <textarea id="closingText2" v-model="newEntry.closingText2" :placeholder="newEntry.closingText2"
                @focus="handleFocus($event, 'closingText2')" @blur="handleBlur($event, 'closingText2')"></textarea>
            </div>
            <div class="form-group">
              <label for="modal">Modal Content:</label>
              <textarea id="modal" v-model="newEntry.modal" :placeholder="newEntry.modal"
                @focus="handleFocus($event, 'modal')" @blur="handleBlur($event, 'modal')"></textarea>
            </div>
          </div>
        </div>
      </div>

      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script>
import { sorQuizzesDb as db } from '../firebase';
import { quizStore } from '../stores/quizStore';
import QuizItem from './QuizItem.vue';
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

export default {
  components: {
    QuizItem,
    VueJsonPretty
  },
  setup() {
    const store = quizStore();
    return { store };
  },
  computed: {
    newEntry: {
      get() {
        return this.store.draftQuizEntry;
      },
      set(value) {
        this.store.updateDraftQuizEntry(value);
      }
    },
    formattedJson() {
      return JSON.stringify(this.newEntry, null, 2);
    }
  },
  watch: {
    'store.saveStatus': {
      handler(newStatus) {
        console.log('Save status changed:', newStatus);
      },
      deep: true
    }
  },
  data() {
    return {
      previewMode: false,
      jsonPreviewMode: false,
      showExplanationSection: false,
      returnButton: {
        active: false
      },
      submitStatus: {
        show: false,
        type: '',
        message: ''
      },
      submittedEntry: null,
      activeSection: ''
    }
  },
  methods: {
    addCitation() {
      this.store.draftQuizEntry.citations.push({
        title: '',
        author: '',
        url: '',
        year: '',
        imageUrl: '',
      });
    },
    removeCitation(index) {
      this.store.draftQuizEntry.citations.splice(index, 1);
    },
    addResource() {
      this.store.draftQuizEntry.resources.push({
        title: '',
        author: '',
        url: '',
        description: '',
      });
    },
    removeResource(index) {
      this.store.draftQuizEntry.resources.splice(index, 1);
    },
    async submitForm() {
      try {
        await this.store.recordQuizEdit();
        await this.store.saveDraftQuizEntry();
        this.submittedEntry = { ...this.newEntry };
        this.submitStatus = {
          show: true,
          type: 'success',
          message: 'Quiz entry submitted successfully!'
        };
      } catch (e) {
        this.submitStatus = {
          show: true,
          type: 'error',
          message: 'Error submitting quiz entry: ' + e.message
        };
      }
    },
    returnToQuizzes() {
      this.$router.push('/');
    },
    handleCitationsClick() {
      if (this.activeSection === 'citations') {
        this.activeSection = '';
      } else {
        this.activeSection = 'citations';
        if (!this.newEntry.citations || this.newEntry.citations.length === 0) {
          this.addCitation();
        }
      }
    },
    handleResourcesClick() {
      if (this.activeSection === 'resources') {
        this.activeSection = '';
      } else {
        this.activeSection = 'resources';
        if (!this.newEntry.resources || this.newEntry.resources.length === 0) {
          this.addResource();
        }
      }
    },
    handleFocus(event, field) {
      event.target._originalValue = event.target.value;
      this.newEntry[field] = '';
    },
    handleBlur(event, field) {
      if (!this.newEntry[field] && event.target._originalValue) {
        this.newEntry[field] = event.target._originalValue;
      }
    }
  }
};
</script>

<style scoped>
.new-item-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
}

.section-summary {
  background: rgba(74, 144, 226, 0.8);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.section-summary:hover {
  background: rgba(74, 144, 226, 0.9);
}

/* Remove default details marker */
details>summary {
  list-style: none;
}

details>summary::-webkit-details-marker {
  display: none;
}

/* Handle the connected appearance when details is open */
details[open] .section-summary {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

details[open] .form-section {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

/* Arrow indicator */
.arrow-indicator {
  transition: transform 0.2s;
}

details[open] .arrow-indicator {
  transform: rotate(180deg);
}

.form-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 20px;
}

.form-group {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  font-size: 0.95rem;
}

input[type="text"],
input[type="number"],
textarea {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  transition: all 0.2s ease;
  color: #333;
  padding: 8px;
}

input:focus,
textarea:focus {
  background: white;
  border-color: #4a90e2;
  outline: none;
}

button {
  padding: 5px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.citation-group,
.resource-group {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.citation-group:last-child,
.resource-group:last-child {
  border-bottom: none;
  margin-bottom: 10px;
}

.citation-group h3,
.resource-group h3 {
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.add-button,
.remove-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  margin-top: 10px;
}

.add-button {
  background-color: #4a90e2;
  color: white;
}

.remove-button {
  background-color: #dc3545;
  color: white;
  margin-top: 15px;
}

.add-button:hover {
  background-color: #357abd;
}

.remove-button:hover {
  background-color: #c82333;
}

h2 {
  margin-bottom: 15px;
  color: #333;
}

h3 {
  margin-bottom: 15px;
  color: #fff;
}

.save-status {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 4px;
  cursor: pointer;
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
}

.success {
  background-color: #4CAF50;
  color: white;
}

.error {
  background-color: #f44336;
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

details {
  margin-bottom: 0.5rem;
}

details[open] .section-summary {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: none;
}

details[open] .form-section {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.section-divider {
  margin: 16px 0;
  border: none;
  border-top: 1px solid #444;
}

.preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-controls-text {
  margin-right: 1rem;
  font-size: x-large;
  color: #333;
  font-weight: 500;
}

.button-group {
  display: flex;
  gap: 1rem;
}

.preview-toggle {
  background-color: #666;
  color: white;
  padding: 0.2rem .7rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.return-button {
  background-color: #666;
  color: white;
  padding: 0.2rem .7rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.smaller-button {
  max-height: 25px;
  font-size: 12px;
}

.return-button.active {
  background-color: #4CAF50;
}

.preview-toggle.active {
  background-color: #4CAF50;
}

.preview-section {
  margin: 2rem 0;
  padding: 2rem;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #2a2a2a;
  max-width: 800px;
  margin: 0 auto;
}

.form-group-section {
  background: rgba(63, 63, 136, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-group-section h2 {
  color: #fff;
  margin-bottom: 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #444;
}

.question-section {
  border-left: 4px solid #4CAF50;
  /* Green accent for question section */
}

.explanation-section {
  border-left: 4px solid #2196F3;
  /* Blue accent for explanation section */
}

/* Adjust spacing between sections within groups */
.form-group-section details {
  margin-bottom: 0.5rem;
}

.form-group-section details:last-child {
  margin-bottom: 0;
}

/* Make the section summaries slightly indented */
.form-group-section .section-summary {
  margin-left: 0.5rem;
}

.question-content-wrapper,
.explanation-content-wrapper {
  background: linear-gradient(135deg,
      rgba(63, 63, 136, 0.2) 0%,
      rgba(63, 63, 136, 0.1) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  padding: 0.5rem;
  border-radius: 4px;
}

.question-content-wrapper .form-section,
.explanation-content-wrapper .form-section {
  background-color: #3f3f88;
  /* Slightly darker than the wrapper */
}

.preview-options {
  display: flex;
  gap: 1rem;
  color: #fff;
}

.section-toggle {
  width: 100%;
  padding: 1rem;
  margin: 1rem 0;
  background-color: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
}

.section-toggle:hover {
  background-color: #333;
}

.json-preview {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  overflow-x: auto;
}

/* Override vue-json-pretty theme for dark mode */
:deep(.vjs-tree) {
  color: #fff;
  background-color: #1a1a1a;
}

:deep(.vjs-key) {
  color: #9cdcfe;
}

:deep(.vjs-value) {
  color: #ce9178;
}

:deep(.vjs-primitive) {
  color: #b5cea8;
}

@media screen and (max-width: 991px) {
  .smaller-button {
    max-height: fit-content;
    font-size: 12px;
  }
}

.submit-status {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.submit-status.success {
  background-color: #4CAF50;
  color: white;
}

.submit-status.error {
  background-color: #f44336;
  color: white;
}

.status-message {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}

.status-message.success {
  background-color: #4CAF50;
  color: white;
}

.status-message.error {
  background-color: #f44336;
  color: white;
}

.submitted-preview {
  margin-top: 2rem;
  padding: .2rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.submitted-preview h3 {
  margin-bottom: 1rem;
  color: #333;
}

.explanation-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: .7rem 1rem;
  padding: .7rem;
  background-color: white;
  border-radius: 8px;
}

.section-button {
  padding: 0.3rem .7rem;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.section-button:hover {
  background-color: #e0e0e0;
}

.section-button.active {
  background-color: #4a90e2;
  color: white;
  border-color: #357abd;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Or slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.form-group:has(textarea) {
  margin-bottom: 12px;
}

.form-group:has(textarea) label {
  margin-top: 0;
}

input::placeholder,
textarea::placeholder {
  color: #999;
  font-style: italic;
  transition: opacity 0.2s ease;
}

input:focus::placeholder,
textarea:focus::placeholder {
  opacity: 0.5;
}

/* When focused and empty */
input:focus:placeholder-shown,
textarea:focus:placeholder-shown {
  color: #ccc;
}
</style>
