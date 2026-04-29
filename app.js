import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

let currentDate = new Date();
let selectedDateStr = null;

// Элементы
const calendarGrid = document.getElementById('calendarGrid');
const eventsContainer = document.getElementById('eventsContainer');
const modal = document.getElementById('modal');

// Открытие/закрытие модалки
document.getElementById('openModal').onclick = () => modal.style.display = 'flex';
document.getElementById('closeModal').onclick = () => modal.style.display = 'none';

// Рендер календаря
// Функция для проверки состояния всех дней месяца
async function renderCalendar() {
    calendarGrid.innerHTML = '';
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    // Достоверное название месяца через Intl
    const monthFormatter = new Intl.DateTimeFormat('ru', { month: 'long', year: 'numeric' });
    document.getElementById('monthDisplay').innerText = monthFormatter.format(currentDate);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const shift = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Пустые ячейки
    for (let x = 0; x < shift; x++) {
        calendarGrid.appendChild(document.createElement('div'));
    }

    // Загружаем все события месяца одним махом для раскраски
    const q = query(collection(db, "events"));
    const querySnapshot = await getDocs(q);
    const eventsMap = {};
    querySnapshot.forEach(doc => {
        eventsMap[doc.data().date] = { ...doc.data(), id: doc.id };
    });

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.innerText = i;
        const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        // ЛОГИКА ЦВЕТОВ
        if (eventsMap[fullDate]) {
            const event = eventsMap[fullDate];
            // Проверяем кол-во участников в коллекции participants
            const partQ = query(collection(db, "participants"), where("eventId", "==", event.id));
            const partSnap = await getDocs(partQ);
            const count = partSnap.size;

            if (count >= (event.limit || 100)) {
                dayDiv.style.background = "#b71c1c"; // Темно-красный (FULL)
                dayDiv.style.color = "white";
            } else {
                dayDiv.style.background = "#f85c5c"; // Красный (Есть места)
                dayDiv.style.color = "white";
            }
        } else {
            dayDiv.style.background = "white"; // Белый (Пусто)
        }

        dayDiv.onclick = () => {
            document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
            dayDiv.classList.add('selected');
            selectedDateStr = fullDate;
            loadEvents(fullDate);
        };
        calendarGrid.appendChild(dayDiv);
    }
}

// При сохранении события не забудь добавить лимит:
document.getElementById('saveEvent').onclick = async () => {
    const title = document.getElementById('eventTitle').value;
    const time = document.getElementById('eventTime').value;
    const place = document.getElementById('eventPlace').value;
    const limit = parseInt(document.getElementById('eventLimit').value) || 10;

    await addDoc(collection(db, "events"), {
        title, time, place, date: selectedDateStr, limit: limit
    });
    
    modal.style.display = 'none';
    renderCalendar(); // Перерисовываем календарь, чтобы день стал красным
};

// Загрузка событий из Firebase
async function loadEvents(dateStr) {
    eventsContainer.innerHTML = 'Загрузка...';
    const q = query(collection(db, "events"), where("date", "==", dateStr));
    const querySnapshot = await getDocs(q);
    
    eventsContainer.innerHTML = '';
    if (querySnapshot.empty) {
        eventsContainer.innerHTML = '<p>На этот день пока нет планов.</p>';
        return;
    }

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <h4>${data.title}</h4>
            <p class="event-info">⏰ Время: ${data.time}</p>
            <p class="event-info">📍 Место: ${data.place}</p>
            <button class="join-btn-small" onclick="joinEvent('${doc.id}', '${data.title}')">Записаться</button>
        `;
        eventsContainer.appendChild(card);
    });
}

// Создание нового события
document.getElementById('saveEvent').onclick = async () => {
    const title = document.getElementById('eventTitle').value;
    const time = document.getElementById('eventTime').value;
    const place = document.getElementById('eventPlace').value;

    if (!selectedDateStr || !title) return alert("Выбери дату и введи название!");

    await addDoc(collection(db, "events"), {
        title, time, place, date: selectedDateStr
    });
    
    modal.style.display = 'none';
    loadEvents(selectedDateStr);
};

// Функция записи (глобальная для доступа из HTML)
window.joinEvent = async (eventId, eventTitle) => {
    const name = prompt("Ваше имя?");
    if (name) {
        await addDoc(collection(db, "participants"), {
            eventId, eventTitle, name, date: new Date()
        });
        alert("Вы успешно записаны!");
    }
};

renderCalendar();