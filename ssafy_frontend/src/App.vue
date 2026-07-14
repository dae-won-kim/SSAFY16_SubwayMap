<script setup>
</script>

<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/attractions">Attractions</router-link>
      <router-link to="/posts">Posts</router-link>
    </nav>
    <router-view />
  </div>
</template>

<style scoped>
nav {
  display: flex;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #ccc;
}

nav a {
  text-decoration: none;
  color: #333;
  font-weight: bold;
}

nav a:hover {
  color: #17a2b8;
}
</style>