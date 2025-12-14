<template>
  <center>
    <img v-if="photoUrl" :src="photoUrl" alt="Профильное фото" />
    <h2 style="color: white; margin-top: 50vw;">{{ user }}</h2>
  </center>

  <h3>Your Rewards:</h3>
  <div class="rewards">
    <img src="" />
    <p>CMD69</p>
    <p>{{ stars }}</p>
  </div>

  <!-- остальной шаблон -->
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

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

// Получение данных пользователя
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
