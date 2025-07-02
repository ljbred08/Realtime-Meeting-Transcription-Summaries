<script setup lang="ts">
defineProps<{
  audioLevel: number
  isRecording: boolean
}>()
</script>

<template>
  <div v-if="isRecording" class="flex-1 max-w-xs">
    <div class="flex items-center space-x-2">
      <span class="text-sm text-gray-400">Audio Level:</span>
      <div class="flex-1 bg-gray-700 rounded-full h-2">
        <div 
          class="bg-teal-400 h-2 rounded-full transition-all duration-100"
          :style="{ width: `${audioLevel * 100}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
