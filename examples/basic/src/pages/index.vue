<script setup lang="ts">
import { useFetch } from 'vite-ssr-vue3'

const imgs = await useFetch('img-demo', async() => {
  const res = await fetch('https://api.thecatapi.com/v1/images/search?limit=3')
  return res.json()
})

</script>

<template>
  <div>
    <div>Data Fetch</div>
    <ul>
      <li v-for="l in imgs" :key="l.url">
        <img :src="l.url" alt="">
      </li>
    </ul>
  </div>
</template>

<style>
ul {
  list-style: none;
  display: flex;
}
img {
  height: 200px;
  width: auto;
}
</style>
