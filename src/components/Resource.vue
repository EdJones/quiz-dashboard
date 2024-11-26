<template>
    <div class="resource">
        <div class="resource-content">
            <font-awesome-icon :icon="['fas', 'book']" class="resource-icon" />
            <p class="resource-text">
                {{ resource.title }}, {{ resource.author }}, {{ resource.year }},
                <a :href="resource.url" target="_blank" class="resource-link" :title="resource.url">
                    {{ truncatedUrl }}
                </a>
            </p>
        </div>
        <div v-if="resource.imageUrl" class="resource-image-wrapper">
            <img :src="resource.imageUrl" :alt="resource.imageAltText" class="resource-image" />
        </div>
    </div>
</template>

<script>
export default {
    name: 'Resource',
    props: {
        resource: {
            type: Object,
            required: true
        }
    },
    computed: {
        truncatedUrl() {
            if (this.resource.url.length <= 55) {
                return this.resource.url;
            }
            return this.resource.url.substring(0, 52) + '...';
        }
    }
}
</script>

<style scoped>
.resource {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    border: 1px solid #b4b9be;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
    background-color: #b4b9be;
    margin-top: 1rem;
}

.resource-content {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: flex-start;
}

.resource-icon {
    flex-shrink: 0;
    margin-right: 0.75rem;
    font-size: 1.25rem;
    color: #4a5568;
}

.resource-text {
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    color: #4a5568;
}

.resource-link {
    color: #3182ce;
    text-decoration: none;
    word-break: break-all;
}

.resource-link:hover {
    text-decoration: underline;
}

.resource-image-wrapper {
    flex-shrink: 0;
    width: 100px;
}

.resource-image {
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: 4px;
}

@media (max-width: 640px) {
    .resource {
        flex-direction: row;
        padding: 0.75rem;
    }

    .resource-icon {
        font-size: 1rem;
    }

    .resource-text {
        font-size: 0.75rem;
    }

    .resource-image-wrapper {
        width: 80px;
    }
}
</style>
