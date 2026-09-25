// Constants for Local Storage
const STORAGE_KEY = 'expense_tracker_data';
const THEME_KEY = 'expense_tracker_theme';
const CATEGORIES_KEY = 'expense_tracker_categories';

// State variables
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || ['Food', 'Transport', 'Fun'];
let chartInstance = null;

// DOM Elements
const form = document.getElementById('transactionForm');
const itemNameInput = document.getElementById('itemName');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const transactionListEl = document.getElementById('transactionList');
const totalBalanceEl = document.getElementById('totalBalance');
const emptyStateEl = document.getElementById('emptyState');
const sortSelect = document.getElementById('sortSelect');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const addCategoryBtn = document.getElementById('addCategoryBtn');

// Initialize Application
function init() {
    initTheme();
    renderCategoryOptions();
    updateUI();
}

// Master function to update all UI parts
function updateUI() {
    updateBalance();
    renderTransactions();
    updateChart();
    saveData();
}

// Save to Local Storage
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

// Calculate and display balance
function updateBalance() {
    const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    totalBalanceEl.textContent = `$${total.toFixed(2)}`;
}

// Populate the dropdown menu
function renderCategoryOptions() {
    categorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// Render List based on sort preference
function renderTransactions() {
    transactionListEl.innerHTML = '';
            
    if (transactions.length === 0) {
        emptyStateEl.style.display = 'block';
        transactionListEl.style.display = 'none';
        return;
    } else {
        emptyStateEl.style.display = 'none';
        transactionListEl.style.display = 'flex';
    }

        // Sorting logic
            let displayList = [...transactions];
            const sortVal = sortSelect.value;
            
            if (sortVal === 'newest') displayList.sort((a, b) => b.id - a.id);
            if (sortVal === 'oldest') displayList.sort((a, b) => a.id - b.id);
            if (sortVal === 'highest') displayList.sort((a, b) => b.amount - a.amount);
            if (sortVal === 'lowest') displayList.sort((a, b) => a.amount - b.amount);
            if (sortVal === 'category') displayList.sort((a, b) => a.category.localeCompare(b.category));

            // Create list elements
            displayList.forEach(item => {
                const li = document.createElement('li');
                li.className = 'transaction-item';
                
                li.innerHTML = `
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-amount">$${item.amount.toFixed(2)}</span>
                        <span class="item-category">${item.category}</span>
                    </div>
                    <button class="btn-delete" onclick="deleteTransaction(${item.id})">Delete</button>
                `;
                transactionListEl.appendChild(li);
            });
        }

// Form Submission
form.addEventListener('submit', function(e) {
    e.preventDefault();
            
    const name = itemNameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

            // Basic Validation
    if (name === '' || isNaN(amount) || amount <= 0 || category === '') {
        alert('Please fill out all fields correctly.');
        return;
    }

    const newTransaction = {
        id: Date.now(),
        name,
        amount,
        category
    };

    transactions.push(newTransaction);
            
    // Reset input
    itemNameInput.value = '';
    amountInput.value = '';
    itemNameInput.focus();

    updateUI();
});

// Delete Transaction (must be on window object to be called from inline HTML)
window.deleteTransaction = function(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateUI();
};

// Sort Change Listener
sortSelect.addEventListener('change', renderTransactions);

// Add Custom Category (Optional Challenge)
addCategoryBtn.addEventListener('click', () => {
    const newCat = prompt('Enter new category name:');
    if (newCat && newCat.trim() !== '') {
        const formattedCat = newCat.trim().charAt(0).toUpperCase() + newCat.trim().slice(1);
                
        if (!categories.includes(formattedCat)) {
            categories.push(formattedCat);
            renderCategoryOptions();
            categorySelect.value = formattedCat; // auto select new category
            saveData();
        } else {
            alert('Category already exists!');
        }
    }
});

// Chart rendering using Chart.js
function updateChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
            
    // Prepare data
    const categoryTotals = {};
    transactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Destroy previous instance to prevent visual bugs
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Fixed palette of colors for categories
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const bgColors = labels.map((_, i) => colors[i % colors.length]);

    const isDark = document.body.parentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f9fafb' : '#1f2937';

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
                borderWidth: 1,
                borderColor: isDark ? '#1f2937' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// Theme logic (Optional Challenge)
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggleBtn.textContent = '🌙';
    }
    localStorage.setItem(THEME_KEY, theme);
    if (chartInstance) updateChart(); // Re-render chart for text color
}

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// Run application
init();
