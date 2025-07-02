<script setup lang="ts">
import { computed } from 'vue'
import { useTranscript } from '@/composables/useTranscript'
import TranscriptItem from './TranscriptItem.vue'

const { mergedTranscript, getSpeakerColor } = useTranscript()

const isEmpty = computed(() => mergedTranscript.value.length === 0)
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="p-6 border-b border-gray-700 flex-shrink-0">
      <h2 class="text-lg font-semibold">Live Transcript</h2>
      <p class="text-sm text-gray-400 mt-1">
        {{ mergedTranscript.length }} entries • Real-time transcription with speaker diarization
      </p>
    </div>
    <div 
      id="transcript-container"
      class="flex-1 overflow-y-auto p-6 space-y-4"
    >
      <div v-if="isEmpty" class="flex flex-col items-center justify-center h-full text-center text-gray-500">
        <svg class="w-16 h-16 mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
        </svg>
        <p class="text-lg mb-2">No transcript yet</p>
        <p class="text-sm">Start recording to see live transcription</p>
      </div>
      
      <template v-else>
        <TranscriptItem
          v-for="entry in mergedTranscript"
          :key="entry.id"
          :entry="entry"
          :speaker-color="getSpeakerColor(entry.speaker)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
#transcript-container::-webkit-scrollbar {
  width: 6px;
}

#transcript-container::-webkit-scrollbar-track {
  background: rgba(55, 65, 81, 0.3);
  border-radius: 3px;
}

#transcript-container::-webkit-scrollbar-thumb {
  background: rgba(20, 184, 166, 0.5);
  border-radius: 3px;
}

#transcript-container::-webkit-scrollbar-thumb:hover {
  background: rgba(20, 184, 166, 0.7);
}
</style>
