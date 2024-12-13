import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons'
import { faCircleMinus } from '@fortawesome/free-solid-svg-icons'
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons'
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { faUserSecret } from '@fortawesome/free-solid-svg-icons'
import { faFlaskVial } from '@fortawesome/free-solid-svg-icons'
import { faPodcast } from '@fortawesome/free-solid-svg-icons'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { faBook } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics only in production
if (import.meta.env.PROD) {
    inject({
        mode: 'production',
        debug: false,
    });
}

import Vue3Lottie from 'vue3-lottie'
import LiteYouTubeEmbed from 'vue-lite-youtube-embed';
import 'vue-lite-youtube-embed/style.css'

library.add(faUserSecret)
library.add(faCircleQuestion)
library.add(faCircleMinus)
library.add(faCircleXmark)
library.add(faCircleCheck)
library.add(faCheck)
library.add(faFlaskVial)
library.add(faPodcast)
library.add(faExternalLinkAlt)
library.add(faBook)
library.add(faGoogle)
library.add(faGithub)

const app = createApp(App)
const pinia = createPinia()

app.config.globalProperties.$userAnswers = []
app.use(Vue3Lottie)
app.use(pinia)
app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon)
app.component(LiteYouTubeEmbed)

// Initialize auth store
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()

// Initialize auth listener
authStore.initializeAuthListener()

// Handle any pending redirect results
authStore.handleRedirectResult().catch(console.error)

app.mount('#app')
