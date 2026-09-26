<script setup>
import { onMounted } from 'vue'
import { initAuthListener } from './services/auth.service'

onMounted(() => {
  initAuthListener()
})
</script>

<template>
  <router-view />
</template>
