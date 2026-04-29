import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// 1. ИНИЦИАЛИЗАЦИЯ
function init() {
    renderCalendar();
    setupMenu();
    
    // Слушатель для кнопки "Добавить" в Bottom Sheet
    document.getElementById('openModal').onclick = openEventModal;
}

// 2. РАБОТА С МЕНЮ (SIDEBAR)
function setupMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    document.getElementById('menuBtn').onclick = () => {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    };

    document.getElementById('closeSidebar').onclick = closeMenu;
    overlay.onclick = closeMenu;

    // Ссылки на обучение и презентацию
    const trainingLink = "https://disk.yandex.ru/d/bRkh0mJBhW5llQ";
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            window.open(trainingLink, '_blank');
            closeMenu();
        };
    });
}

function closeMenu() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

// 3. КАЛЕНДАРЬ
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    document.getElementById('monthDisplay').innerText = current.toLocaleString('ru', { month: 'long' });
    document.getElementById('yearDisplay').innerText = current.getFullYear();

    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const shift = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let x = 0; x < shift; x++) grid.appendChild(createDay('', 'empty'));

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEl = createDay(i, 'cal-day');
        
        // Подсветка сегодня
        if (new Date().toDateString() === new Date(year, month, i).toDateString()) dayEl.classList.add('today');
        
        dayEl.onclick = () => {
            document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
            dayEl.classList.add('selected');
            selectedDateStr = dateStr;
            loadEvents(dateStr);
        };
        grid.appendChild(dayEl);
    }
}

function createDay(text, cls) {
    const d = document.createElement('div');
    d.className = cls;
    d.innerText = text;
    return d;
}

// 4. ЗАГРУЗКА СОБЫТИЙ И ЗАПИСЬ
function loadEvents(dateStr) {
    const list = document.getElementById('eventsList');
    document.getElementById('bottomSheet').classList.add('expanded');
    document.getElementById('selectedDateLabel').innerText = dateStr;

    const q = query(collection(db, "events"), where("date", "==", dateStr));
    onSnapshot(q, (snap) => {
        list.innerHTML = '';
        if (snap.empty) {
            list.innerHTML = '<p class="empty-state">Событий нет. Будь первым!</p>';
            return;
        }

        snap.forEach(docSnap => {
            const ev = docSnap.data();
            const isFull = ev.currentParticipants >= ev.maxParticipants;
            
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-info">
                    <strong>${ev.title}</strong>
                    <p>${ev.time} | Мест: ${ev.currentParticipants}/${ev.maxParticipants}</p>
                    ${isFull ? '<span style="color:red; font-size:12px;">ЗАБИТО</span>' : ''}
                </div>
                <div class="event-actions">
                    <button class="join-btn" ${isFull ? 'disabled' : ''} onclick="joinEvent('${docSnap.id}')">
                        ${isFull ? 'Мест нет' : 'Записаться'}
                    </button>
                    <button class="del-btn" onclick="deleteEvent('${docSnap.id}')">✕</button>
                </div>
            `;
            list.appendChild(card);
        });
    });
}

// 5. ФУНКЦИИ FIREBASE
async function openEventModal() {
    if (!selectedDateStr) return alert("Сначала выбери день!");
    
    const title = prompt("Название мероприятия:");
    const time = prompt("Время (например, 14:00):");
    const max = parseInt(prompt("Сколько максимум человек?"), 10);

    if (title && time && max) {
        await addDoc(collection(db, "events"), {
            title, time, date: selectedDateStr, 
            maxParticipants: max, currentParticipants: 0
        });
    }
}

window.joinEvent = async (id) => {
    const eventRef = doc(db, "events", id);
    await updateDoc(eventRef, { currentParticipants: increment(1) });
    alert("Вы успешно записаны!");
};

window.deleteEvent = async (id) => {
    if (confirm("Удалить?")) await deleteDoc(doc(db, "events", id));
};

// Навигация
document.getElementById('prevMonth').onclick = () => { current.setMonth(current.getMonth() - 1); renderCalendar(); };
document.getElementById('nextMonth').onclick = () => { current.setMonth(current.getMonth() + 1); renderCalendar(); };

init();
