<script setup lang="ts">
defineProps<{
  message: string | null
}>()
</script>

<template>
  <div v-if="message" class="mb-6">
    <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="text-red-400">{{ message }}</span>
      </div>
    </div>
  </div>
</template>
