<template>
<div id="preloader">
  <div style="" class="loader">loading</div>
</div>
<center>
    <img class="profile-img" src="https://github.com/MatveyVue/gift/blob/main/Anonim.png?raw=true">
    <h2 style="color: white;">{{ user }}</h2>
</center>

<h3>Your Rewards:</h3>
<div class="rewards">
    <img class="channel" src="https://github.com/MatveyVue/testcap/blob/main/scmd69.jpg?raw=true">
    <p class="channel-name">$CMD69</p>
    <p class="stars">{{ stars }}</p>
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
import { ref, onMounted } from 'vue'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

window.addEventListener('load', function() {
    // Убираем стандартное поведение при загрузке, т.к. будем использовать setTimeout
});

// Устанавливаем таймер на 10 секунд (10000 миллисекунд)
setTimeout(function() {
    const preloader = document.getElementById('preloader');
    if (preloader) { // Проверяем, существует ли элемент
        preloader.classList.add('hidden'); // Добавляем класс для скрытия
    }
}, 3000); // 10000 миллисекунд = 10 секунд

const firebaseConfig = {
  apiKey: "AIzaSyAC5LEXiZ-_LcPg3pUlb9tuDzQvUptHF7s",
  authDomain: "giftcaps.firebaseapp.com",
  databaseURL: "https://giftcaps-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "giftcaps",
  storageBucket: "giftcaps.appspot.com",
  messagingSenderId: "762854065131",
  appId: "1:762854065131:web:116cf5343de1d1e353cfae",
  measurementId: "G-LK9N0SKT0P"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const user = ref(null)
const stars = ref(0)

onMounted(() => {
  const userData = window.Telegram?.WebApp?.initDataUnsafe?.user
  if (userData && userData.username) {
    user.value = userData.username
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
