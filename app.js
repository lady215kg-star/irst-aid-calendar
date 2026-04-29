// ================================================
//  FIRSTAID CALENDAR — app.js (FINALIZED)
//  Firebase Firestore Integration & UI Logic
// ================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,
    increment,
    Timestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ---- Firebase Config (К리티чно: Убедись, что это твои ключи) ----
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

// ================================================
//  UI ELEMENTS & STATE
// ================================================
const calendarGrid = document.getElementById("calendarGrid");
const monthDisplay = document.getElementById("monthDisplay");
const yearDisplay = document.getElementById("yearDisplay");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const bottomSheet = document.getElementById("bottomSheet");
const modalOverlay = document.getElementById("modalOverlay");
const addModal = document.getElementById("addModal");
const eventsList = document.getElementById("eventsList");

let currentDate = new Date();
let selectedDateStr = null;

// ================================================
//  INIT
// ================================================
function init() {
    renderCalendar();
    
    // Привязываем события кнопкам из HTML
    document.getElementById("openModal").onclick = openAddModal;
    document.getElementById("closeSidebar").onclick = closeSidebar;
    document.getElementById("overlay").onclick = closeSidebar;
}

// ================================================
//  CALENDAR RENDER
// ================================================
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];

    monthDisplay.textContent = monthNames[month];
    yearDisplay.textContent = year;

    calendarGrid.innerHTML = "";

    // Определение первого дня месяца (для отступа)
    const firstDayIndex = new Date(year, month, 1).getDay();
    const shift = (firstDayIndex === 0) ? 6 : firstDayIndex - 1; // Коррекция: Вс=6, Пн=0

    // Заполнение пустых ячеек в начале
    for (let x = 0; x < shift; x++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "cal-day empty";
        calendarGrid.appendChild(emptyCell);
    }

    // Количество дней в месяце
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Заполнение дней
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement("div");
        dayCell.className = "cal-day";
        dayCell.textContent = i;
        
        // Сегодняшний день
        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add("today");
        }

        // Подсветим, если день выбран
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (dateStr === selectedDateStr) {
            dayCell.classList.add("selected");
        }
        
        dayCell.dataset.dateStr = dateStr; // Для поиска

        // При клике: Выбираем день и загружаем события
        dayCell.onclick = () => selectDay(i, dateStr, dayCell);
        
        calendarGrid.appendChild(dayCell);
    }
}

// --- Навигация месяцев (Привязываем к окну) ---
window.changeMonth = function(dir) {
    currentDate.setMonth(currentDate.getMonth() + dir);
    renderCalendar();
    // Скрываем панель при смене месяца
    collapseSheet();
};

// ================================================
//  DATE SELECTION & BOTTOM SHEET
// ================================================
function selectDay(dayNum, dateStr, element) {
    selectedDateStr = dateStr;

    // 1. Подсветка в календаре
    document.querySelectorAll(".cal-day").forEach(el => el.classList.remove("selected"));
    element.classList.add("selected");

    // 2. Обновляем метку даты
    selectedDateLabel.textContent = `${dayNum} ${currentDate.toLocaleString('ru', { month: 'long' })}`;

    // 3. Раскрываем Bottom Sheet (если скрыта) и загружаем события
    expandSheet();
    fetchEvents(dateStr);
}

function expandSheet() {
    bottomSheet.classList.add("expanded");
}

function collapseSheet() {
    bottomSheet.classList.remove("expanded");
}

// При клике на "ручку" Bottom Sheet — скрываем её
document.getElementById("sheetHandle").onclick = collapseSheet;

// ================================================
//  FIREBASE: FETCH EVENTS & RECORD PARTICIPANTS
// ================================================
async function fetchEvents(dateStr) {
    // Спиннер загрузки
    eventsList.innerHTML = `
        <div class="loader-wrap">
            <div class="loader-ring"></div>
            <p class="loader-text">Загрузка...</p>
        </div>`;

    try {
        const q = query(collection(db, "events"), where("date", "==", dateStr));
        onSnapshot(q, (snapshot) => {
            eventsList.innerHTML = "";

            if (snapshot.empty) {
                eventsList.innerHTML = `
                    <div class="empty-state">
                        <span class="empty-icon">📅</span>
                        <p>На этот день пока нет задач. Добавьте первую!</p>
                    </div>`;
                return;
            }

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const isFull = data.currentParticipants >= data.maxParticipants;
                
                // Карточка события по дизайну (image_2.png)
                const eventCard = document.createElement("div");
                eventCard.className = "event-card";
                
                // Добавим красную полоску слева
                eventCard.style.borderLeft = "5px solid #FF5252";

                const iconLib = document.getElementById("iconLibrary");
                const timeIco = iconLib.querySelector(".ico-time").outerHTML;
                const locIco = iconLib.querySelector(".ico-location").outerHTML;

                eventCard.innerHTML = `
                    <div class="event-info">
                        <strong>${data.title}</strong>
                        <p>${timeIco} ${data.time || '—'} | ${locIco} ${data.location || '—'}</p>
                        <p>Мест: ${data.currentParticipants}/${data.maxParticipants}</p>
                        ${isFull ? '<span style="color: red; font-size: 12px; font-weight: bold;">ЗАБИТО</span>' : ''}
                    </div>
                    <div class="event-actions">
                        <button class="join-btn" ${isFull ? 'disabled' : ''} onclick="joinEvent('${docSnap.id}')">
                            ${isFull ? 'Мест нет' : 'Записаться'}
                        </button>
                        <button class="event-delete" onclick="deleteEvent('${docSnap.id}')">✕</button>
                    </div>
                `;
                
                eventsList.appendChild(eventCard);
            });
        });
    } catch (err) {
        console.error("Fetch error:", err);
        eventsList.innerHTML = '<div class="empty-state">⚠️ Ошибка Firebase. Проверьте права.</div>';
    }
}

// --- Записаться (Используем Firebase Increment) ---
window.joinEvent = async function(eventId) {
    const eventRef = doc(db, "events", eventId);
    try {
        // Увеличиваем currentParticipants на 1 прямо в базе
        await updateDoc(eventRef, {
            currentParticipants: increment(1)
        });
        showToast("Успешная запись!", "success");
    } catch (err) {
        console.error("Join error:", err);
        showToast("Ошибка записи", "error");
    }
};

// --- Удалить (Спрашиваем подтверждение) ---
window.deleteEvent = async function(eventId) {
    if (!confirm("Удалить это мероприятие?")) return;
    try {
        await deleteDoc(doc(db, "events", eventId));
        showToast("Удалено ✓", "success");
    } catch (err) {
        console.error("Delete error:", err);
        showToast("Ошибка удаления", "error");
    }
};

// ================================================
//  MODAL (image_3.png) & SIDEBAR
// ================================================
window.openAddModal = function() {
    if (!selectedDateStr) return alert("Сначала выбери дату!");
    
    // Очищаем поля (если они есть)
    document.getElementById("eventTitle").value = "";
    
    modalOverlay.classList.add("active");
    addModal.classList.add("open");
};

window.closeModal = function() {
    modalOverlay.classList.remove("active");
    addModal.classList.remove("open");
};

// --- Сайдбар (Три полоски) ---
window.openSidebar = function() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("overlay").classList.add("active");
};

window.closeSidebar = function() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
};

// --- Firebase: Сохранить новое ---
window.saveEvent = async function() {
    const title = document.getElementById("eventTitle").value.trim();
    
    // Если Клод дал верстку, получим и другие поля:
    const loc = document.getElementById("eventLocation") ? document.getElementById("eventLocation").value.trim() : "";
    const time = document.getElementById("eventTime") ? document.getElementById("eventTime").value : "";
    const max = document.getElementById("eventParticipants") ? parseInt(document.getElementById("eventParticipants").value, 10) : 10;
    
    if (!title) return alert("Введите название!");

    // Спиннер на кнопку
    document.getElementById("submitBtnText").style.display = "none";
    document.getElementById("btnSpinner").style.display = "block";

    try {
        await addDoc(collection(db, "events"), {
            title: title,
            location: loc,
            time: time,
            date: selectedDateStr,
            maxParticipants: max,
            currentParticipants: 0,
            createdAt: Timestamp.now()
        });
        showToast("Сохранено ✓", "success");
        closeModal();
    } catch (err) {
        console.error("Save error:", err);
        showToast("Ошибка сохранения", "error");
    } finally {
        document.getElementById("submitBtnText").style.display = "block";
        document.getElementById("btnSpinner").style.display = "none";
    }
};

// --- Уведомления ---
function showToast(msg, type = "") {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.className = `toast${type ? " " + type : ""} show`;
    setTimeout(() => toast.classList.remove("show"), 3000);
}

init();
