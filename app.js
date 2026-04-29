import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, onSnapshot, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAw0gQQ7wht2-K2UfPNPfBimtp93QSkTXs",
    authDomain: "first-aid-app-563c2.firebaseapp.com",
    projectId: "first-aid-app-563c2",
    storageBucket: "first-aid-app-563c2.firebasestorage.app",
    messagingSenderId: "974895823548",
    appId: "1:974895823548:web:643d6304a89e25c5a2aeb9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let current = new Date();

function render() {
    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('monthLabel');
    
    // Очищаем, оставляя заголовки Пн-Вс
    const headers = grid.querySelectorAll('.weekday');
    grid.innerHTML = '';
    headers.forEach(h => grid.appendChild(h));

    monthLabel.innerText = current.toLocaleString('ru', { month: 'long' });
    
    const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();

    for (let i = 1; i <= lastDay; i++) {
        const div = document.createElement('div');
        div.className = 'day';
        div.innerText = i;
        div.onclick = () => selectDay(i);
        grid.appendChild(div);
    }
}

function selectDay(day) {
    document.querySelectorAll('.day').forEach(d => d.style.background = 'none');
    event.target.style.background = '#FF5252';
    event.target.style.color = 'white';
    
    const list = document.getElementById('eventsList');
    list.innerHTML = `<div class="event-card">🔍 Ищем события на ${day} число...</div>`;
    // Тут будет твой запрос к Firestore
}

document.getElementById('menuBtn').onclick = () => document.getElementById('sidebar').classList.toggle('active');

render();
