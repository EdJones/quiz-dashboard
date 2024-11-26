<template>
  <div class="explainer-image-wrapper">
    <figure>
      <img :src="imageUrl" :alt="altText" class="explainer-image">
      <figcaption class="text-center text-muted text-xs">{{ altText }}</figcaption>
    </figure>
  </div>
</template>

<script>
export default {
  name: 'ExplainerImage',
  props: {
    imageUrl: {
      type: String,
      required: true
    },
    altText: {
      type: String,
      default: 'Explanation image'
    }
  },
  mounted() {
    console.log("In ExplainerImage, imageUrl is: ", this.imageUrl)
  }
}
</script>

<style scoped>
.explainer-image-wrapper {
  flex: 0 0 33.333%;
  max-width: 33.333%;
}

.explainer-image {
  width: 90%;
  height: auto;
  object-fit: cover;
}

@media (max-width: 768px) {
  .explainer-image-wrapper {
    flex: 0 0 100%;
    max-width: 100%;
    max-height: 100%;
    margin-top: 1rem;
  }
}
</style>