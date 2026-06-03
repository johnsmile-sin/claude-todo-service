  // Import the functions you need from the SDKs you need 파이어베이스에서 필요한 SDK 함수를 가져온다
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
  import { getDatabase } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyC91guElxexnkx3qOogNwTPuySdSzcLOr8",
    authDomain: "vibe-coding-backend-b283f.firebaseapp.com",
    projectId: "vibe-coding-backend-b283f",
    storageBucket: "vibe-coding-backend-b283f.firebasestorage.app",
    messagingSenderId: "258797482776",
    appId: "1:258797482776:web:8290d6c859a4afbe75646d",
    databaseURL: "https://vibe-coding-backend-b283f-default-rtdb.asia-southeast1.firebasedatabase.app/" // 실시간 데이터베이스 URL 추가
  };

  // Initialize Firebase
  const firebaseApp = initializeApp(firebaseConfig);

export const db   = getDatabase(firebaseApp);
export const auth = getAuth(firebaseApp);
