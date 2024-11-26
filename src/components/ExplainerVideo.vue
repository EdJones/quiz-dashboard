<template>
  <div class="explainer-video-wrapper">
    <YouTubeEmbed :videoId="videoId" :startTime="startTime" />
    <p v-if="caption" class="video-caption">{{ caption }}</p>
  </div>
</template>

<script>
import YouTubeEmbed from './YouTubeEmbed.vue'

export default {
  name: 'ExplainerVideo',
  components: {
    YouTubeEmbed
  },
  props: {
    videoId: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    },
    startTime: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style scoped>
.explainer-video-wrapper {
  width: 100%;
}

.video-caption {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #4a5568;
}
</style>