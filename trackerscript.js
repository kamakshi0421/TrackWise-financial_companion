/**
 * TrackWise - Smart Expense Tracker
 * Author: Kamakshi
 */
const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const incomeProgress = document.getElementById("income-progress");
const expenseProgress = document.getElementById("expense-progress");
const list = document.getElementById("list");
const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
const dateInput = document.getElementById("date");
const recurringCheck = document.getElementById("recurring");
const clearBtn = document.getElementById("clear-btn");
const monthFilter = document.getElementById("month-filter");
const quoteText = document.getElementById("quote");
const remindersList = document.getElementById("reminders-list");
const btnCat = document.getElementById("btn-cat");
const btnTrend = document.getElementById("btn-trend");
const chartTitle = document.getElementById("chart-title");

// Set current date as default
dateInput.valueAsDate = new Date();

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentChartType = 'category'; // 'category' or 'trend'
let myChart = null;

const quotes = [
    "Think smart. Spend wise.",
    "A penny saved is a penny earned.",
    "Beware of little expenses; a small leak will sink a great ship.",
    "Budgeting isn't about limiting yourself. It's about making your things possible.",
    "The goal isn't more money. The goal is living life on your terms."
];

// Random Quote
function setRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    quoteText.textContent = `"${quotes[randomIndex]}"`;
}

// Add Transaction
function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a description and amount');
        return;
    }

    const transaction = {
        id: generateID(),
        text: text.value,
        amount: +amount.value,
        category: category.value,
        date: dateInput.value,
        recurring: recurringCheck.checked
    };

    transactions.push(transaction);
    updateLocalStorage();
    init();
    
    // Reset fields
    text.value = '';
    amount.value = '';
    recurringCheck.checked = false;
}

// Generate Random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Add Transactions to DOM
function addTransactionDOM(transaction) {
    const item = document.createElement("li");
    item.classList.add(transaction.amount < 0 ? "minus" : "plus");

    const date = new Date(transaction.date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short'
    });

    item.innerHTML = `
        <div class="details">
            <span class="text">${transaction.text} ${transaction.recurring ? '🔄' : ''}</span>
            <span class="cat-date">${transaction.category} • ${date}</span>
        </div>
        <div class="amount-box">
            <span>${transaction.amount < 0 ? '-' : '+'}&#8377;${Math.abs(transaction.amount)}</span>
            <button class="delete-btn" onclick="removeTransaction(${transaction.id})">×</button>
        </div>
    `;

    list.appendChild(item);
}

// Update Totals & Progress Bars
function updateValues() {
    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0);
    const expense = Math.abs(amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0));

    balance.innerHTML = `&#8377;${total}`;
    money_plus.innerHTML = `+&#8377;${income.toFixed(2)}`;
    money_minus.innerHTML = `-&#8377;${expense.toFixed(2)}`;
    
    // Calculate Progress Bars
    const maxVal = Math.max(income, expense, 1);
    incomeProgress.style.width = `${(income / maxVal) * 100}%`;
    expenseProgress.style.width = `${(expense / maxVal) * 100}%`;
    
    updateChart();
    updateReminders();
}

// Update Chart.js
function updateChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    if (myChart) myChart.destroy();

    if (currentChartType === 'category') {
        const categories = {};
        transactions.filter(t => t.amount < 0).forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
        });

        const labels = Object.keys(categories);
        const data = Object.values(categories);

        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Outfit', size: 12 } } }
                },
                cutout: '75%'
            }
        });
    } else {
        // Trend Chart (Last 6 Months)
        const monthlyData = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize last 6 months
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            monthlyData[key] = { income: 0, expense: 0 };
        }

        transactions.forEach(t => {
            const d = new Date(t.date);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            if (monthlyData[key]) {
                if (t.amount > 0) monthlyData[key].income += t.amount;
                else monthlyData[key].expense += Math.abs(t.amount);
            }
        });

        const labels = Object.keys(monthlyData);
        const incomeData = labels.map(l => monthlyData[l].income);
        const expenseData = labels.map(l => monthlyData[l].expense);

        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Income', data: incomeData, backgroundColor: '#10b981', borderRadius: 6 },
                    { label: 'Expenses', data: expenseData, backgroundColor: '#ef4444', borderRadius: 6 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Outfit', size: 12 } } }
                },
                scales: {
                    y: { beginAtZero: true, grid: { display: false }, ticks: { font: { family: 'Outfit' } } },
                    x: { grid: { display: false }, ticks: { font: { family: 'Outfit' } } }
                }
            }
        });
    }
}

// Recurring Reminders
function updateReminders() {
    remindersList.innerHTML = '';
    const recurring = transactions.filter(t => t.recurring);
    const seen = new Set();
    const uniqueRecurring = recurring.filter(t => {
        const key = `${t.text}-${t.amount}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    if (uniqueRecurring.length === 0) {
        remindersList.innerHTML = '<p class="empty-msg">No recurring payments set.</p>';
        return;
    }

    uniqueRecurring.forEach(t => {
        const item = document.createElement('div');
        item.classList.add('reminder-item');
        item.innerHTML = `
            <div class="reminder-info">
                <h5>${t.text}</h5>
                <p>Monthly ${t.category}</p>
            </div>
            <div class="reminder-amount">&#8377;${Math.abs(t.amount)}</div>
        `;
        remindersList.appendChild(item);
    });
}

// Remove Transaction
function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateLocalStorage();
    init();
}

// Local Storage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Filter Transactions
function getFilteredTransactions() {
    const filter = monthFilter.value;
    if (filter === 'all') return transactions;
    
    const now = new Date();
    return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
}

// Initialize
function init() {
    list.innerHTML = "";
    const filtered = getFilteredTransactions();
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    filtered.forEach(addTransactionDOM);
    updateValues();
}

// Event Listeners
form.addEventListener('submit', addTransaction);
clearBtn.addEventListener('click', () => {
    if (confirm('Clear all data?')) {
        transactions = [];
        updateLocalStorage();
        init();
    }
});

monthFilter.addEventListener('change', init);

btnCat.addEventListener('click', () => {
    currentChartType = 'category';
    chartTitle.textContent = 'Spending Analysis';
    btnCat.classList.add('active');
    btnTrend.classList.remove('active');
    updateChart();
});

btnTrend.addEventListener('click', () => {
    currentChartType = 'trend';
    chartTitle.textContent = 'Monthly Trend';
    btnTrend.classList.add('active');
    btnCat.classList.remove('active');
    updateChart();
});

// Start
setRandomQuote();
init();
updateChart();