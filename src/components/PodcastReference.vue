<template>
    <div v-if="podcastEpisode" class="podcast-reference">
        <div class="podcast-header">
            <font-awesome-icon icon="podcast" class="podcast-icon" />
            <h4 class="podcast-title">{{ podcastEpisode.title }}</h4>
        </div>
        <div class="podcast-content">
            <audio ref="audio" :src="podcastEpisode.audioUrl" controls class="podcast-player"></audio>
            <p v-if="podcastEpisode.description" class="podcast-description">{{ podcastEpisode.description }}</p>
            <a :href="podcastEpisode.EpisodeUrl" target="_blank" rel="noopener noreferrer" class="podcast-link">
                <font-awesome-icon icon="external-link-alt" /> &nbsp; Episode Page
            </a>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PodcastReference',
    props: {
        podcastEpisode: {
            type: Object,
            default: () => ({
                title: '',
                EpisodeUrl: '',
                audioUrl: '',
                description: '',
                podcastStartTime: 0
            })
        }
    },
    mounted() {
        console.log('PodcastReference mounted, podcastEpisode:', this.podcastEpisode);
        if (this.podcastEpisode && this.podcastEpisode.podcastStartTime > 0) {
            this.$nextTick(() => {
                this.$refs.audio.currentTime = this.podcastEpisode.podcastStartTime;
            });
        }
    }
}
</script>

<style scoped>
.podcast-reference {
    width: 100%;
    max-width: 66.666%;
    margin-left: auto;
    margin-top: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background-color: #ffffff;
}

.podcast-header {
    display: flex;
    align-items: center;
    padding: 0.7rem .5rem;
    background-color: #f0f4f8;
    /* Lighter background color */
    border-bottom: 1px solid #e2e8f0;
}

.podcast-icon {
    font-size: 1.25rem;
    margin-right: 0.75rem;
    color: #4a5568;
}

.podcast-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 400;
    /* Less weight */
    color: #2d3748;
}

.podcast-content {
    padding: 1rem;
    padding-bottom: 0rem;
}

.podcast-player {
    width: 100%;
    margin-bottom: 1rem;
}

.podcast-description {
    font-size: 0.8rem;
    color: #4a5568;
    margin-bottom: .5rem;
    line-height: 1.5;
    text-align: left;
}

.podcast-link {
    display: inline-flex;
    align-items: center;
    color: #7f8386;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.7rem;
    transition: color 0.2s ease;
}

.podcast-link:hover {
    color: #2c5282;
    text-decoration: underline;
}

.podcast-link .fa-external-link-alt {
    margin-right: 0.5rem;
    font-size: 0.8rem;
}

@media (max-width: 768px) {
    .podcast-reference {
        max-width: 100%;
    }
}
</style>