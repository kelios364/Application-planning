const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
let tasks = JSON.parse(localStorage.getItem("week_tasks")) || {};
let currentTheme = localStorage.getItem("theme") || "dark";

// Éléments DOM
const weekGrid = document.getElementById("weekGrid");
const timetableView = document.getElementById("timetableView");
const timetableHeader = document.getElementById("timetableHeader");
const timetableBody = document.getElementById("timetableBody");

const btnList = document.getElementById("btnList");
const btnGrid = document.getElementById("btnGrid");
const fullscreenBtn = document.getElementById("fullscreenBtn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const resetWeekBtn = document.getElementById("resetWeekBtn");

const confirmModal = document.getElementById("confirmModal");
const confirmYesBtn = document.getElementById("confirmYesBtn");
const confirmNoBtn = document.getElementById("confirmNoBtn");

const taskModal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");
const selectedDayInput = document.getElementById("selectedDay");
const iconButtons = document.querySelectorAll(".icon-btn");

let selectedIcon = "📌";
let currentView = "list";

// Appliquer le thème au démarrage
applyTheme(currentTheme);

function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem("theme", theme);
  if (theme === "light") {
    document.body.classList.remove("dark-theme");
    document.body.classList.add("light-theme");
    themeToggleBtn.textContent = "Passer au Mode Sombre";
  } else {
    document.body.classList.remove("light-theme");
    document.body.classList.add("dark-theme");
    themeToggleBtn.textContent = "Passer au Mode Clair";
  }
}

// Gestion Plein Écran
fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      alert(`Erreur d'activation du plein écran : ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
});

// Modale Réglages
settingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "flex";
});

closeSettingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "none";
});

themeToggleBtn.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

// Réinitialisation de la semaine avec Confirmation
resetWeekBtn.addEventListener("click", () => {
  settingsModal.style.display = "none";
  confirmModal.style.display = "flex";
});

confirmNoBtn.addEventListener("click", () => {
  confirmModal.style.display = "none";
});

confirmYesBtn.addEventListener("click", () => {
  tasks = {};
  saveAndRender();
  confirmModal.style.display = "none";
});

// Changement de vue
btnList.addEventListener("click", () => {
  currentView = "list";
  btnList.classList.add("active");
  btnGrid.classList.remove("active");
  weekGrid.classList.remove("hidden");
  timetableView.classList.add("hidden");
  renderWeek();
});

btnGrid.addEventListener("click", () => {
  currentView = "grid";
  btnGrid.classList.add("active");
  btnList.classList.remove("active");
  timetableView.classList.remove("hidden");
  weekGrid.classList.add("hidden");
  renderTimetable();
});

// Vue Liste
function renderWeek() {
  weekGrid.innerHTML = "";
  days.forEach(day => {
    const dayTasks = tasks[day] || [];
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";
    
    let tasksHTML = dayTasks.map((task, index) => {
      let metaText = "";
      if (task.time) metaText += `🕒 ${task.time} `;
      if (task.duration) metaText += `⏳ ${task.duration} min`;

      return `
        <div class="task-item ${task.completed ? 'completed' : ''}">
          <div class="task-left">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${day}', ${index})">
            <span class="task-icon">${task.icon}</span>
            <div class="task-details">
              <span class="task-text">${escapeHtml(task.text)}</span>
              ${metaText ? `<span class="task-meta">${metaText}</span>` : ''}
            </div>
          </div>
          <button class="delete-btn" onclick="deleteTask('${day}', ${index})">&times;</button>
        </div>
      `;
    }).join("");

    dayCard.innerHTML = `
      <div class="day-header">
        <span class="day-title">${day}</span>
        <button class="add-btn" onclick="openModal('${day}')">+</button>
      </div>
      <div class="task-list">
        ${tasksHTML || '<span style="color:var(--subtext-color); font-size:0.8rem;">Aucune tâche</span>'}
      </div>
    `;

    weekGrid.appendChild(dayCard);
  });
}

// Vue Grille Horaire (Corrigée via <table> HTML)
function renderTimetable() {
  // En-tête avec colonnes alignées
  let headerHTML = `<tr><th>Heure</th>`;
  days.forEach(day => {
    headerHTML += `<th>${day.slice(0, 3)}.</th>`;
  });
  headerHTML += `</tr>`;
  timetableHeader.innerHTML = headerHTML;

  timetableBody.innerHTML = "";

  // Ligne "Toute la journée"
  let allDayHTML = `<tr><td>Toute la journée</td>`;
  days.forEach(day => {
    const noTimeTasks = (tasks[day] || []).filter(t => !t.time);
    let cellContent = noTimeTasks.map(t => 
      `<div class="grid-task ${t.completed ? 'completed' : ''}">${t.icon} ${escapeHtml(t.text)}</div>`
    ).join("");
    allDayHTML += `<td>${cellContent}</td>`;
  });
  allDayHTML += `</tr>`;
  timetableBody.innerHTML += allDayHTML;

  // Lignes par heure (06:00 à 23:00)
  for (let hour = 6; hour <= 23; hour++) {
    const hourStr = hour.toString().padStart(2, '0') + ":00";
    let rowHTML = `<tr><td>${hourStr}</td>`;

    days.forEach(day => {
      const matchingTasks = (tasks[day] || []).filter(t => {
        if (!t.time) return false;
        const taskHour = parseInt(t.time.split(":")[0]);
        return taskHour === hour;
      });

      let cellContent = matchingTasks.map(t => 
        `<div class="grid-task ${t.completed ? 'completed' : ''}">${t.icon} ${escapeHtml(t.text)} <br><small>🕒 ${t.time}</small></div>`
      ).join("");

      rowHTML += `<td>${cellContent}</td>`;
    });

    rowHTML += `</tr>`;
    timetableBody.innerHTML += rowHTML;
  }
}

// Sélection d'icônes
iconButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    iconButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedIcon = btn.dataset.icon;
  });
});

// Modale Ajout Tâche
function openModal(day) {
  selectedDayInput.value = day;
  taskModal.style.display = "flex";
}

document.getElementById("cancelBtn").addEventListener("click", () => {
  taskModal.style.display = "none";
  resetForm();
});

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const day = selectedDayInput.value;
  const text = document.getElementById("taskText").value;
  const time = document.getElementById("startTime").value;
  const duration = document.getElementById("duration").value;

  if (!tasks[day]) tasks[day] = [];

  tasks[day].push({
    text,
    icon: selectedIcon,
    time: time || null,
    duration: duration || null,
    completed: false
  });

  saveAndRender();
  taskModal.style.display = "none";
  resetForm();
});

function toggleTask(day, index) {
  tasks[day][index].completed = !tasks[day][index].completed;
  saveAndRender();
}

function deleteTask(day, index) {
  tasks[day].splice(index, 1);
  saveAndRender();
}

function resetForm() {
  taskForm.reset();
  selectedIcon = "📌";
  iconButtons.forEach(b => b.classList.remove("active"));
  if (iconButtons[0]) iconButtons[0].classList.add("active");
}

function saveAndRender() {
  localStorage.setItem("week_tasks", JSON.stringify(tasks));
  if (currentView === "list") {
    renderWeek();
  } else {
    renderTimetable();
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

// Lancement au chargement
renderWeek();