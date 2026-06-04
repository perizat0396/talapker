// ═══════════════════════════════════════════════════════════════
//  ВСТАВЬТЕ ВАШИ ДАННЫЕ FIREBASE СЮДА
//  Firebase Console → Project Settings → Your apps → SDK setup
// ═══════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey:            "ВАШ_API_KEY",
  authDomain:        "ВАШ_PROJECT.firebaseapp.com",
  databaseURL:       "https://ВАШ_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "ВАШ_PROJECT",
  storageBucket:     "ВАШ_PROJECT.appspot.com",
  messagingSenderId: "ВАШИ_ЦИФРЫ",
  appId:             "ВАШ_APP_ID"
};

// Инициализация (не трогайте)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
