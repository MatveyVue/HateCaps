<template>
<div v-if="isLoading" id="preloader">
  <div style="" class="loader">loading</div>
</div>

<h1>Slected Gift</h1>

<div style="margin-top: 10px; border-radius: 20px;" v-for="(person, index) in gifts" :key="index" class="profiles">
    <img style="margin-left: 10px;" class="icon" :src="person.icon" alt="Profile Icon" v-if="person.icon">
    <p class="nick">{{ person.name }}</p>
    <RouterLink style="text-decoration: none; color: Black; font-size: 16px;" v-if="person.link" :to="person.link">
        <button style="text-decoration: none; color: black; font-size: 14px;" class="view-btn">View</button>
    </RouterLink>
</div>


<div class="bar">
<div class="btn-container">
<RouterLink to="/market">
    <button class="market">
        <img style="position: absolute; margin-left: -17px; margin-top: 5px;" src="https://github.com/MatveyVue/icopn/blob/main/MarketActive.png?raw=true" width="33px"></img>
        <p style="margin-top: 40px; color: rgb(25, 122, 207);">Market</p>
    </button>
</RouterLink>
<RouterLink to="/">
    <button class="leaders">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/LeaderBoard.png?raw=true" width="40px"></img>
        <p style="margin-top: 40px; color: white;">Top</p>
    </button>
</RouterLink>
<RouterLink to="/profile">
    <button class="profile">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/Profile.png?raw=true" width="35px"></img>
        <p style="margin-top: 40px;">Profile</p>
    </button>
</RouterLink>
</div>
</div>
<p style="color: rgb(20, 20, 20);">.</p>
<p style="color: rgb(20, 20, 20);">.</p>
<p style="color: rgb(20, 20, 20);">.</p>
</template>


<script setup>
import { onMounted, ref } from 'vue';
import { gifts } from '../script/gifts.js'; 

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
}, 1000); // 10000 миллисекунд = 10 секунд
</script>
