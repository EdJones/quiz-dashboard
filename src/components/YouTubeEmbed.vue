<template>
  <div class="youtube-embed">
    <div class="video-container">
      <iframe :src="embedUrl" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>
  </div>
</template>

<script>
export default {
  name: 'YouTubeEmbed',
  props: {
    videoId: {
      type: String,
      required: true
    },
    startTime: {
      type: Number,
      default: 0
    }
  },
  computed: {
    embedUrl() {
      return `https://www.youtube.com/embed/${this.videoId}?rel=0&showinfo=0&autoplay=0&start=${this.startTime}`;
    }
  },
  methods: {
    onIframeLoad(event) {
      console.log('Iframe loaded, dimensions:', {
        width: event.target.offsetWidth,
        height: event.target.offsetHeight
      });
    }
  },
  mounted() {
    console.log('YouTube component mounted, videoId:', this.videoId);
  },
  updated() {
    console.log('YouTube component updated, videoId:', this.videoId);
  }
}
</script>

<style scoped>
.youtube-embed {
  width: 100%;
  max-width: 100%;
}

.video-container {
  position: relative;
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