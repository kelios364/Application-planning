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

// Éléments DOM
const weekGrid = document.getElementById("weekGrid");
const timetableView = document.getElementById("timetableView");
const timetableHeader = document.getElementById("timetableHeader");
const timetableBody = document.getElementById("timetableBody");
const btnList = document.getElementById("btnList");
const btnGrid = document.getElementById("btnGrid");
const fullscreenBtn = document.getElementById("fullscreenBtn");

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  renderListView();
  renderTimetable();
  setupEventListeners();
});

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
}

// Sauvegarde dans le navigateur
function saveTasks() {
  localStorage.setItem("planningTasks", JSON.stringify(tasks));
}

// Échappement HTML pour éviter les failles
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- RENDU VUE LISTE ---
function renderListView() {
  weekGrid.innerHTML = "";

  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "day-card";

    const title = document.createElement("div");
    title.className = "day-title";
    title.textContent = day;
    card.appendChild(title);

    const taskList = document.createElement("ul");
    taskList.className = "task-list";

    (tasks[day] || []).forEach((task, index) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      
      const timeTag = task.time ? `<small>🕒 ${task.time}</small> ` : '';
      li.innerHTML = `
        <span>${timeTag}${escapeHtml(task.text)}</span>
        <div>
          <button onclick="toggleTask('${day}', ${index})">✓</button>
          <button onclick="deleteTask('${day}', ${index})">🗑</button>
        </div>
      `;
      taskList.appendChild(li);
    });

    card.appendChild(taskList);

    // Formulaire d'ajout
    const form = document.createElement("form");
    form.className = "add-task-form";
    form.innerHTML = `
      <input type="text" placeholder="Nouvelle tâche..." required>
      <input type="time">
      <button type="submit">+</button>
    `;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const textInput = form.querySelector('input[type="text"]');
      const timeInput = form.querySelector('input[type="time"]');

      if (textInput.value.trim() !== "") {
        addTask(day, textInput.value.trim(), timeInput.value);
        textInput.value = "";
        timeInput.value = "";
      }
    });

    card.appendChild(form);
    weekGrid.appendChild(card);
  });
}

// Actions sur les tâches
function addTask(day, text, time) {
  if (!tasks[day]) tasks[day] = [];
  tasks[day].push({ text, time: time || null, completed: false });
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
  // 1. En-tête (Jours de la semaine)
  let headerHTML = `<tr><th>Heure</th>`;
  days.forEach(day => {
    headerHTML += `<th>${day.slice(0, 3)}.</th>`;
  });
  headerHTML += `</tr>`;
  timetableHeader.innerHTML = headerHTML;

  // 2. Corps du tableau
  timetableBody.innerHTML = "";

  // Ligne "Toute la journée"
  let allDayHTML = `<tr><td>Journée</td>`;
  days.forEach(day => {
    const noTimeTasks = (tasks[day] || []).filter(t => !t.time);
    let cellContent = noTimeTasks.map(t => 
      `<div class="grid-task ${t.completed ? 'completed' : ''}">${escapeHtml(t.text)}</div>`
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
        const taskHour = parseInt(t.time.split(":")[0], 10);
        return taskHour === hour;
      });

      let cellContent = matchingTasks.map(t => 
        `<div class="grid-task ${t.completed ? 'completed' : ''}">
          ${escapeHtml(t.text)}
        </div>`
      ).join("");

      rowHTML += `<td>${cellContent}</td>`;
    });

    rowHTML += `</tr>`;
    timetableBody.innerHTML += rowHTML;
  }
}