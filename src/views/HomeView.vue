<template>
<div v-if="isLoading" id="preloader">
  <div style="" class="loader">loading</div>
</div>

<div v-for="(person, index) in top1" :key="index">
<center>
    <img class="icon-top" :src="person.icon" alt="Profile Icon" v-if="person.icon">
    <div class="top1">1</div>
    <a :href="person.link" v-if="person.link">
        <b><p class="nick-top">{{ person.nick }}</p></b>
    </a>
    <p style="margin-top: -15px;" class="item-top">{{ person.info }}</p>
</center>
</div> 

<div class="top2" v-for="(person, index) in top2" :key="index">
    <img class="icon-top23" :src="person.icon" alt="Profile Icon" v-if="person.icon">
    <div class="top-2">2</div>
    <a :href="person.link" v-if="person.link">
        <b><p style="margin-left: 15px;" class="nick-top23">{{ person.nick }}</p></b>
    </a>
    <p class="item-top23">{{ person.info }}</p>
</div> 

<div class="top3" v-for="(person, index) in top3" :key="index">
    <img class="icon-top23" :src="person.icon" alt="Profile Icon" v-if="person.icon">
    <div class="top-3">3</div>
    <a :href="person.link" v-if="person.link">
        <b><p class="nick-top23">{{ person.nick }}</p></b>
    </a>
    <p class="item-top23">{{ person.info }}</p>
</div> 

<p style="color: rgb(20, 20, 20); font-size: 10px;">.</p>
<div class="banner">
    <a href="https://t.me/+NHDUND_r4DlmMzk0">
        <img class="banner" src="https://github.com/MatveyVue/icopn/blob/main/Banner.jpg?raw=true"></img>
    </a>
</div>
<p style="color: rgb(20, 20, 20); font-size: 5px;">.</p>

<div style="margin-top: 10px;" v-for="(person, index) in profile" :key="index" class="profiles">
    <img class="icon" :src="person.icon" alt="Profile Icon" v-if="person.icon">
    <a :href="person.link" v-if="person.link">
        <p class="nick">{{ person.nick }}</p>
    </a>
    <p class="place">{{ person.info }}</p>
    <p class="items">{{ person.items }}</p>
</div> 
<p style="color: rgb(20, 20, 20);">.</p>
<p style="color: rgb(20, 20, 20);">.</p>
<p style="color: rgb(20, 20, 20);">.</p>

<div class="bar">
<div class="btn-container">
<RouterLink to="/market">
    <button class="market">
        <img style="position: absolute; margin-left: -17px; margin-top: 5px;" src="https://github.com/MatveyVue/icopn/blob/main/Market.png?raw=true" width="33px"></img>
        <p style="margin-top: 40px;">Market</p>
    </button>
</RouterLink>
    <button class="leaders">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/LeaderActive.png?raw=true" width="40px"></img>
        <p style="margin-top: 40px;">Top</p>
    </button>
<RouterLink to="/profile">
    <button class="profile">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/Profile.png?raw=true" width="35px"></img>
        <p style="margin-top: 40px;">Profile</p>
    </button>
</RouterLink>
</div>
</div>
</template>
  
<script setup>
import { onMounted, ref } from 'vue';
import { caps, profile, open, top1, top2, top3 } from '../script/home.js'; 
console.log(profile.value); 

const isLoading = ref(true);

onMounted(() => {
    isLoading.value = false;
});

window.addEventListener('load', function() {
});

setTimeout(function() {
    const preloader = document.getElementById('preloader');
    if (preloader) { // Проверяем, существует ли элемент
        preloader.classList.add('hidden'); // Добавляем класс для скрытия
    }
}, 5000); // 10000 миллисекунд = 10 секунд
</script>
  
<style scoped>
body {
    touch-action: none;
    overflow-y: scroll;
}
</style>
