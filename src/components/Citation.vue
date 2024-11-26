<template>
  <div class="citation">
    <font-awesome-icon :icon="['fas', 'flask-vial']" class="citation-icon" />
    <div class="citation-content">
      <p class="citation-text">
        <span class="citation-title">{{ citation.title }}</span>, {{ citation.author }}, {{ citation.year }},
        <a :href="citation.url" target="_blank" class="citation-link" :title="citation.url">
          {{ truncatedUrl }}
        </a>
      </p>
      <p v-if="citation.fullText" class="citation-text full-text">
        <a :href="citation.fullText" target="_blank" class="citation-text-link" :title="citation.fullText">Full Text</a>
      </p>
    </div>
    <div v-if="citation.imageUrl" class="citation-image-wrapper">
      <img :src="citation.imageUrl" :alt="citation.imageAltText" class="citation-image" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Citation',
  props: {
    citation: {
      type: Object,
      required: true
    }
  },
  computed: {
    truncatedUrl() {
      if (this.citation.url.length <= 55) {
        return this.citation.url;
      }
      return this.citation.url.substring(0, 52) + '...';
    }
  }
}
</script>

<style scoped>
.citation {
  display: flex;
  /* Use flexbox for layout */
  align-items: flex-start;
  /* Align items to the top */
  gap: 1rem;
  /* Space between icon and text */
  border: 1px solid #ccc;
  /* Example border */
  background-color: #f9f9f9;
  /* Example background color */
  padding: 1rem;
  /* Padding around the citation */
  border-radius: 4px;
  /* Rounded corners */
}

.citation-icon {
  flex-shrink: 0;
  /* Prevent the icon from shrinking */
  margin-right: 0.5rem;
  /* Space between icon and text */
  font-size: 1.5rem;
  /* Adjust icon size as needed */
}

.citation-content {
  flex: 1;
  /* Allow content to take available space */
}

.citation-text {
  margin: 0;
  /* Reset margin */
  line-height: 1.5;
  /* Adjust line height for readability */
  text-align: left;
}

.citation-title {
  font-weight: bold;
  font-size: .95rem;
  color: #614f4f;
}

.citation-link {
  color: #3182ce;
  /* Link color */
  text-decoration: none;
  /* No underline */
}

.citation-link:hover {
  text-decoration: underline;
  /* Underline on hover */
}

.full-text {
  margin-top: 0.5rem;
  /* Add some space above the fullText link */
  display: block;
  /* Ensure it behaves as a block element */
}

.citation-image-wrapper {
  flex-shrink: 0;
  /* Prevent the image wrapper from shrinking */
  width: 100px;
  /* Fixed width for consistency */
}

.citation-image {
  width: 100%;
  /* Make the image responsive */
  height: auto;
  /* Maintain aspect ratio */
  object-fit: cover;
  /* Cover the area without distortion */
  border-radius: 4px;
  /* Rounded corners for the image */
}

@media (max-width: 640px) {
  .citation {
    flex-direction: row;
    /* Ensure horizontal layout on small screens */
    padding: 0.75rem;
  }

  .citation-icon {
    font-size: 1rem;
  }

  .citation-text {
    font-size: 0.75rem;
  }

  .citation-image-wrapper {
    width: 80px;
    /* Slightly smaller on very small screens */
  }
}
</style>
