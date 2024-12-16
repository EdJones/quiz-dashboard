import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
    faUserSecret, faCircleQuestion, faCircleMinus,
    faCircleXmark, faCircleCheck, faCheck, faFlaskVial,
    faPodcast, faExternalLinkAlt, faBook
} from '@fortawesome/free-solid-svg-icons'
import {
    faGoogle, faGithub
} from '@fortawesome/free-brands-svg-icons'

// Create app instance
const app = createApp(App)

// Create and use Pinia before any store usage
const pinia = createPinia()
app.use(pinia)

// Import auth store after Pinia is installed
import { useAuthStore } from './stores/auth'

// Use router
app.use(router)

// Configure FontAwesome
app.component('font-awesome-icon', FontAwesomeIcon)
library.add(
    faUserSecret, faCircleQuestion, faCircleMinus,
    faCircleXmark, faCircleCheck, faCheck, faFlaskVial,
    faPodcast, faExternalLinkAlt, faBook, faGoogle, faGithub
)

// Mount the app
app.mount('#app')
