// Expense Tracker - frontend logic

// PHASE 2
// Your backend from Phase 1 is already running, with real expenses in the
// database (from schema.sql). Build this page directly against it with
// fetch and async/await - there is no in-memory or localStorage stage
// this time, and no sample data file.
//
// A possible structure (change it if you have a better idea):
//   - async function getExpenses()          fetch(API_URL), return the JSON
//   - async function addExpense(data)       fetch(API_URL, { method: "POST", ... })
//   - async function updateExpense(id,data) fetch(API_URL + "/" + id, { method: "PUT", ... })
//   - async function deleteExpense(id)      fetch(API_URL + "/" + id, { method: "DELETE" })
//   - async function refresh()              get the list, then call renderTable and renderSummary
//   - renderTable(list)                     build the table rows from the array the API returned
//   - renderSummary(list)                   update the summary cards
//   - applyFilter()                         re-render with the list filtered by category
//
// Don't forget:
//   - Show a Bootstrap spinner while a request is in flight.
//   - Wrap every fetch call in try/catch, and show a Bootstrap alert on failure.
//   - After add, edit, or delete, call refresh() so the page always shows
//     what the server actually saved - never update the table by hand.
//   - The API is at http://localhost:3000/api/expenses (see the Roadmap).

const API_URL = "http://localhost:3000/api/expenses";

async function getExpenses() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to get expenses");
    }

    const expenses = await response.json();
    return expenses;
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}

let expenses = [];
async function refresh() {
  expenses = await getExpenses();

  applyFilter();
  renderSummary(expenses);
}



function renderSummary(expenses) {
  const count = expenses.length;

  const total = expenses.reduce((sum, expense) => {
    return sum + Number(expense.amount);
  }, 0);

  const highest = Math.max(
    ...expenses.map((expense) => Number(expense.amount)),
  );

  const expCountBox = document.getElementById("expenseCount");
  expCountBox.textContent = count;

  const totalAmountBox = document.getElementById("totalAmount");
  totalAmountBox.textContent = total.toFixed(2);

  const highestExpenseBox = document.getElementById("highestExpense");
  highestExpenseBox.textContent = highest;
}

document.getElementById("submitExpense").addEventListener("click", () => {
  const titleInput = document.getElementById("expenseTitle");
  const amountInput = document.getElementById("expenseAmount");
  const categoryInput = document.getElementById("expenseCategory");
  const dateInput = document.getElementById("date");

  let isValid = true;

  // Remove previous validation
  titleInput.classList.remove("is-invalid");
  amountInput.classList.remove("is-invalid");
  categoryInput.classList.remove("is-invalid");
  dateInput.classList.remove("is-invalid");

  if (titleInput.value.trim() === "") {
    titleInput.classList.add("is-invalid");
    isValid = false;
  }

  if (amountInput.value === "" || Number(amountInput.value) <= 0) {
    amountInput.classList.add("is-invalid");
    isValid = false;
  }

  if (categoryInput.value === "") {
    categoryInput.classList.add("is-invalid");
    isValid = false;
  }

  if (dateInput.value === "") {
    dateInput.classList.add("is-invalid");
    isValid = false;
  }

  if (!isValid) {
    return;
  }

  const expense = {
    title: titleInput.value.trim(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
  };

  addExpense(expense);
});

async function addExpense(data) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to add expense");
    }

    document.getElementById("expenseTitle").value = "";
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseCategory").value = "";
    document.getElementById("date").value = "";

    await refresh();
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}

function getCategoryBadge(category) {
  const colors = {
    Food: "bg-success",
    Transport: "bg-primary",
    Shopping: "bg-warning",
    Bills: "bg-danger",
    Entertainment: "bg-info",
  };

  return colors[category] || "bg-secondary";
}
const tableBody = document.getElementById("tableBody");
function renderTable(expenses) {
  tableBody.innerHTML = "";

  expenses.forEach((expense) => {
    tableBody.innerHTML += `
      <tr>
        <td>${expense.title}</td>
        <td>    <span class="badge ${getCategoryBadge(expense.category)}">
        ${expense.category}
    </span> </td>
        <td>${expense.amount}</td>
        <td>${expense.date}</td>
        <td>   
        
        <button type="button" class="btn btn-outline-secondary edit-btn" data-id="${expense.id}" >Edit</button>
        <button type="button" class="btn btn-outline-danger delete-btn " data-id="${expense.id}" >Delete</button>

        </td>
      </tr>
    `;
  });
}

tableBody.addEventListener("click", (event) => {
  if (event.target.classList.contains("delete-btn")) {
    // find a button with delete-btn class
    const id = event.target.dataset.id; // get data-id for the button with delete-btn class
    deleteExpense(id);
  }

  if (event.target.classList.contains("edit-btn")) {
    const id = event.target.dataset.id;
    openEditModal(id);
  }
});

async function deleteExpense(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete expense");
    }

    await refresh();
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}
const editModalElement = document.getElementById("editModal");

const editModal = new bootstrap.Modal(editModalElement);

let editingId = null;

async function openEditModal(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);

    if (!response.ok) {
      throw new Error("Failed to get expense");
    }

    const expense = await response.json();

    editingId = id;

    document.getElementById("editTitle").value = expense.title;
    document.getElementById("editAmount").value = expense.amount;
    document.getElementById("editCategory").value = expense.category;
    document.getElementById("editDate").value = expense.date;

    editModal.show();
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}

async function updateExpense(id, data) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update expense");
    }

    return result;
  } catch (error) {
    console.error(error);
    showAlert(error.message);
  }
}
async function saveModal() {
  const data = {
    title: document.getElementById("editTitle").value,
    amount: Number(document.getElementById("editAmount").value),
    category: document.getElementById("editCategory").value,
    date: document.getElementById("editDate").value,
  };

  await updateExpense(editingId, data);

  await refresh();

  editModal.hide();
}

document.getElementById("saveEdit").addEventListener("click", saveModal);

function applyFilter() {
  const category = categoryFilter.value;
  const title = searchExpenseByTitleInput.value.trim().toLowerCase();

  if (category === "All" && title === "") {
    renderTable(expenses);
    return;
  }

  const filteredExpenses = expenses.filter((expense) => {
    return (
      (expense.category === category || category === "All") &&
      expense.title.toLowerCase().includes(title)
    );
  });

  renderTable(filteredExpenses);
}
const categoryFilter = document.getElementById("expenseCategories");

categoryFilter.addEventListener("change", applyFilter);

const searchExpenseByTitleInput = document.getElementById(
  "searchExpenseByTitle",
);

searchExpenseByTitleInput.addEventListener("input", applyFilter);

function showAlert(message) {
  const alertBox = document.getElementById("alertBox");

  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
}



refresh();