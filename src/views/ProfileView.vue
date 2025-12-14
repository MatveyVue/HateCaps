<template>
<div id="preloader">
  <div style="" class="loader">loading</div>
</div>

<center>
    <img v-if="photoUrl" :src="photoUrl" alt="Профильное фото" />
    <h2 style="color: white; margin-top: 50vw;">{{ user }}</h2>
</center>

<h3>Your Rewards:</h3>
<div class="rewards">
<img src=""></img>
<p>CMD69</p>
<p>{{ stars }}</p>
</div>

<div class="bar">
<div class="btn-container">
<RouterLink to="market">
    <button class="market">
        <img style="position: absolute; margin-left: -17px; margin-top: 5px;" src="https://github.com/MatveyVue/icopn/blob/main/Market.png?raw=true" width="33px"></img>
        <p style="margin-top: 40px; color: white;">Market</p>
    </button>
</RouterLink>
<RouterLink to="/">
    <button class="leaders">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/LeaderBoard.png?raw=true" width="40px"></img>
        <p style="margin-top: 40px; color: white;">Top</p>
    </button>
</RouterLink>
    <button class="profile">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/ProfileActive.png?raw=true" width="35px"></img>
        <p style="margin-top: 40px; color: rgb(25, 122, 207);">Profile</p>
    </button>
</div>
</div>
</template>
    
<script setup>
import { caps, profile, open, top1, top2, top3 } from '../script/home.js'; 
console.log(profile.value); 

window.addEventListener('load', function() {
    // Убираем стандартное поведение при загрузке, т.к. будем использовать setTimeout
});

// Устанавливаем таймер на 10 секунд (10000 миллисекунд)
setTimeout(function() {
    const preloader = document.getElementById('preloader');
    if (preloader) { // Проверяем, существует ли элемент
        preloader.classList.add('hidden'); // Добавляем класс для скрытия
    }
}, 5000); // 10000 миллисекунд = 10 секунд
</script>

<script>
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAC5LEXiZ-_LcPg3pUlb9tuDzQvUptHF7s",
  authDomain: "giftcaps.firebaseapp.com",
  databaseURL: "https://giftcaps-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "giftcaps",
  storageBucket: "giftcaps.firebasestorage.app",
  messagingSenderId: "762854065131",
  appId: "1:762854065131:web:116cf5343de1d1e353cfae",
  measurementId: "G-LK9N0SKT0P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default {
  data() {
    const userData = window.Telegram.WebApp.initDataUnsafe.user || {};
    return {
      user: userData.username || null,
      stars: 0,
    };
  },
  mounted() {
    this.loadStars();
  },
  methods: {
    async loadStars() {
      if (!this.user) {
        this.stars = 0;
        return;
      }

      try {
        const userDocRef = doc(db, 'users', this.user);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          this.stars = data.stars || 0;
        } else {
          this.stars = 0; // Пользователь не найден — отображаем 0
        }
      } catch (error) {
        console.error('Ошибка получения данных:', error);
        this.stars = 0;
      }
    },
  },
};
</script>
