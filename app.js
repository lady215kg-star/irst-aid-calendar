import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc, orderBy 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
let selectedDateStr = "";

// --- ИНИЦИАЛИЗАЦИЯ ---
function init() {
    renderCalendar();
    setupEventListeners();
}

// --- ОТРИСОВКА КАЛЕНДАРЯ ---
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('monthDisplay');
    const yearLabel = document.getElementById('yearDisplay');

    grid.innerHTML = '';
    monthLabel.innerText = current.toLocaleString('ru', { month: 'long' });
    yearLabel.innerText = current.getFullYear();

    const year = current.getFullYear();
    const month = current.getMonth();

    // Первый день месяца и количество дней
    const firstDayIndex = new Date(year, month, 1).getDay();
    const shift = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Коррекция под Пн-Вс
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Пустые ячейки в начале
    for (let x = 0; x < shift; x++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day empty';
        grid.appendChild(empty);
    }

    // Дни месяца
    for (let i = 1; i <= lastDay; i++) {
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.innerText = i;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        div.onclick = () => selectDay(i, dateStr, div);
        grid.appendChild(div);

        // Если это сегодняшний день - выделим его
        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            div.classList.add('today');
        }
    }
}

// --- ВЫБОР ДНЯ И ЗАГРУЗКА ИЗ FIREBASE ---
function selectDay(day, dateStr, element) {
    selectedDateStr = dateStr;
    document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
    element.classList.add('selected');

    document.getElementById('selectedDateLabel').innerText = `${day} ${current.toLocaleString('ru', { month: 'long' })}`;
    
    // Раскрываем панель событий (Bottom Sheet)
    document.getElementById('bottomSheet').classList.add('expanded');

    // Слушаем Firestore
    const q = query(collection(db, "events"), where("date", "==", dateStr));
    onSnapshot(q, (snapshot) => {
        const list = document.getElementById('eventsList');
        list.innerHTML = '';

        if (snapshot.empty) {
            list.innerHTML = '<div class="empty-state">Нет событий на этот день</div>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-content">
                    <p class="event-title">${data.title}</p>
                    <p class="event-desc">${data.desc || ''}</p>
                </div>
                <button class="delete-btn" data-id="${docSnap.id}">✕</button>
            `;
            
            // Удаление
            card.querySelector('.delete-btn').onclick = async (e) => {
                e.stopPropagation();
                if(confirm("Удалить запись?")) await deleteDoc(doc(db, "events", docSnap.id));
            };

            list.appendChild(card);
        });
    });
}

// --- ОБРАБОТКА КНОПОК И МЕНЮ ---
function setupEventListeners() {
    // Навигация месяцев
    document.getElementById('prevMonth').onclick = () => { current.setMonth(current.getMonth() - 1); renderCalendar(); };
    document.getElementById('nextMonth').onclick = () => { current.setMonth(current.getMonth() + 1); renderCalendar(); };

    // Сайдбар
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const closeSidebar = document.getElementById('closeSidebar');

    menuBtn.onclick = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
    closeSidebar.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };
    overlay.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };

    // Модалка (Добавление)
    const openModal = document.getElementById('openModal');
    
    openModal.onclick = () => {
        if (!selectedDateStr) return alert("Сначала выбери дату!");
        const title = prompt("Что запланировано?");
        const desc = prompt("Описание (необязательно):");
        
        if (title) {
            addDoc(collection(db, "events"), {
                title: title,
                desc: desc,
                date: selectedDateStr,
                createdAt: new Date()
            });
        }
    };
}

init();
