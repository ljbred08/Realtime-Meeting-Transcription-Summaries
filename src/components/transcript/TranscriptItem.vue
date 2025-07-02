<script setup lang="ts">
import type { MergedTranscriptEntry } from '@/types'

defineProps<{
  entry: MergedTranscriptEntry
  speakerColor: string
}>()
</script>

<template>
  <div 
    :class="[
      'p-4 rounded-lg border-l-4 transition-all',
      entry.is_final ? 'bg-gray-700/30' : 'bg-gray-600/20 animate-pulse'
    ]"
    :style="{ borderLeftColor: speakerColor }"
  >
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-2">
        <span 
          class="text-sm font-medium"
          :style="{ color: speakerColor }"
        >
          {{ entry.speaker }}
        </span>
        <span v-if="entry.chunkCount > 1" class="text-xs bg-gray-600 px-2 py-1 rounded text-gray-300">
          {{ entry.chunkCount }} chunks
        </span>
      </div>
      <div class="flex items-center space-x-2 text-xs text-gray-400">
        <span>{{ new Date(entry.timestamp).toLocaleTimeString() }}</span>
        <span v-if="entry.confidence" class="bg-gray-600 px-2 py-1 rounded">
          {{ Math.round(entry.confidence * 100) }}%
        </span>
      </div>
    </div>
    <p class="text-gray-200 leading-relaxed">{{ entry.text }}</p>
  </div>
</template>
