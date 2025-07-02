<script setup lang="ts">
import type { Summary } from '@/types'

defineProps<{
  summary: Summary
}>()
</script>

<template>
  <div class="grid grid-cols-3 gap-4 text-center">
    <div class="bg-gray-700/30 rounded-lg p-3">
      <div class="text-2xl font-bold text-teal-400">{{ summary.wordCount }}</div>
      <div class="text-xs text-gray-400">Words</div>
    </div>
    <div class="bg-gray-700/30 rounded-lg p-3">
      <div class="text-2xl font-bold text-teal-400">{{ summary.speakers.length }}</div>
      <div class="text-xs text-gray-400">Speakers</div>
    </div>
    <div class="bg-gray-700/30 rounded-lg p-3">
      <div class="text-2xl font-bold text-teal-400">AI</div>
      <div class="text-xs text-gray-400">Generated</div>
    </div>
  </div>
</template>
