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
        :class="[item.type, { caught: item.caught }]"
        :style="{ 
          left: item.x + 'px', 
          top: item.y + 'px',
          width: item.size + 'px',
          height: item.size + 'px',
          fontSize: item.fontSize + 'px',
          lineHeight: item.size + 'px'
        }"
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
    
    <!-- Меню выигрыша -->
    <div v-if="showWinScreen" class="win-screen">
      <center>
        <h2>🎉 YOU WIN!</h2>
        <p class="final-score">Final Score: {{ score }}</p>
        <p class="best-record" v-if="bestScore > 0">Best: {{ bestScore }}</p>
        <p class="new-record" v-if="isNewRecord && score > 0">🎉 NEW RECORD!</p>
        <div class="win-buttons">
          <button @click="playAgain" class="play-again-btn">🔄 PLAY AGAIN</button>
          <RouterLink to="/games">
            <button class="back-btn">⬅️ BACK TO MENU</button>
          </RouterLink>
        </div>
      </center>
    </div>
    
    <!-- Меню проигрыша -->
    <div v-if="showLoseScreen" class="game-over">
      <center>
        <h2 v-if="bombCaught">💥 BOOM!</h2>
        <h2 v-else>TIME'S UP!</h2>
        <p class="final-score">Score: {{ score }}</p>
        <p class="bomb-message" v-if="bombCaught">You caught a bomb!</p>
        <p class="best-record" v-if="bestScore > 0">Best: {{ bestScore }}</p>
        <p class="new-record" v-if="isNewRecord && score > 0">🎉 NEW RECORD!</p>
        <div style="display: none" class="save-status" :class="{ success: saveSuccess, error: saveError }">
          {{ saveMessage }}
        </div>
        <div class="game-over-buttons">
          <button @click="playAgain" class="play-again-btn">🔄 PLAY AGAIN</button>
          <RouterLink to="/games">
            <button class="back-btn">⬅️ BACK TO MENU</button>
          </RouterLink>
        </div>
        <button v-if="!firebaseInitialized && saveError" @click="retrySave" class="retry-btn">
          🔄 Retry Save
        </button>
      </center>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

// Добавляем переменные для отслеживания состояния
const bombCaught = ref(false);
const showWinScreen = ref(false);
const showLoseScreen = ref(false);

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
  { type: 'apple', icon: '🍎', value: 10, size: 70, fontSize: 45 },
  { type: 'star', icon: '⭐', value: 20, size: 65, fontSize: 40 },
  { type: 'bomb', icon: '💣', value: -1000, size: 75, fontSize: 50 }
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

// Очистка таймеров
const clearAllTimers = () => {
  timers.forEach(timer => clearInterval(timer));
  timers = [];
};

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
  console.log('💣 Бомба поймана?', bombCaught.value);
  console.log('🎉 Выиграл?', showWinScreen.value);
  
  saveMessage.value = 'Saving...';
  saveSuccess.value = false;
  saveError.value = false;
  
  // Всегда сохраняем лучший счет в localStorage
  localStorage.setItem(`best_score_${userData.value.id}`, bestScore.value.toString());
  console.log('📁 Сохранено в localStorage');
  
  // Проверяем Firebase
  if (!firebaseInitialized.value || !db) {
    console.log('❌ Firebase не готов, только локальное сохранение');
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
      lastScore: score.value,
      caughtBomb: bombCaught.value,
      wonGame: showWinScreen.value
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
        caughtBomb: bombCaught.value,
        wonGame: showWinScreen.value,
        timeLeft: time.value,
        timestamp: timestamp,
        date: dateStr,
        platform: userData.value.telegramId ? 'telegram' : 'web'
      };
      
      const gamesRef = db.collection('games');
      await gamesRef.add(gameData);
      console.log('✅ Игра сохранена в истории');
      
      saveSuccess.value = true;
      
    } catch (playerError) {
      console.error('❌ Ошибка сохранения игрока:', playerError);
      saveError.value = true;
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка сохранения:', error);
    saveError.value = true;
  }
};

// Повторная попытка сохранения
const retrySave = async () => {
  console.log('🔄 Повторная попытка сохранения...');
  await saveToFirebase();
};

// Генерация предмета
const generateItem = () => {
  const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
  const width = window.innerWidth;
  
  return {
    id: Date.now() + Math.random(),
    type: type.type,
    icon: type.icon,
    value: type.value,
    size: type.size,
    fontSize: type.fontSize,
    x: Math.random() * (width - type.size),
    y: -type.size,
    speed: 4 + Math.random() * 4,
    caught: false
  };
};

// Проверка коллизии
const checkCollision = (item, bucket) => {
  const itemCenterX = item.x + item.size / 2;
  const itemCenterY = item.y + item.size / 2;
  const bucketCenterX = bucket.x + 40;
  const bucketCenterY = bucket.y + 40;
  
  // Расстояние между центрами
  const distance = Math.sqrt(
    Math.pow(itemCenterX - bucketCenterX, 2) + 
    Math.pow(itemCenterY - bucketCenterY, 2)
  );
  
  const itemRadius = item.size * 0.35;
  const bucketRadius = 35;
  
  return distance < (itemRadius + bucketRadius);
};

// Начало игры
const startGame = async () => {
  console.log('🎮 Начало игры...');
  
  time.value = 30;
  score.value = 0;
  showWinScreen.value = false;
  showLoseScreen.value = false;
  bombCaught.value = false;
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
    if (time.value <= 0) endGameWithWin();
  }, 1000));
  
  // Генерация предметов
  timers.push(setInterval(() => {
    if (showWinScreen.value || showLoseScreen.value) return;
    
    items.value.push(generateItem());
    
    // Ограничиваем количество предметов
    if (items.value.length > 25) {
      items.value.splice(0, 3);
    }
  }, 800));
  
  // Игровой цикл
  timers.push(setInterval(() => {
    if (showWinScreen.value || showLoseScreen.value) return;
    
    const screenHeight = window.innerHeight;
    const updatedItems = [];
    
    items.value.forEach(item => {
      item.y += item.speed * 1.3;
      
      // Проверка столкновения
      if (checkCollision(item, bucketPosition.value)) {
        item.caught = true;
        
        // Если это бомба - мгновенный проигрыш
        if (item.type === 'bomb') {
          bombCaught.value = true;
          score.value = Math.max(0, score.value + item.value);
          
          // Эффект взрыва
          const bucket = document.querySelector('.bucket');
          if (bucket) {
            bucket.style.transform = 'scale(1.3)';
            bucket.style.filter = 'drop-shadow(0 0 30px rgba(255, 0, 0, 0.8))';
            setTimeout(() => {
              bucket.style.transform = 'scale(1)';
              bucket.style.filter = 'drop-shadow(0 4px 12px rgba(255, 165, 0, 0.6))';
            }, 300);
          }
          
          // Завершаем игру
          setTimeout(() => {
            endGameWithLoss();
          }, 500);
          
          return;
        } else {
          // Обычные предметы
          score.value += item.value;
          if (score.value < 0) score.value = 0;
          
          // Эффект при сборе
          const bucket = document.querySelector('.bucket');
          if (bucket) {
            bucket.style.transform = 'scale(1.15)';
            setTimeout(() => {
              bucket.style.transform = 'scale(1)';
            }, 100);
          }
        }
        
        // Удаляем предмет после задержки
        setTimeout(() => {
          const index = items.value.findIndex(i => i.id === item.id);
          if (index > -1) {
            items.value.splice(index, 1);
          }
        }, 150);
        
        return;
      }
      
      if (item.y < screenHeight + 100) updatedItems.push(item);
    });
    
    items.value = updatedItems;
  }, 16));
};

// Конец игры с выигрышем
const endGameWithWin = async () => {
  console.log('🎉 Выигрыш! Время истекло. Счет:', score.value);
  
  clearAllTimers();
  showWinScreen.value = true;
  
  // Проверяем новый рекорд
  if (score.value > bestScore.value) {
    console.log('🏆 НОВЫЙ РЕКОРД!');
    isNewRecord.value = true;
    bestScore.value = score.value;
  }
  
  console.log('📊 Новый лучший счет:', bestScore.value);
  
  // Сохраняем
  await saveToFirebase();
};

// Конец игры с проигрышем
const endGameWithLoss = async () => {
  console.log('⏹️ Игра окончена (проигрыш). Счет:', score.value);
  
  clearAllTimers();
  showLoseScreen.value = true;
  
  // Проверяем новый рекорд только если не поймали бомбу
  if (!bombCaught.value && score.value > bestScore.value) {
    console.log('🏆 НОВЫЙ РЕКОРД!');
    isNewRecord.value = true;
    bestScore.value = score.value;
  }
  
  console.log('📊 Новый лучший счет:', bestScore.value);
  
  // Сохраняем
  await saveToFirebase();
};

// Играть снова
const playAgain = () => {
  clearAllTimers();
  showWinScreen.value = false;
  showLoseScreen.value = false;
  bombCaught.value = false;
  items.value = [];
  countdown.value = 3;
  showCountdown.value = true;
  saveMessage.value = '';
  saveSuccess.value = false;
  saveError.value = false;
  setTimeout(startCountdown, 500);
};

// Вернуться в меню
const goToMenu = () => {
  clearAllTimers();
  router.push('/games');
};

// Управление ведром
const startDrag = (e) => {
  if (showWinScreen.value || showLoseScreen.value) return;
  isDragging.value = true;
  updateBucket(e.clientX, e.clientY);
};

const moveDrag = (e) => {
  if (!isDragging.value || showWinScreen.value || showLoseScreen.value) return;
  updateBucket(e.clientX, e.clientY);
};

const stopDrag = () => {
  isDragging.value = false;
};

// Обработка касаний для мобильных
const handleTouchStart = (e) => {
  if (showWinScreen.value || showLoseScreen.value) return;
  e.preventDefault();
  isDragging.value = true;
  const touch = e.touches[0];
  updateBucket(touch.clientX, touch.clientY);
};

const handleTouchMove = (e) => {
  if (!isDragging.value || showWinScreen.value || showLoseScreen.value) return;
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
  clearAllTimers();
  window.removeEventListener('resize', initGame);
});
</script>

<style scoped>
body {
  background-color: black;
  width: 100vw;
  height: 100vh;
}

.countdown {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
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
  width: 100vw;
  padding: 20px 12px 8px;
  z-index: 100;
  pointer-events: none;
  box-sizing: border-box;
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
  display: none;
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

/* Исправленная игровая область */
.game-area {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  touch-action: none;
  border-radius: none;
  background-color: black;
}

/* Увеличенные предметы */
.item {
  position: absolute;
  text-align: center;
  pointer-events: none;
  z-index: 10;
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
  box-sizing: border-box;
}

.item.apple {
  animation: float 2.5s ease-in-out infinite;
  filter: drop-shadow(0 0 15px rgba(255, 50, 50, 0.7));
}

.item.star {
  animation: spin 2s linear infinite, glow 1.5s alternate infinite;
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));
}

.item.bomb {
  animation: shake 0.5s infinite, bombGlow 1s alternate infinite;
  filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.9));
}

/* Анимация пойманного предмета */
.item.caught {
  animation: caught 0.3s forwards !important;
  z-index: 15;
  pointer-events: none;
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
  transition: transform 0.1s, filter 0.2s;
  user-select: none;
  pointer-events: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
}

.bucket:active {
  transform: scale(0.95);
}

/* Экран выигрыша */
.win-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  text-align: center;
  box-sizing: border-box;
}

.win-screen h2 {
  color: #4dff88;
  font-size: 48px;
  margin-bottom: 20px;
  text-shadow: 0 0 20px rgba(77, 255, 136, 0.8);
  animation: winGlow 1.5s infinite alternate;
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

.win-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
  width: 100%;
  max-width: 300px;
}

.play-again-btn {
  padding: 16px 32px;
  font-size: 18px;
  background: linear-gradient(to right, #00cc66, #00ff88);
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 204, 102, 0.4);
  transition: transform 0.2s;
  min-width: 250px;
  box-sizing: border-box;
}

.back-btn {
  padding: 16px 32px;
  font-size: 18px;
  background: linear-gradient(to right, #0066cc, #0099ff);
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.4);
  transition: transform 0.2s;
  min-width: 250px;
  text-decoration: none;
  display: inline-block;
  box-sizing: border-box;
}

.play-again-btn:hover, .back-btn:hover {
  transform: scale(1.05);
}

.play-again-btn:active, .back-btn:active {
  transform: scale(0.95);
}

/* Экран проигрыша */
.game-over {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  text-align: center;
  box-sizing: border-box;
}

.game-over h2 {
  color: #fff;
  font-size: 42px;
  margin-bottom: 24px;
  text-shadow: 0 0 15px #ff4500;
}

.game-over h2:first-child {
  color: #ff6b6b;
  text-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
}

.bomb-message {
  color: #ff6b6b;
  font-size: 22px;
  margin: 10px 0;
  font-weight: bold;
  animation: blink 0.8s infinite alternate;
}

.save-status {
  margin: 10px 0;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  display: block;
  min-height: 20px;
  box-sizing: border-box;
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

.game-over-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
  width: 100%;
  max-width: 300px;
}

.retry-btn {
  background: linear-gradient(to right, #0066ff, #00ccff) !important;
  margin-top: 15px !important;
  padding: 12px 24px;
  font-size: 16px;
  box-sizing: border-box;
}

/* Анимации */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.9; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glow {
  from { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.6)) brightness(1.2); }
  to { filter: drop-shadow(0 0 25px rgba(255, 215, 0, 1)) brightness(1.5); }
}

@keyframes bombGlow {
  from { 
    filter: drop-shadow(0 0 15px rgba(255, 0, 0, 0.7)) brightness(1.2); 
    transform: scale(1);
  }
  to { 
    filter: drop-shadow(0 0 25px rgba(255, 0, 0, 1)) brightness(1.5); 
    transform: scale(1.05);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0px) rotate(0deg); }
  25% { transform: translateX(-6px) rotate(-5deg); }
  75% { transform: translateX(6px) rotate(5deg); }
}

@keyframes glowText {
  from { text-shadow: 0 0 10px rgba(77, 255, 136, 0.8); }
  to { text-shadow: 0 0 20px rgba(77, 255, 136, 1); }
}

@keyframes winGlow {
  from { 
    text-shadow: 0 0 15px rgba(77, 255, 136, 0.8);
    transform: scale(1);
  }
  to { 
    text-shadow: 0 0 25px rgba(77, 255, 136, 1);
    transform: scale(1.05);
  }
}

@keyframes caught {
  0% { 
    transform: scale(1) rotate(0deg); 
    opacity: 1;
  }
  50% { 
    transform: scale(1.4) rotate(180deg); 
    opacity: 0.7;
  }
  100% { 
    transform: scale(0) rotate(360deg); 
    opacity: 0;
  }
}

@keyframes blink {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

@media (max-width: 768px) {
  .countdown-number { font-size: 70px; }
  .time { font-size: 24px; }
  .score { font-size: 28px; }
  .bucket { 
    width: 70px; 
    height: 70px; 
    font-size: 45px; 
    line-height: 65px; 
  }
  
  .win-screen h2 { font-size: 36px; }
  .game-over h2 { font-size: 36px; }
  
  .final-score { font-size: 28px; }
  .bomb-message { font-size: 20px; }
  .best-record { font-size: 20px; }
  .new-record { font-size: 24px; }
  
  .play-again-btn, .back-btn { 
    padding: 14px 28px; 
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
  
  /* Уменьшаем предметы на мобильных */
  .item.apple {
    width: 60px !important;
    height: 60px !important;
    font-size: 40px !important;
    line-height: 60px !important;
  }
  
  .item.star {
    width: 55px !important;
    height: 55px !important;
    font-size: 35px !important;
    line-height: 55px !important;
  }
  
  .item.bomb {
    width: 65px !important;
    height: 65px !important;
    font-size: 45px !important;
    line-height: 65px !important;
  }
}

/* Для очень маленьких экранов */
@media (max-width: 360px) {
  .bucket { 
    width: 65px; 
    height: 65px; 
    font-size: 40px; 
    line-height: 60px; 
  }
  
  .play-again-btn, .back-btn { 
    min-width: 180px;
    padding: 12px 24px;
  }
  
  .item.apple {
    width: 55px !important;
    height: 55px !important;
    font-size: 35px !important;
    line-height: 55px !important;
  }
  
  .item.star {
    width: 50px !important;
    height: 50px !important;
    font-size: 30px !important;
    line-height: 50px !important;
  }
  
  .item.bomb {
    width: 60px !important;
    height: 60px !important;
    font-size: 40px !important;
    line-height: 60px !important;
  }
}

/* Фикс для Safari и мобильных браузеров */
@supports (-webkit-touch-callout: none) {
  .game-container {
    height: -webkit-fill-available;
  }
  
  .game-area {
    height: -webkit-fill-available;
  }
  
  .win-screen,
  .game-over {
    height: -webkit-fill-available;
  }
}
</style>
