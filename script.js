const API_URL = "https://6b0529f8db01cf4636082433.mockapi.io/api/tasks";

const form = document.getElementById("taskForm");
const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("taskList");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");
const errorText = document.getElementById("errorText");
const retryBtn = document.getElementById("retryBtn");
const validation = document.getElementById("validation");
const counter = document.getElementById("counter");
const empty = document.getElementById("empty");

let tasks = [];

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Помилка сервера: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function showLoader(show) {
  loader.hidden = !show;
}

function showError(message) {
  errorText.textContent = message;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.hidden = true;
}

function updateCounter() {
  const done = tasks.filter((t) => t.completed).length;
  counter.textContent = `Завдань: ${tasks.length} · Виконано: ${done}`;
}

function createItem(task) {
  const li = document.createElement("li");
  li.className = "item" + (task.completed ? " done" : "");
  li.dataset.id = task.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "item__check";
  checkbox.checked = Boolean(task.completed);
  checkbox.addEventListener("change", () => toggleTask(task, li, checkbox));

  const text = document.createElement("span");
  text.className = "item__text";
  text.textContent = task.name;

  const del = document.createElement("button");
  del.className = "btn btn--delete";
  del.type = "button";
  del.textContent = "Видалити";
  del.addEventListener("click", () => deleteTask(task.id, li, del));

  li.append(checkbox, text, del);
  return li;
}

function render() {
  list.innerHTML = "";
  tasks.forEach((task) => list.appendChild(createItem(task)));
  empty.hidden = tasks.length > 0 || !loader.hidden;
  updateCounter();
}

async function loadTasks() {
  hideError();
  showLoader(true);
  list.innerHTML = "";
  empty.hidden = true;
  try {
    tasks = await request(API_URL);
  } catch (err) {
    tasks = [];
    showError(`Не вдалося завантажити завдання. ${err.message}`);
  } finally {
    showLoader(false);
    render();
  }
}

function validate(value) {
  if (!value) return "Введіть текст завдання";
  if (value.length < 3) return "Мінімум 3 символи";
  if (value.length > 100) return "Максимум 100 символів";
  if (tasks.some((t) => t.name.toLowerCase() === value.toLowerCase())) {
    return "Таке завдання вже існує";
  }
  return "";
}

async function addTask(event) {
  event.preventDefault();
  const name = input.value.trim();
  const message = validate(name);
  validation.textContent = message;
  input.classList.toggle("invalid", Boolean(message));
  if (message) return;

  hideError();
  addBtn.disabled = true;
  input.disabled = true;
  addBtn.textContent = "Додавання...";
  try {
    await request(API_URL, {
      method: "POST",
      body: JSON.stringify({ name, completed: false }),
    });
    input.value = "";
    await loadTasks();
  } catch (err) {
    showError(`Не вдалося додати завдання. ${err.message}`);
  } finally {
    addBtn.disabled = false;
    input.disabled = false;
    addBtn.textContent = "Додати";
    input.focus();
  }
}

async function deleteTask(id, li, button) {
  hideError();
  li.classList.add("busy");
  button.disabled = true;
  button.textContent = "...";
  try {
    await request(`${API_URL}/${id}`, { method: "DELETE" });
    tasks = tasks.filter((t) => t.id !== id);
    li.remove();
    empty.hidden = tasks.length > 0;
    updateCounter();
  } catch (err) {
    li.classList.remove("busy");
    button.disabled = false;
    button.textContent = "Видалити";
    showError(`Не вдалося видалити завдання. ${err.message}`);
  }
}

async function toggleTask(task, li, checkbox) {
  hideError();
  const completed = checkbox.checked;
  li.classList.add("busy");
  try {
    const updated = await request(`${API_URL}/${task.id}`, {
      method: "PUT",
      body: JSON.stringify({ completed }),
    });
    task.completed = updated.completed;
    li.classList.toggle("done", task.completed);
    updateCounter();
  } catch (err) {
    checkbox.checked = !completed;
    showError(`Не вдалося оновити завдання. ${err.message}`);
  } finally {
    li.classList.remove("busy");
  }
}

input.addEventListener("input", () => {
  validation.textContent = "";
  input.classList.remove("invalid");
});

form.addEventListener("submit", addTask);
retryBtn.addEventListener("click", loadTasks);
document.addEventListener("DOMContentLoaded", loadTasks);
