<script setup lang="ts">
defineProps<{
  isRecording: boolean
  isDisabled?: boolean
}>()

const emit = defineEmits(['click'])
</script>

<template>
  <button
    @click="emit('click')"
    :disabled="isDisabled"
    :class="[
      'flex items-center justify-center w-16 h-16 rounded-full transition-all transform hover:scale-105',
      isRecording 
        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
        : 'bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/30',
      isDisabled && 'opacity-50 cursor-not-allowed'
    ]"
  >
    <svg 
      v-if="!isRecording" 
      class="w-6 h-6" 
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
    </svg>
    <div v-else class="w-4 h-4 bg-white rounded-sm"></div>
  </button>
</template>
