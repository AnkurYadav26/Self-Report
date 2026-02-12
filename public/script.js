const API = "/api";

/* ================= SIGNUP ================= */
async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) {
    window.location.href = "login.html";
  }
}

/* ================= LOGIN ================= */
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } else {
    alert(data.message);
  }
}

/* ================= LOAD ANALYTICS ================= */
async function loadAnalytics() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const res = await fetch(`${API}/records/analytics`, {
    headers: { Authorization: token }
  });

  const data = await res.json();

  document.getElementById("streak-count").innerText = data.streak;

  document.getElementById("progress-fill").style.width =
    data.overallPercentage + "%";

  document.getElementById("progress-text").innerText =
    data.overallPercentage + "% Completed";

  const cardsContainer = document.getElementById("subject-cards");
  cardsContainer.innerHTML = "";

  for (let subject in data.subjectStats) {
    const stats = data.subjectStats[subject];

    const percent = stats.total
      ? ((stats.completed / stats.total) * 100).toFixed(1)
      : 0;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h4>${subject}</h4>
      <p>${percent}%</p>
    `;

    cardsContainer.appendChild(card);
  }
}

/* ================= LOAD TABLE ================= */
async function loadDashboardTable() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/records`, {
    headers: { Authorization: token }
  });

  const records = await res.json();
  renderTable(records);
}

function renderTable(records) {
  const container = document.getElementById("table-container");
  container.innerHTML = "";

  if (!records.length) return;

  const table = document.createElement("table");

  const headerRow = document.createElement("tr");
  headerRow.innerHTML = "<th>Subject</th>";

  records.forEach(record => {
    const th = document.createElement("th");
    th.innerText = record.date;
    headerRow.appendChild(th);
  });

  table.appendChild(headerRow);

  const subjects = records[0].subjects.map(s => s.subjectName);

  subjects.forEach(subject => {
    const row = document.createElement("tr");

    const subjectCell = document.createElement("td");
    subjectCell.innerText = subject;
    row.appendChild(subjectCell);

    records.forEach(record => {
      const cell = document.createElement("td");
      const subjectData = record.subjects.find(
        s => s.subjectName === subject
      );

      ["video", "revision", "test"].forEach(field => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = subjectData[field];

        checkbox.onchange = () =>
          updateRecord(record.date, subject, field, checkbox.checked);

        cell.appendChild(checkbox);
      });

      row.appendChild(cell);
    });

    table.appendChild(row);
  });

  container.appendChild(table);
}

/* ================= UPDATE ================= */
async function updateRecord(date, subjectName, field, value) {
  const token = localStorage.getItem("token");

  await fetch(`${API}/records/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ date, subjectName, field, value })
  });

  loadAnalytics();
}

/* ================= LOGOUT ================= */
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/* ================= AUTO LOAD ================= */
if (window.location.pathname.includes("dashboard.html")) {
  loadAnalytics();
  loadDashboardTable();
}
