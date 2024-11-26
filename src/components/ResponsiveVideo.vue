<template>
  <div class="video-container">
    <iframe :src="youtubeEmbedUrl" frameborder="0" allowfullscreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
  </div>
</template>

<script>
export default {
  name: 'ResponsiveVideo',
  props: {
    videoId: {
      type: String,
      required: true
    }
  },
  computed: {
    youtubeEmbedUrl() {
      return `https://www.youtube.com/embed/${this.videoId}`
    }
  }
}
</script>

<style scoped>
.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  /* 16:9 Aspect Ratio */
  height: 0;
  overflow: hidden;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>