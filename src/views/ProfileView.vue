<template>
<div v-if="isLoading" id="preloader">
  <div style="" class="loader">loading</div>
</div>
<center>
    <img class="profile-img" :src="photoUrl">
    <h2 style="color: white; margin-top: -10px;">{{ user }}</h2>
</center>

<h3>Your Rewards:</h3>
<div class="rewards">
    <img class="channel" src="https://github.com/MatveyVue/testcap/blob/main/scmd69.jpg?raw=true">
  <a style="text-decoration: none; color: white;" href="https://t.me/+sc77S2Dsuwc5MGNk">
    <p class="channel-name">$CMD69</p>
  </a>
    <p class="stars">{{ stars }}</p>
</div>

<div class="bar">
<div class="btn-container">
<RouterLink to="/market">
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
import { ref, onMounted } from 'vue'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const isLoading = ref(false)

window.addEventListener('load', function() {
});

setTimeout(function() {
    const preloader = document.getElementById('preloader');
    if (preloader) { // Проверяем, существует ли элемент
        preloader.classList.add('hidden'); // Добавляем класс для скрытия
    }
}, 3000); // 10000 миллисекунд = 10 секунд

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const user = ref(null)
const photoUrl = ref('https://github.com/MatveyVue/gift/blob/main/Anonim.png?raw=true')
const stars = ref(0)

onMounted(() => {
  const userData = window.Telegram?.WebApp?.initDataUnsafe?.user
  if (userData && userData.username) {
    user.value = userData.username
    photoUrl.value = userData.photo_url || photoUrl.value
    loadStars()
  } else {
    console.log('Пользователь еще не определен или данных нет')
  }
})

async function loadStars() {
  if (!user.value) {
    stars.value = 0
    return
  }

  try {
    const userDocRef = doc(db, 'users', user.value)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      const data = userDocSnap.data()
      console.log('Данные документа:', data)
      stars.value = data.stars || 0
    } else {
      stars.value = 0
      console.log('Пользователь не найден')
    }
  } catch (error) {
    console.error('Ошибка получения данных:', error)
    stars.value = 0
  }
}
</script>
