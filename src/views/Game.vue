<template>
  <div class="game-container">
    <div v-if="showCountdown" class="countdown">
      <div class="countdown-number">{{ countdown }}</div>
    </div>
    
    <div class="game-ui">
      <div class="stats">
        <div class="stats-content">
          <div class="score">{{ score }}</div>
          <div class="time">{{ time }}s</div>
        </div>
      </div>
      
      <center>
        <div class="time-bar" :style="{ width: timePercent + '%' }"></div>
      </center>
      
      <div class="user-info" v-if="userData.username && userData.username !== 'Guest'">
        {{ userData.username }}
      </div>
      
      <div style="display: none" class="best-score-display" v-if="bestScore > 0">Best: {{ bestScore }}</div>
    </div>
    
    <div 
      class="game-area"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="stopDrag"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="stopDrag"
    >
      <div 
        v-for="item in items" 
        :key="item.id"
        class="item"
        :class="item.type"
        :style="{ left: item.x + 'px', top: item.y + 'px' }"
      >
        {{ item.icon }}
      </div>
      
      <div 
        class="bucket" 
        :style="{ left: bucketPosition.x + 'px', top: bucketPosition.y + 'px' }"
      >
        🗑️
      </div>
    </div>
    
    <div v-if="gameOver" class="game-over">
      <h2>GAME OVER</h2>
      <p class="final-score">Score: {{ score }}</p>
      <p class="best-record" v-if="bestScore > 0">Best: {{ bestScore }}</p>
      <p class="new-record" v-if="isNewRecord && score > 0">🎉 NEW RECORD!</p>
      <div class="save-status" :class="{ success: saveSuccess, error: saveError }">
        {{ saveMessage }}
      </div>
      <button @click="restartGame">PLAY AGAIN</button>
      <button v-if="!firebaseInitialized && saveError" @click="retrySave" class="retry-btn">
        🔄 Retry Save
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

// Firebase конфигурация
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

// Firebase переменные
let db = null;
let firebaseInitialized = ref(false);

// Динамическая загрузка Firebase
const loadFirebase = () => {
  return new Promise((resolve) => {
    if (typeof firebase !== 'undefined') {
      console.log('✅ Firebase уже загружен');
      resolve(true);
      return;
    }

    console.log('⬇️ Загружаем Firebase SDK...');
    
    // Загружаем Firebase скрипты
    const script1 = document.createElement('script');
    script1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js';
      script2.onload = () => {
        console.log('✅ Firebase SDK загружены');
        resolve(true);
      };
      script2.onerror = () => {
        console.error('❌ Ошибка загрузки Firestore');
        resolve(false);
      };
      document.head.appendChild(script2);
    };
    script1.onerror = () => {
      console.error('❌ Ошибка загрузки Firebase App');
      resolve(false);
    };
    document.head.appendChild(script1);
  });
};

// Проверка Firebase
const checkFirebase = () => {
  return typeof firebase !== 'undefined' && 
         firebase.app && 
         typeof firebase.initializeApp === 'function' &&
         typeof firebase.firestore === 'function';
};

// Инициализация Firebase
const initFirebase = async () => {
  console.log('🔥 Инициализация Firebase...');
  
  try {
    // Сначала загружаем Firebase SDK если они не загружены
    const loaded = await loadFirebase();
    if (!loaded) {
      console.log('❌ Не удалось загрузить Firebase SDK');
      firebaseInitialized.value = false;
      return false;
    }

    // Проверяем, доступен ли Firebase после загрузки
    if (!checkFirebase()) {
      console.log('❌ Firebase SDK не готов после загрузки');
      firebaseInitialized.value = false;
      return false;
    }
    
    let app;
    if (!firebase.apps.length) {
      console.log('🆕 Создаем новое Firebase приложение');
      app = firebase.initializeApp(firebaseConfig);
    } else {
      console.log('📌 Используем существующее Firebase приложение');
      app = firebase.apps[0];
    }
    
    db = firebase.firestore(app);
    
    firebaseInitialized.value = true;
    console.log('✅ Firebase инициализирован успешно');
    
    return true;
    
  } catch (error) {
    console.error('❌ Критическая ошибка Firebase:', error);
    firebaseInitialized.value = false;
    return false;
  }
};

// Реактивные переменные
const time = ref(30);
const score = ref(0);
const bestScore = ref(0);
const gameOver = ref(false);
const isNewRecord = ref(false);
const showCountdown = ref(true);
const countdown = ref(3);
const saveMessage = ref('');
const saveSuccess = ref(false);
const saveError = ref(false);

// Позиции ведра
const bucketPosition = ref({ x: 0, y: 0 });
const items = ref([]);

// Состояние перетаскивания
const isDragging = ref(false);

// Данные пользователя
const userData = ref({
  id: null,
  username: 'Guest',
  firstName: 'Player',
  lastName: '',
  languageCode: '',
  isPremium: false,
  photoUrl: '',
  isBot: false
});

// Предметы
const itemTypes = [
  { type: 'apple', icon: '🍎', value: 10 },
  { type: 'star', icon: '⭐', value: 20 },
  { type: 'bomb', icon: '💣', value: -30 }
];

// Компьютед
const timePercent = computed(() => (time.value / 30) * 50);

// Инициализация пользователя
const initUser = () => {
  console.log('👤 Инициализация пользователя...');
  
  // Проверяем Telegram WebApp
  const tg = window.Telegram?.WebApp;
  if (tg) {
    console.log('📱 Telegram WebApp обнаружен');
    tg.ready();
    tg.expand();
    
    const user = tg.initDataUnsafe?.user;
    console.log('👤 Данные Telegram user:', user);
    
    if (user) {
      userData.value = {
        id: user.id.toString(),
        username: user.username || 'TelegramUser',
        firstName: user.first_name || 'User',
        lastName: user.last_name || '',
        languageCode: user.language_code || '',
        isPremium: user.is_premium || false,
        photoUrl: user.photo_url || '',
        isBot: user.is_bot || false,
        telegramId: user.id.toString(),
        telegramUsername: user.username || '',
        telegramFirstName: user.first_name || '',
        telegramLastName: user.last_name || '',
        displayName: user.username || user.first_name || 'Player'
      };
      console.log('✅ Telegram пользователь:', userData.value);
    } else {
      // Telegram без пользователя
      userData.value = {
        id: `tg_guest_${Date.now()}`,
        username: 'TelegramGuest',
        firstName: 'Guest',
        displayName: 'Guest'
      };
      console.log('👤 Telegram без данных пользователя');
    }
  } else {
    // Веб-пользователь
    let userId = localStorage.getItem('web_user_id');
    if (!userId) {
      userId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('web_user_id', userId);
    }
    
    userData.value = {
      id: userId,
      username: 'WebPlayer',
      firstName: 'Player',
      displayName: 'WebPlayer',
      isTelegram: false
    };
    console.log('🌐 Веб-пользователь:', userData.value);
  }
  
  // Загружаем лучший счет из localStorage
  const saved = localStorage.getItem(`best_score_${userData.value.id}`);
  if (saved) {
    bestScore.value = parseInt(saved) || 0;
    console.log('📊 Лучший счет из localStorage:', bestScore.value);
  }
};

// Инициализация игры
const initGame = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  bucketPosition.value = { 
    x: (width - 80) / 2,
    y: height - 150 
  };
};

// Таймеры
let timers = [];

// Обратный отсчет
const startCountdown = () => {
  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      showCountdown.value = false;
      startGame();
    }
  }, 1000);
  timers.push(timer);
};

// Загрузка лучшего счета из Firebase
const loadBestScoreFromFirebase = async () => {
  if (!firebaseInitialized.value || !db) {
    console.log('⚠️ Firebase не готов, пропускаем загрузку');
    return;
  }
  
  try {
    console.log('🔍 Загружаем лучший счет из Firebase для ID:', userData.value.id);
    
    const playerRef = db.collection('players').doc(userData.value.id);
    const playerDoc = await playerRef.get();
    
    if (playerDoc.exists) {
      const data = playerDoc.data();
      console.log('📊 Данные игрока из Firebase:', data);
      
      const firebaseBestScore = Number(data.bestScore) || 0;
      const localBestScore = Number(bestScore.value) || 0;
      
      // Берем максимальный счет между Firebase и локальным
      const maxScore = Math.max(firebaseBestScore, localBestScore);
      
      if (maxScore > bestScore.value) {
        bestScore.value = maxScore;
        localStorage.setItem(`best_score_${userData.value.id}`, bestScore.value.toString());
        console.log('✅ Обновлен лучший счет:', bestScore.value);
      }
    } else {
      console.log('👤 Игрок не найден в Firebase');
    }
  } catch (error) {
    console.log('⚠️ Ошибка загрузки из Firebase:', error.message);
  }
};

// Сохранение в Firebase
const saveToFirebase = async () => {
  console.log('💾 Начинаем сохранение в Firebase...');
  console.log('👤 Пользователь:', userData.value.id);
  console.log('🎯 Счет:', score.value);
  console.log('🏆 Новый рекорд?', isNewRecord.value);
  
  saveMessage.value = 'Saving...';
  saveSuccess.value = false;
  saveError.value = false;
  
  // Всегда сохраняем в localStorage
  localStorage.setItem(`best_score_${userData.value.id}`, bestScore.value.toString());
  console.log('📁 Сохранено в localStorage');
  
  // Проверяем Firebase
  if (!firebaseInitialized.value || !db) {
    console.log('❌ Firebase не готов, только локальное сохранение');
    saveMessage.value = 'Score saved locally! 🎮';
    saveSuccess.value = true;
    return;
  }
  
  try {
    const timestamp = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString('ru-RU');
    
    // Подготовка базовых данных
    const basePlayerData = {
      userId: userData.value.id,
      username: userData.value.username || '',
      firstName: userData.value.firstName || '',
      lastName: userData.value.lastName || '',
      fullName: `${userData.value.firstName || ''} ${userData.value.lastName || ''}`.trim(),
      isTelegram: !!userData.value.telegramId,
      lastUpdated: timestamp,
      bestScore: bestScore.value,
      lastScore: score.value
    };
    
    // Добавляем Telegram данные если есть
    if (userData.value.telegramId) {
      basePlayerData.telegramId = userData.value.telegramId;
      basePlayerData.telegramUsername = userData.value.telegramUsername || '';
      basePlayerData.languageCode = userData.value.languageCode || '';
      basePlayerData.isPremium = userData.value.isPremium || false;
      basePlayerData.isBot = userData.value.isBot || false;
      basePlayerData.photoUrl = userData.value.photoUrl || '';
    }
    
    console.log('📝 Сохраняем данные игрока:', basePlayerData);
    
    // Обновляем запись игрока
    const playerRef = db.collection('players').doc(userData.value.id);
    
    try {
      const playerDoc = await playerRef.get();
      
      if (playerDoc.exists) {
        // Обновляем существующего игрока
        const existingData = playerDoc.data();
        const newGamesPlayed = (existingData.gamesPlayed || 0) + 1;
        const newTotalScore = (existingData.totalScore || 0) + score.value;
        
        const updateData = {
          ...basePlayerData,
          gamesPlayed: newGamesPlayed,
          totalScore: newTotalScore,
          updatedAt: timestamp,
          lastPlayed: timestamp
        };
        
        // Добавляем историю рекорда если это новый рекорд
        if (isNewRecord.value) {
          const recordHistory = existingData.recordHistory || [];
          recordHistory.push({
            score: score.value,
            date: timestamp,
            isNewRecord: true
          });
          updateData.recordHistory = recordHistory;
        }
        
        await playerRef.update(updateData);
        console.log('✅ Игрок обновлен в Firebase');
      } else {
        // Создаем нового игрока
        const newPlayerData = {
          ...basePlayerData,
          gamesPlayed: 1,
          totalScore: score.value,
          createdAt: timestamp,
          registrationDate: timestamp,
          platform: userData.value.telegramId ? 'telegram' : 'web'
        };
        
        // Добавляем историю рекорда если это новый рекорд
        if (isNewRecord.value) {
          newPlayerData.recordHistory = [{
            score: score.value,
            date: timestamp,
            isNewRecord: true
          }];
        }
        
        await playerRef.set(newPlayerData);
        console.log('✅ Новый игрок создан в Firebase');
      }
      
      // Сохраняем запись об игре
      const gameData = {
        userId: userData.value.id,
        score: score.value,
        isNewRecord: isNewRecord.value,
        timestamp: timestamp,
        date: dateStr,
        platform: userData.value.telegramId ? 'telegram' : 'web'
      };
      
      const gamesRef = db.collection('games');
      await gamesRef.add(gameData);
      console.log('✅ Игра сохранена в истории');
      
      saveMessage.value = 'Score saved to database! 🎮';
      saveSuccess.value = true;
      
    } catch (playerError) {
      console.error('❌ Ошибка сохранения игрока:', playerError);
      saveMessage.value = 'Error saving to database';
      saveError.value = true;
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка сохранения:', error);
    saveMessage.value = 'Connection error';
    saveError.value = true;
  }
};

// Повторная попытка сохранения
const retrySave = async () => {
  console.log('🔄 Повторная попытка сохранения...');
  await saveToFirebase();
};

// Начало игры
const startGame = async () => {
  console.log('🎮 Начало игры...');
  
  time.value = 30;
  score.value = 0;
  gameOver.value = false;
  isNewRecord.value = false;
  saveMessage.value = '';
  saveSuccess.value = false;
  saveError.value = false;
  items.value = [];
  
  initGame();
  
  // Загружаем лучший счет из Firebase
  if (firebaseInitialized.value) {
    console.log('🔄 Загружаем данные из Firebase...');
    loadBestScoreFromFirebase().catch(err => {
      console.log('⚠️ Загрузка из Firebase завершилась с ошибкой:', err.message);
    });
  }
  
  // Таймер игры
  timers.push(setInterval(() => {
    time.value--;
    if (time.value <= 0) endGame();
  }, 1000));
  
  // Генерация предметов
  timers.push(setInterval(() => {
    if (gameOver.value) return;
    
    const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    const width = window.innerWidth;
    
    items.value.push({
      id: Date.now() + Math.random(),
      type: type.type,
      icon: type.icon,
      value: type.value,
      x: Math.random() * (width - 60),
      y: -60,
      speed: 4 + Math.random() * 4
    });
    
    // Ограничиваем количество предметов для производительности
    if (items.value.length > 30) {
      items.value.splice(0, 5);
    }
  }, 600));
  
  // Игровой цикл
  timers.push(setInterval(() => {
    if (gameOver.value) return;
    
    const screenHeight = window.innerHeight;
    const updatedItems = [];
    
    items.value.forEach(item => {
      item.y += item.speed * 1.2;
      
      // Проверка столкновения
      if (item.y + 60 > bucketPosition.value.y && 
          item.y < bucketPosition.value.y + 80 &&
          item.x + 60 > bucketPosition.value.x && 
          item.x < bucketPosition.value.x + 80) {
        
        score.value += item.value;
        if (score.value < 0) score.value = 0;
        
        // Эффект при сборе
        const bucket = document.querySelector('.bucket');
        if (bucket) {
          bucket.style.transform = 'scale(1.1)';
          setTimeout(() => {
            bucket.style.transform = 'scale(1)';
          }, 100);
        }
        
        return;
      }
      
      if (item.y < screenHeight + 100) updatedItems.push(item);
    });
    
    items.value = updatedItems;
  }, 16));
};

// Конец игры
const endGame = async () => {
  console.log('⏹️ Игра окончена. Счет:', score.value);
  console.log('📊 Текущий лучший счет:', bestScore.value);
  
  gameOver.value = true;
  timers.forEach(timer => clearInterval(timer));
  timers = [];
  
  // Проверяем новый рекорд
  if (score.value > bestScore.value) {
    console.log('🏆 НОВЫЙ РЕКОРД!');
    isNewRecord.value = true;
    bestScore.value = score.value;
  }
  
  console.log('📊 Новый лучший счет:', bestScore.value);
  console.log('💾 Начинаем сохранение...');
  
  // Сохраняем
  await saveToFirebase();
};

// Перезапуск
const restartGame = () => {
  timers.forEach(timer => clearInterval(timer));
  timers = [];
  gameOver.value = false;
  items.value = [];
  countdown.value = 3;
  showCountdown.value = true;
  saveMessage.value = '';
  saveSuccess.value = false;
  saveError.value = false;
  setTimeout(startCountdown, 500);
};

// Управление ведром
const startDrag = (e) => {
  if (gameOver.value) return;
  isDragging.value = true;
  updateBucket(e.clientX, e.clientY);
};

const moveDrag = (e) => {
  if (!isDragging.value || gameOver.value) return;
  updateBucket(e.clientX, e.clientY);
};

const stopDrag = () => {
  isDragging.value = false;
};

// Обработка касаний для мобильных
const handleTouchStart = (e) => {
  if (gameOver.value) return;
  e.preventDefault();
  isDragging.value = true;
  const touch = e.touches[0];
  updateBucket(touch.clientX, touch.clientY);
};

const handleTouchMove = (e) => {
  if (!isDragging.value || gameOver.value) return;
  e.preventDefault();
  const touch = e.touches[0];
  updateBucket(touch.clientX, touch.clientY);
};

const updateBucket = (x, y) => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  let newX = x - 40;
  let newY = y - 40;
  
  newX = Math.max(10, Math.min(width - 90, newX));
  newY = Math.max(10, Math.min(height - 90, newY));
  
  bucketPosition.value = { x: newX, y: newY };
};

// Жизненный цикл
onMounted(async () => {
  console.log('🚀 Запуск игры...');
  console.log('🌍 URL:', window.location.href);
  console.log('📱 Telegram доступен?', !!window.Telegram?.WebApp);
  
  // Инициализируем пользователя
  initUser();
  initGame();
  
  // Инициализируем Firebase (асинхронно)
  const firebaseReady = await initFirebase();
  console.log('🔥 Firebase готов:', firebaseReady);
  
  // Если Firebase не готов, показываем сообщение
  if (!firebaseReady) {
    console.log('⚠️ Работаем в оффлайн режиме');
  }
  
  // Добавляем обработчик ресайза
  window.addEventListener('resize', initGame);
  
  // Запускаем обратный отсчет
  setTimeout(startCountdown, 1000);
});

onUnmounted(() => {
  timers.forEach(timer => clearInterval(timer));
  window.removeEventListener('resize', initGame);
});
</script>

<style scoped>
/* Стили оригинального дизайна */
.game-container {
  width: 100%;
  height: 100%;
  background: #000;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border-radius: 0;
}

.countdown {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.countdown-number {
  font-size: 100px;
  font-weight: bold;
  color: #ff4500;
  text-shadow: 0 0 30px rgba(255, 69, 0, 0.8);
  animation: pulse 1s infinite;
}

.game-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 20px 12px 8px;
  z-index: 100;
  pointer-events: none;
}

.stats {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.stats-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 50px;
}

.time {
  font-size: 20px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
}

.score {
  font-size: 36px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 15px rgba(100, 255, 100, 0.8);
  position: absolute;
  margin-top: 50px;
}

.best-score-display {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: #ffd700;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 12px;
  border-radius: 12px;
  display: block;
}

.user-info {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 10px;
  border-radius: 12px;
  display: block;
  display: none;
}

.time-bar {
  width: 50px;
  height: 6px;
  background: white;
  border-radius: 3px;
  transition: width 1s linear;
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
}

.game-area {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.item {
  position: absolute;
  width: 50px;
  height: 50px;
  font-size: 36px;
  text-align: center;
  line-height: 50px;
  pointer-events: none;
  z-index: 10;
}

.item.apple {
  animation: float 2s ease-in-out infinite;
  filter: drop-shadow(0 0 10px rgba(255, 50, 50, 0.6));
}

.item.star {
  animation: spin 1.5s linear infinite, glow 1s alternate infinite;
  filter: drop-shadow(0 0 15px gold);
}

.item.bomb {
  animation: shake 0.3s infinite;
  filter: drop-shadow(0 0 15px rgba(255, 0, 0, 0.8));
}

.bucket {
  position: absolute;
  width: 80px;
  height: 80px;
  font-size: 50px;
  text-align: center;
  line-height: 70px;
  z-index: 20;
  cursor: pointer;
  filter: drop-shadow(0 4px 12px rgba(255, 165, 0, 0.6));
  transition: transform 0.1s;
  user-select: none;
  pointer-events: none;
}

.bucket:active {
  transform: scale(0.95);
}

.game-over {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  text-align: center;
}

.game-over h2 {
  color: #fff;
  font-size: 42px;
  margin-bottom: 24px;
  text-shadow: 0 0 15px #ff4500;
}

.final-score {
  color: #fff;
  font-size: 32px;
  margin: 8px 0;
  font-weight: bold;
}

.best-record {
  color: #ffd700;
  font-size: 24px;
  margin: 8px 0;
  font-weight: 500;
}

.new-record {
  color: #4dff88;
  font-size: 28px;
  font-weight: bold;
  margin: 15px 0;
  text-shadow: 0 0 10px rgba(77, 255, 136, 0.8);
  animation: glowText 1s infinite alternate;
}

.save-status {
  margin: 10px 0;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  display: block;
}

.save-status.success {
  background: rgba(0, 255, 0, 0.2);
  color: #4dff88;
  display: none;
}

.save-status.error {
  background: rgba(255, 0, 0, 0.2);
  color: #ff6b6b;
}

.game-over button {
  margin-top: 24px;
  padding: 14px 36px;
  font-size: 18px;
  background: linear-gradient(to right, #ff4500, #ff8c00);
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(255, 69, 0, 0.4);
  transition: transform 0.2s;
}

.game-over button:hover {
  transform: scale(1.05);
}

.game-over button:active {
  transform: scale(0.95);
}

.retry-btn {
  background: linear-gradient(to right, #0066ff, #00ccff) !important;
  margin-top: 10px !important;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.9; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glow {
  from { filter: drop-shadow(0 0 6px gold) brightness(1.2); }
  to { filter: drop-shadow(0 0 20px gold) brightness(1.5); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0px); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes glowText {
  from { text-shadow: 0 0 10px rgba(77, 255, 136, 0.8); }
  to { text-shadow: 0 0 20px rgba(77, 255, 136, 1); }
}

@media (max-width: 768px) {
  .countdown-number { font-size: 70px; }
  .time { font-size: 24px; }
  .score { font-size: 28px; }
  .bucket { 
    width: 60px; 
    height: 60px; 
    font-size: 42px; 
    line-height: 60px; 
  }
  .item { 
    width: 45px; 
    height: 45px; 
    font-size: 32px; 
    line-height: 45px; 
  }
  .game-over h2 { font-size: 36px; }
  .final-score { font-size: 28px; }
  .best-record { font-size: 20px; }
  .new-record { font-size: 24px; }
  .game-over button { 
    padding: 12px 28px; 
    font-size: 16px; 
    min-width: 200px;
  }
  .retry-btn {
    min-width: 200px;
  }
  .user-info {
    font-size: 12px;
    top: 5px;
    right: 10px;
    padding: 3px 8px;
  }
  .best-score-display {
    font-size: 12px;
    padding: 3px 10px;
    top: 110px;
  }
}
</style>
