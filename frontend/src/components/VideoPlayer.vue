<!-- src/components/VideoPlayer.vue
<template>
  <div class="video-player" ref="videoContainer"></div>
</template>

<script>
export default {
  name: 'VideoPlayer',
  props: {
    userId: {
      type: String,
      required: true
    },
    quality: {
      type: Number,
      default: 3 // 默认视频质量
    }
  },
  mounted() {
    this.attachVideo()
  },
  methods: {
    async attachVideo() {
      const zoomVideoService = this.$root.$zoomVideoService
      const stream = zoomVideoService.getStream()
      if (stream) {
        const userVideo = await stream.attachVideo(this.userId, this.quality)
        this.$refs.videoContainer.appendChild(userVideo)
      }
    },
    detachVideo() {
      const zoomVideoService = this.$root.$zoomVideoService
      const stream = zoomVideoService.getStream()
      if (stream) {
        stream.detachVideo(this.userId)
        this.$refs.videoContainer.innerHTML = ''
      }
    }
  },
  beforeUnmount() {
    this.detachVideo()
  }
}
</script>

<style scoped>
.video-player {
  width: 100%;
  height: 100%;
}
</style> -->
