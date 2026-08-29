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
const timetableHeader = document.getElementById("timetableHeader");
const timetableBody = document.getElementById("timetableBody");
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
  // Navigation vues
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

  // Plein écran
  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  });

  // Réglages
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

  // Ajout Tâche
  closeAddTaskModal.addEventListener("click", () => addTaskModal.classList.add("hidden"));

  // Sélection icône
  iconSelector.querySelectorAll(".icon-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      iconSelector.querySelectorAll(".icon-opt").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedIcon = btn.dataset.icon;
    });
  });

  // Soumission Formulaire Tâche
  addTaskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const day = taskDayInput.value;
    const text = document.getElementById("taskText").value.trim();
    const startTime = document.getElementById("startTime").value || null;
    const endTime = document.getElementById("endTime").value || null;
    const duration = document.getElementById("taskDuration").value.trim() || null;

    if (text !== "") {
      addTask(day, text, selectedIcon, startTime, endTime, duration);
      addTaskForm.reset();
      // Remettre l'icône par défaut sur la première
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

// --- RENDU VUE LISTE ---
function renderListView() {
  weekGrid.innerHTML = "";

  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "day-card";

    // En-tête de carte (Titre à gauche, bouton + à droite)
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

    // Liste des tâches
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
      if (task.duration) {
        metaDetails.push(`⏳ ${task.duration}`);
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

// Actions sur les tâches
function addTask(day, text, icon, startTime, endTime, duration) {
  if (!tasks[day]) tasks[day] = [];
  tasks[day].push({ text, icon, startTime, endTime, duration, completed: false });
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

// --- RENDU VUE GRILLE HORAIRE ---
function renderTimetable() {
  let headerHTML = `<tr><th>Heure</th>`;
  days.forEach(day => {
    headerHTML += `<th>${day.slice(0, 3)}.</th>`;
  });
  headerHTML += `</tr>`;
  timetableHeader.innerHTML = headerHTML;

  timetableBody.innerHTML = "";

  // Ligne "Journée / Sans horaire"
  let allDayHTML = `<tr><td>Journée</td>`;
  days.forEach(day => {
    const noTimeTasks = (tasks[day] || []).filter(t => !t.startTime);
    let cellContent = noTimeTasks.map(t => 
      `<div class="grid-task ${t.completed ? 'completed' : ''}">
        ${t.icon || '📝'} ${escapeHtml(t.text)}
      </div>`
    ).join("");
    allDayHTML += `<td>${cellContent}</td>`;
  });
  allDayHTML += `</tr>`;
  timetableBody.innerHTML += allDayHTML;

  // Lignes par heure (06:00 à 23:00) selon l'heure de début
  for (let hour = 6; hour <= 23; hour++) {
    const hourStr = hour.toString().padStart(2, '0') + ":00";
    let rowHTML = `<tr><td>${hourStr}</td>`;

    days.forEach(day => {
      const matchingTasks = (tasks[day] || []).filter(t => {
        if (!t.startTime) return false;
        const taskHour = parseInt(t.startTime.split(":")[0], 10);
        return taskHour === hour;
      });

      let cellContent = matchingTasks.map(t => 
        `<div class="grid-task ${t.completed ? 'completed' : ''}">
          ${t.icon || '📝'} ${escapeHtml(t.text)}
        </div>`
      ).join("");

      rowHTML += `<td>${cellContent}</td>`;
    });

    rowHTML += `</tr>`;
    timetableBody.innerHTML += rowHTML;
  }
}