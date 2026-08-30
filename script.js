const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

let tasks = JSON.parse(localStorage.getItem("planningTasks")) || {
  "Lundi": [],
  "Mardi": [],
  "Mercredi": [],
  "Jeudi": [],
  "Vendredi": [],
  "Samedi": [],
  "Dimanche": []
};

let currentTheme = localStorage.getItem("planningTheme") || "dark";
let selectedIcon = "📝";

// Éléments DOM
const weekGrid = document.getElementById("weekGrid");
const timetableView = document.getElementById("timetableView");
const gridContainer = document.getElementById("gridContainer");
const btnList = document.getElementById("btnList");
const btnGrid = document.getElementById("btnGrid");
const fullscreenBtn = document.getElementById("fullscreenBtn");

// Modales & Boutons Réglages
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsModal = document.getElementById("closeSettingsModal");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const resetDataBtn = document.getElementById("resetDataBtn");

// Modale Ajout Tâche
const addTaskModal = document.getElementById("addTaskModal");
const closeAddTaskModal = document.getElementById("closeAddTaskModal");
const addTaskForm = document.getElementById("addTaskForm");
const taskDayInput = document.getElementById("taskDayInput");
const addTaskModalTitle = document.getElementById("addTaskModalTitle");
const iconSelector = document.getElementById("iconSelector");

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(currentTheme);
  renderListView();
  renderTimetable();
  setupEventListeners();
});

// Gestion des thèmes
function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.remove("dark-theme");
    document.body.classList.add("light-theme");
    themeToggleBtn.textContent = "Passer au Mode Sombre";
  } else {
    document.body.classList.remove("light-theme");
    document.body.classList.add("dark-theme");
    themeToggleBtn.textContent = "Passer au Mode Clair";
  }
  localStorage.setItem("planningTheme", theme);
}

// Écouteurs d'événements principaux
function setupEventListeners() {
  btnList.addEventListener("click", () => {
    btnList.classList.add("active");
    btnGrid.classList.remove("active");
    weekGrid.classList.remove("hidden");
    timetableView.classList.add("hidden");
  });

  btnGrid.addEventListener("click", () => {
    btnGrid.classList.add("active");
    btnList.classList.remove("active");
    timetableView.classList.remove("hidden");
    weekGrid.classList.add("hidden");
    renderTimetable();
  });

  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  });

  settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
  closeSettingsModal.addEventListener("click", () => settingsModal.classList.add("hidden"));

  themeToggleBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme);
  });

  resetDataBtn.addEventListener("click", () => {
    if (confirm("Voulez-vous vraiment tout réinitialiser ? Toutes vos tâches seront supprimées.")) {
      tasks = { "Lundi": [], "Mardi": [], "Mercredi": [], "Jeudi": [], "Vendredi": [], "Samedi": [], "Dimanche": [] };
      saveTasks();
      renderListView();
      renderTimetable();
      settingsModal.classList.add("hidden");
    }
  });

  closeAddTaskModal.addEventListener("click", () => addTaskModal.classList.add("hidden"));

  iconSelector.querySelectorAll(".icon-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      iconSelector.querySelectorAll(".icon-opt").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedIcon = btn.dataset.icon;
    });
  });

  addTaskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const day = taskDayInput.value;
    const text = document.getElementById("taskText").value.trim();
    const startTime = document.getElementById("startTime").value || null;
    const endTime = document.getElementById("endTime").value || null;

    if (text !== "") {
      addTask(day, text, selectedIcon, startTime, endTime);
      addTaskForm.reset();
      iconSelector.querySelectorAll(".icon-opt").forEach(b => b.classList.remove("active"));
      iconSelector.querySelector(".icon-opt").classList.add("active");
      selectedIcon = "📝";
      addTaskModal.classList.add("hidden");
    }
  });
}

function saveTasks() {
  localStorage.setItem("planningTasks", JSON.stringify(tasks));
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
}

// --- RENDU VUE LISTE ---
function renderListView() {
  weekGrid.innerHTML = "";

  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "day-card";

    const cardHeader = document.createElement("div");
    cardHeader.className = "day-header";

    const title = document.createElement("div");
    title.className = "day-title";
    title.textContent = day;

    const addBtn = document.createElement("button");
    addBtn.className = "add-btn-icon";
    addBtn.textContent = "+";
    addBtn.onclick = () => openAddTaskModal(day);

    cardHeader.appendChild(title);
    cardHeader.appendChild(addBtn);
    card.appendChild(cardHeader);

    const taskList = document.createElement("ul");
    taskList.className = "task-list";

    (tasks[day] || []).forEach((task, index) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      
      let metaDetails = [];
      if (task.startTime || task.endTime) {
        let timeStr = "🕒 ";
        if (task.startTime) timeStr += task.startTime;
        if (task.startTime && task.endTime) timeStr += " - ";
        if (task.endTime) timeStr += task.endTime;
        metaDetails.push(timeStr);
      }

      const metaHTML = metaDetails.length > 0 ? `<div class="task-meta">${metaDetails.join(' | ')}</div>` : '';

      li.innerHTML = `
        <div class="task-main">
          <span class="task-icon">${task.icon || '📝'}</span>
          <div class="task-details">
            <span class="task-text-content">${escapeHtml(task.text)}</span>
            ${metaHTML}
          </div>
        </div>
        <div class="task-actions">
          <button onclick="toggleTask('${day}', ${index})">✓</button>
          <button onclick="deleteTask('${day}', ${index})">🗑</button>
        </div>
      `;
      taskList.appendChild(li);
    });

    card.appendChild(taskList);
    weekGrid.appendChild(card);
  });
}

function openAddTaskModal(day) {
  taskDayInput.value = day;
  addTaskModalTitle.textContent = `Ajouter une tâche (${day})`;
  addTaskModal.classList.remove("hidden");
}

function addTask(day, text, icon, startTime, endTime) {
  if (!tasks[day]) tasks[day] = [];
  tasks[day].push({ text, icon, startTime, endTime, completed: false });
  saveTasks();
  renderListView();
  renderTimetable();
}

function toggleTask(day, index) {
  tasks[day][index].completed = !tasks[day][index].completed;
  saveTasks();
  renderListView();
  renderTimetable();
}

function deleteTask(day, index) {
  tasks[day].splice(index, 1);
  saveTasks();
  renderListView();
  renderTimetable();
}

// --- RENDU VUE GRILLE CSS GRID ---
function renderTimetable() {
  gridContainer.innerHTML = "";

  // 1. En-têtes (Heure + 7 jours)
  const headerTime = document.createElement("div");
  headerTime.className = "grid-header";
  headerTime.textContent = "Heure";
  gridContainer.appendChild(headerTime);

  days.forEach(day => {
    const headerDay = document.createElement("div");
    headerDay.className = "grid-header";
    headerDay.textContent = day.slice(0, 3) + ".";
    gridContainer.appendChild(headerDay);
  });

  // 2. Colonne unique d'heures à gauche (Colonne 1, lignes 2 à 26)
  const timeCol = document.createElement("div");
  timeCol.className = "grid-time-column";

  const timeLabels = ["Journée", ...Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)];
  timeLabels.forEach(label => {
    const slot = document.createElement("div");
    slot.className = "grid-time-slot";
    slot.textContent = label;
    timeCol.appendChild(slot);
  });
  gridContainer.appendChild(timeCol);

  // 3. Colonnes des jours (Colonnes 2 à 8)
  days.forEach((day, dayIndex) => {
    const dayCol = document.createElement("div");
    dayCol.className = "grid-day-col";
    dayCol.style.gridColumn = `${dayIndex + 2}`;

    for (let i = 0; i < 25; i++) {
      const cellBg = document.createElement("div");
      cellBg.className = "grid-cell-bg";
      dayCol.appendChild(cellBg);
    }

    const dayTasks = tasks[day] || [];
    
    // Tâches "Toute la journée"
    const noTimeTasks = dayTasks.filter(t => !t.startTime);
    noTimeTasks.forEach((t, idx) => {
      const taskCard = document.createElement("div");
      taskCard.className = `grid-task-card ${t.completed ? 'completed' : ''}`;
      taskCard.style.top = `2px`;
      taskCard.style.height = `40px`;
      taskCard.style.left = `${idx * 20}%`;
      taskCard.style.width = `calc(100% - ${idx * 20}px)`;
      taskCard.innerHTML = `<span>${t.icon || '📝'} ${escapeHtml(t.text)}</span>`;
      dayCol.appendChild(taskCard);
    });

    // Tâches Horodatées
    const timedTasks = dayTasks
      .filter(t => t.startTime)
      .map(t => {
        const startMin = timeToMinutes(t.startTime);
        let endMin = t.endTime ? timeToMinutes(t.endTime) : startMin + 60;
        if (endMin <= startMin) endMin = startMin + 60;
        const duration = endMin - startMin;
        return { ...t, startMin, endMin, duration };
      });

    timedTasks.sort((a, b) => b.duration - a.duration || a.startMin - b.startMin);

    const placedTasks = [];
    timedTasks.forEach(task => {
      const overlapping = placedTasks.filter(p => (task.startMin < p.endMin && task.endMin > p.startMin));
      let colIndex = 0;
      const occupiedCols = overlapping.map(o => o.colIndex);
      while (occupiedCols.includes(colIndex)) {
        colIndex++;
      }
      task.colIndex = colIndex;
      placedTasks.push(task);
    });

    placedTasks.forEach(task => {
      const overlapping = placedTasks.filter(p => (task.startMin < p.endMin && task.endMin > p.startMin));
      const totalCols = Math.max(...overlapping.map(o => o.colIndex)) + 1;

      const topPx = 44 + (task.startMin / 60) * 44;
      const heightPx = (task.duration / 60) * 44;
      const widthPercent = 100 / totalCols;
      const leftPercent = task.colIndex * widthPercent;

      const taskCard = document.createElement("div");
      taskCard.className = `grid-task-card ${task.completed ? 'completed' : ''}`;
      taskCard.style.top = `${topPx + 2}px`;
      taskCard.style.height = `${heightPx - 4}px`;
      taskCard.style.left = `${leftPercent}%`;
      taskCard.style.width = `${widthPercent}%`;

      const timeStr = `${task.startTime}${task.endTime ? ` - ${task.endTime}` : ''}`;
      taskCard.innerHTML = `
        <span>${task.icon || '📝'} ${escapeHtml(task.text)}</span>
        <span class="grid-task-time">${timeStr}</span>
      `;

      dayCol.appendChild(taskCard);
    });

    gridContainer.appendChild(dayCol);
  });
}