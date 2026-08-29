const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
let tasks = JSON.parse(localStorage.getItem("week_tasks")) || {};

// Éléments DOM
const weekGrid = document.getElementById("weekGrid");
const timetableView = document.getElementById("timetableView");
const timetableHeader = document.getElementById("timetableHeader");
const timetableBody = document.getElementById("timetableBody");

const btnList = document.getElementById("btnList");
const btnGrid = document.getElementById("btnGrid");

const taskModal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");
const selectedDayInput = document.getElementById("selectedDay");
const iconButtons = document.querySelectorAll(".icon-btn");

let selectedIcon = "📌";
let currentView = "list";

// Gestion du changement de vue
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
        ${tasksHTML || '<span style="color:#555; font-size:0.8rem;">Aucune tâche</span>'}
      </div>
    `;

    weekGrid.appendChild(dayCard);
  });
}

// Vue Grille Horaire
function renderTimetable() {
  // En-tête des jours
  timetableHeader.innerHTML = `<div class="time-col-header">Heure</div>`;
  days.forEach(day => {
    timetableHeader.innerHTML += `<div class="day-col-header">${day.slice(0, 3)}.</div>`;
  });

  timetableBody.innerHTML = "";

  // Section "Toute la journée" (sans heure précise)
  let allDayRow = document.createElement("div");
  allDayRow.className = "time-row";
  allDayRow.innerHTML = `<div class="time-label">Toute la journée</div>`;
  days.forEach(day => {
    const noTimeTasks = (tasks[day] || []).filter(t => !t.time);
    let cellContent = noTimeTasks.map(t => 
      `<div class="grid-task ${t.completed ? 'completed' : ''}">${t.icon} ${escapeHtml(t.text)}</div>`
    ).join("");
    allDayRow.innerHTML += `<div class="time-cell">${cellContent}</div>`;
  });
  timetableBody.appendChild(allDayRow);

  // Plage horaire de 06:00 à 23:00
  for (let hour = 6; hour <= 23; hour++) {
    const hourStr = hour.toString().padStart(2, '0') + ":00";
    let row = document.createElement("div");
    row.className = "time-row";
    row.innerHTML = `<div class="time-label">${hourStr}</div>`;

    days.forEach(day => {
      const matchingTasks = (tasks[day] || []).filter(t => {
        if (!t.time) return false;
        const taskHour = parseInt(t.time.split(":")[0]);
        return taskHour === hour;
      });

      let cellContent = matchingTasks.map(t => 
        `<div class="grid-task ${t.completed ? 'completed' : ''}">${t.icon} ${escapeHtml(t.text)} <br><small>🕒 ${t.time}</small></div>`
      ).join("");

      row.innerHTML += `<div class="time-cell">${cellContent}</div>`;
    });

    timetableBody.appendChild(row);
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

// Modale
function openModal(day) {
  selectedDayInput.value = day;
  taskModal.style.display = "flex";
}

document.getElementById("cancelBtn").addEventListener("click", () => {
  taskModal.style.display = "none";
  resetForm();
});

// Soumission du formulaire
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

// Initialisation
renderWeek();