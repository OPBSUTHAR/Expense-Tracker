document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    initApp();
    
    // Fix theme toggle event
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Calculator popup open/close logic
    const openCalcBtn = document.getElementById('openCalculatorBtn');
    const calcModal = document.getElementById('calculatorModal');
    const closeCalcModal = document.getElementById('closeCalculatorModal');
    if (openCalcBtn && calcModal && closeCalcModal) {
        openCalcBtn.addEventListener('click', function() {
            calcModal.hidden = false;
            calcModal.style.display = 'flex';
        });
        closeCalcModal.addEventListener('click', function() {
            calcModal.hidden = true;
            calcModal.style.display = 'none';
        });
        calcModal.addEventListener('click', function(e) {
            // Only close if clicking the overlay, not the modal content
            if (e.target === calcModal) {
                calcModal.hidden = true;
                calcModal.style.display = 'none';
            }
        });
        // Also close calculator when clicking anywhere outside the modal content
        document.addEventListener('mousedown', function(e) {
            if (!calcModal.hidden && calcModal.style.display !== 'none') {
                const modalContent = calcModal.querySelector('.modal-content');
                if (modalContent && !modalContent.contains(e.target) && !openCalcBtn.contains(e.target)) {
                    calcModal.hidden = true;
                    calcModal.style.display = 'none';
                }
            }
        });
    }
    
    // Fix user manual toggle button event
    const manualBtn = document.getElementById('toggleManual');
    if (manualBtn) {
        manualBtn.addEventListener('click', function() {
            const manualContent = document.getElementById('manualContent');
            const toggleIcon = manualBtn.querySelector('i');
            if (!manualContent || !toggleIcon) return;
            if (manualContent.style.display === 'none' || manualContent.style.display === '') {
                manualContent.style.display = 'block';
                toggleIcon.classList.replace('fa-book', 'fa-book-open');
                manualBtn.setAttribute('aria-expanded', 'true');
            } else {
                manualContent.style.display = 'none';
                toggleIcon.classList.replace('fa-book-open', 'fa-book');
                manualBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    // Export (robust, only once)
    const exportButton = document.getElementById('exportBtn');
    if (exportButton) {
        exportButton.replaceWith(exportButton.cloneNode(true)); // Remove all previous listeners
        const newExportButton = document.getElementById('exportBtn');
        newExportButton.addEventListener('click', exportTransactions);
        console.log('Export event listener attached');
    }
    
    // Trend modal open/close logic
    const openTrendModalBtn = document.getElementById('openTrendModalBtn');
    const trendModal = document.getElementById('trendModal');
    const closeTrendModal = document.getElementById('closeTrendModal');
    if (openTrendModalBtn && trendModal && closeTrendModal) {
        openTrendModalBtn.addEventListener('click', function() {
            trendModal.hidden = false;
            trendModal.style.display = 'flex';
            window.ChartManager.renderTrendChart();
        });
        closeTrendModal.addEventListener('click', function() {
            trendModal.hidden = true;
            trendModal.style.display = 'none';
        });
        trendModal.addEventListener('click', function(e) {
            if (e.target === trendModal) {
                trendModal.hidden = true;
                trendModal.style.display = 'none';
            }
        });
    }
    
    // Call calculator integration setup
    setupCalculatorIntegration();
});

// Global variables
let transactions = [];
let trendChart = null;
let lastDeletedTransaction = null;
let undoTimeoutId = null;

// Constants
const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense'
};

const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info'
};

const CATEGORIES = {
    INCOME: [
        { value: 'Salary', icon: 'fa-money-bill-wave' },
        { value: 'Freelance', icon: 'fa-laptop-code' },
        { value: 'Investment', icon: 'fa-chart-line' },
        { value: 'Gift', icon: 'fa-gift' },
        { value: 'Other Income', icon: 'fa-coins' }
    ],
    EXPENSE: [
        { value: 'Food', icon: 'fa-utensils' },
        { value: 'Transportation', icon: 'fa-car' },
        { value: 'Housing', icon: 'fa-home' },
        { value: 'Entertainment', icon: 'fa-film' },
        { value: 'Shopping', icon: 'fa-shopping-bag' },
        { value: 'Utilities', icon: 'fa-lightbulb' },
        { value: 'Health', icon: 'fa-heartbeat' },
        { value: 'Education', icon: 'fa-graduation-cap' },
        { value: 'Travel', icon: 'fa-plane' },
        { value: 'Other Expense', icon: 'fa-wallet' }
    ]
};

function initApp() {
    try {
        // Set current date
        setCurrentDate();
        
        // Load saved transactions
        loadTransactions();
        
        // Update UI summaries
        updateSummaryUI();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize theme
        initializeTheme();
        
        // Update category options
        updateCategoryOptions();
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize application', NOTIFICATION_TYPES.ERROR);
    }
}

// ======================
// DATE & TIME FUNCTIONS
// ======================
function setCurrentDate() {
    try {
        const dateElement = document.getElementById('currentDate');
        if (!dateElement) return;
        
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const currentDate = new Date().toLocaleDateString(undefined, options);
        dateElement.textContent = currentDate;
        
        // Set default date for transaction form to today
        const dateInput = document.getElementById('transactionDate');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
    } catch (error) {
        console.error('Date setting error:', error);
    }
}

// ======================
// DATA STORAGE FUNCTIONS
// ======================
function loadTransactions() {
    try {
        const savedTransactions = localStorage.getItem('transactions');
        if (savedTransactions) {
            transactions = JSON.parse(savedTransactions);
            renderTransactions();
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        showNotification('Error loading saved transactions', NOTIFICATION_TYPES.ERROR);
    }
}

function saveTransactions() {
    try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (error) {
        console.error('Error saving transactions:', error);
        showNotification('Error saving transactions', NOTIFICATION_TYPES.ERROR);
    }
}

// ======================
// UI UPDATE FUNCTIONS
// ======================
function updateSummaryUI() {
    try {
        let totalIncome = 0;
        let totalExpense = 0;
        
        transactions.forEach(transaction => {
            if (transaction.type === TRANSACTION_TYPES.INCOME) {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }
        });
        
        const balance = totalIncome - totalExpense;
        
        // Update UI elements
        updateElementWithAnimation('totalIncome', formatCurrency(totalIncome));
        updateElementWithAnimation('totalExpense', formatCurrency(totalExpense));
        updateElementWithAnimation('balanceAmount', formatCurrency(balance));
        
        // Update balance color based on value
        const balanceElement = document.getElementById('balanceAmount');
        if (balanceElement) {
            balanceElement.style.color = balance < 0 ? 'var(--expense-color)' : 'white';
        }
    } catch (error) {
        console.error('Error updating summary UI:', error);
    }
}

function updateElementWithAnimation(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
        element.textContent = `$${newValue}`;
        element.classList.remove('animate__animated', 'animate__pulse');
    }, 300);
}

function renderTransactions() {
    try {
        const transactionsList = document.getElementById('transactionsList');
        const emptyState = document.querySelector('.empty-state');
        
        if (!transactionsList) return;
        
        // Show empty state if no transactions
        if (!transactions || transactions.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'flex';
                transactionsList.innerHTML = '';
                transactionsList.appendChild(emptyState);
            }
            // Only set up transaction listeners, not all listeners
            setupTransactionEventListeners();
            return;
        }
        
        // Hide empty state
        if (emptyState) emptyState.style.display = 'none';
        
        // Get filter values
        const searchTerm = (document.getElementById('searchTransactions')?.value || '').toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
        const typeFilter = document.getElementById('typeFilter')?.value || 'all';
        
        // Filter transactions
        const filteredTransactions = transactions.filter(transaction => {
            const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) ||
                                 transaction.category.toLowerCase().includes(searchTerm);
            const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
            const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
            return matchesSearch && matchesCategory && matchesType;
        });
        
        // Generate HTML for transactions
        transactionsList.innerHTML = filteredTransactions.map(transaction => 
            createTransactionHTML(transaction)
        ).join('');
        
        // Set up event listeners for transaction actions only
        setupTransactionEventListeners();
    } catch (error) {
        console.error('Error rendering transactions:', error);
    }
}

function createTransactionHTML(transaction) {
    const formattedDate = new Date(transaction.date).toLocaleDateString();
    const amountClass = transaction.type === TRANSACTION_TYPES.INCOME ? 'income-amount' : 'expense-amount';
    const iconClass = transaction.type === TRANSACTION_TYPES.INCOME ? 'income-icon' : 'expense-icon';
    const indicatorClass = transaction.type === TRANSACTION_TYPES.INCOME ? 'income-indicator' : 'expense-indicator';
    const iconType = getCategoryIcon(transaction.category);
    const formattedAmount = formatCurrency(transaction.amount);
    
    return `
        <div class="transaction-item fade-in" data-id="${transaction.id}" tabindex="0" 
             aria-label="Transaction: ${transaction.description}, amount: ${formattedAmount}">
            <div class="transaction-indicator ${indicatorClass}"></div>
            <div class="transaction-icon ${iconClass}">
                <i class="fas ${iconType}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-title">${transaction.description}</div>
                <div class="transaction-category">
                    <span class="category-badge">${transaction.category}</span>
                </div>
            </div>
            <div class="transaction-date">
                <i class="far fa-calendar-alt"></i>
                <span>${formattedDate}</span>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${transaction.type === TRANSACTION_TYPES.INCOME ? '+' : '-'}${formattedAmount}
            </div>
            <div class="transaction-actions" role="group" aria-label="Transaction actions">
                <button class="action-btn edit-btn" title="Edit" aria-label="Edit transaction">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete" aria-label="Delete transaction">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function setupTransactionEventListeners() {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;
    
    // Event delegation for transaction actions
    transactionsList.onclick = function(e) {
        const item = e.target.closest('.transaction-item');
        if (!item) return;
        
        const transactionId = item.getAttribute('data-id');
        
        if (e.target.closest('.edit-btn')) {
            openEditModal(transactionId);
        } else if (e.target.closest('.delete-btn')) {
            handleDeleteTransactionById(transactionId);
        }
    };
}

// ======================
// TRANSACTION FUNCTIONS
// ======================
function handleTransactionSubmit(e) {
    e.preventDefault();
    let transaction = null;
    try {
        // Get form values
        const date = document.getElementById('transactionDate').value;
        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const category = document.getElementById('transactionCategory').value;
        const description = document.getElementById('transactionDescription').value.trim();
        
        // Validate input
        if (!validateTransactionInput(date, type, amount, category, description)) {
            return;
        }
        
        // Create transaction object
        transaction = {
            id: Date.now().toString(),
            date,
            type,
            amount,
            category,
            description,
            createdAt: new Date().toISOString()
        };
        
        // Add to transactions array
        transactions.unshift(transaction);
        saveTransactions();
    } catch (error) {
        console.error('Error submitting transaction:', error);
        showNotification('Error adding transaction', NOTIFICATION_TYPES.ERROR);
        return;
    }
    // UI updates (separate try/catch for each, only show error if critical step fails)
    try {
        renderTransactions();
    } catch (error) {
        console.error('Error rendering transactions:', error);
        showNotification('Transaction added, but error updating UI', NOTIFICATION_TYPES.ERROR);
        return;
    }
    try {
        updateSummaryUI();
    } catch (error) {
        console.error('Error updating summary UI:', error);
        showNotification('Transaction added, but error updating UI', NOTIFICATION_TYPES.ERROR);
        return;
    }
    try {
        updateAllCharts();
    } catch (error) {
        console.warn('Error updating charts:', error);
    }
    try {
        highlightNewTransaction(transaction.id);
    } catch (error) {
        console.warn('Error highlighting new transaction:', error);
    }
    try {
        resetTransactionForm();
    } catch (error) {
        console.warn('Error resetting transaction form:', error);
    }
    showNotification('Transaction added successfully!', NOTIFICATION_TYPES.SUCCESS);
}

function validateTransactionInput(date, type, amount, category, description) {
    if (!date || !type || !amount || isNaN(amount) || amount <= 0 || !category || !description) {
        showNotification('Please fill in all fields with valid values.', NOTIFICATION_TYPES.ERROR);
        return false;
    }
    
    // Highlight invalid fields
    const highlightField = (id, isValid) => {
        const field = document.getElementById(id);
        if (field) {
            field.classList.toggle('invalid', !isValid);
        }
    };
    
    highlightField('transactionDate', !!date);
    highlightField('transactionAmount', !isNaN(amount) && amount > 0);
    highlightField('transactionCategory', !!category);
    highlightField('transactionDescription', !!description);
    
    return true;
}

function addActionBadge(transactionId, text, badgeClass = '') {
    const item = document.querySelector(`.transaction-item[data-id="${transactionId}"]`);
    if (!item) return;
    let badge = document.createElement('span');
    badge.className = `action-badge ${badgeClass}`;
    badge.textContent = text;
    item.querySelector('.transaction-title').appendChild(badge);
    setTimeout(() => badge.remove(), 1200);
}

// Override highlightNewTransaction to use .adding class and badge
function highlightNewTransaction(transactionId) {
    const transactionElement = document.querySelector(`.transaction-item[data-id="${transactionId}"]`);
    if (transactionElement) {
        transactionElement.classList.add('adding');
        addActionBadge(transactionId, 'Added');
        setTimeout(() => {
            transactionElement.classList.remove('adding');
        }, 700);
    }
}

// Enhance edit to show .editing class and badge
function openEditModal(transactionId) {
    try {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        // Fill form with transaction data
        document.getElementById('editTransactionId').value = transaction.id;
        document.getElementById('editTransactionDate').value = transaction.date;
        document.getElementById('editTransactionType').value = transaction.type;
        document.getElementById('editTransactionAmount').value = transaction.amount;
        document.getElementById('editTransactionCategory').value = transaction.category;
        document.getElementById('editTransactionDescription').value = transaction.description;
        
        // Update category options based on type
        updateEditCategoryOptions();
        
        // Show modal
        document.getElementById('editModal').style.display = 'flex';
        
        // Add editing highlight
        setTimeout(() => {
            const el = document.querySelector(`.transaction-item[data-id="${transactionId}"]`);
            if (el) {
                el.classList.add('editing');
                addActionBadge(transactionId, 'Editing', '');
                setTimeout(() => el.classList.remove('editing'), 1200);
            }
        }, 100);
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showNotification('Error opening transaction editor', NOTIFICATION_TYPES.ERROR);
    }
}

// Enhance handleEditTransactionSubmit to show badge
function handleEditTransactionSubmit(e) {
    e.preventDefault();
    
    try {
        // Get form values
        const id = document.getElementById('editTransactionId').value;
        const date = document.getElementById('editTransactionDate').value;
        const type = document.getElementById('editTransactionType').value;
        const amount = parseFloat(document.getElementById('editTransactionAmount').value);
        const category = document.getElementById('editTransactionCategory').value;
        const description = document.getElementById('editTransactionDescription').value.trim();
        
        // Validate input
        if (!validateTransactionInput(date, type, amount, category, description)) {
            return;
        }
        
        // Find and update transaction
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                date,
                type,
                amount,
                category,
                description
            };
            
            // Save and update UI
            saveTransactions();
            renderTransactions();
            updateSummaryUI();
            updateAllCharts();
            closeModal();
            
            setTimeout(() => addActionBadge(id, 'Edited', ''), 200);
            showNotification('Transaction updated successfully!', NOTIFICATION_TYPES.SUCCESS);
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        showNotification('Error updating transaction', NOTIFICATION_TYPES.ERROR);
    }
}

function handleDeleteTransaction() {
    try {
        const id = document.getElementById('editTransactionId').value;
        handleDeleteTransactionById(id);
        closeModal();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showNotification('Error deleting transaction', NOTIFICATION_TYPES.ERROR);
    }
}

function handleDeleteTransactionById(id) {
    try {
        const index = transactions.findIndex(t => t.id === id);
        if (index === -1) return;
        const deleted = transactions[index];
        const transactionElement = document.querySelector(`.transaction-item[data-id="${id}"]`);
        if (transactionElement) {
            transactionElement.classList.add('removing');
            addActionBadge(id, 'Deleted', '');
            setTimeout(() => {
                transactions.splice(index, 1);
                saveTransactions();
                renderTransactions();
                updateSummaryUI();
                updateAllCharts();
                showUndoDeleteNotification(deleted);
            }, 400);
        } else {
            transactions.splice(index, 1);
            saveTransactions();
            renderTransactions();
            updateSummaryUI();
            updateAllCharts();
            showUndoDeleteNotification(deleted);
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showNotification('Error deleting transaction', NOTIFICATION_TYPES.ERROR);
    }
}

function showUndoDeleteNotification(transaction) {
    lastDeletedTransaction = transaction;
    // Remove any existing undo notification
    const existing = document.getElementById('undo-individual-notification');
    if (existing) existing.remove();
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.id = 'undo-individual-notification';
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `Transaction deleted. <button id="undoIndividualBtn" style="margin-left:12px;padding:4px 12px;background:#fff;color:#3ecf8e;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Undo</button>`;
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '8px',
        color: '#fff',
        backgroundColor: 'var(--income-color)',
        boxShadow: 'var(--shadow)',
        zIndex: '1000',
        opacity: '0',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        transform: 'translateY(20px)',
        minWidth: '200px',
        maxWidth: '400px'
    });
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    // Remove after 8 seconds
    clearTimeout(undoTimeoutId);
    undoTimeoutId = setTimeout(() => {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
        lastDeletedTransaction = null;
    }, 8000);
    // Undo button logic
    document.getElementById('undoIndividualBtn').onclick = function() {
        if (lastDeletedTransaction) {
            transactions.unshift(lastDeletedTransaction);
            saveTransactions();
            renderTransactions();
            updateSummaryUI();
            updateAllCharts();
            showNotification('Transaction restored!', NOTIFICATION_TYPES.SUCCESS);
        }
        if (notification.parentNode) notification.parentNode.removeChild(notification);
        lastDeletedTransaction = null;
        clearTimeout(undoTimeoutId);
    };
}

// ======================
// CATEGORY FUNCTIONS
// ======================
function updateCategoryOptions() {
    try {
        const typeSelect = document.getElementById('transactionType');
        const categorySelect = document.getElementById('transactionCategory');
        
        if (!typeSelect || !categorySelect) return;
        
        const type = typeSelect.value;
        const categories = type === TRANSACTION_TYPES.INCOME ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;
        
        // Clear existing options
        categorySelect.innerHTML = '';
        
        // Add new options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.value;
            option.dataset.type = type;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error updating category options:', error);
    }
}

function updateEditCategoryOptions() {
    try {
        const typeSelect = document.getElementById('editTransactionType');
        const categorySelect = document.getElementById('editTransactionCategory');
        
        if (!typeSelect || !categorySelect) return;
        
        const type = typeSelect.value;
        const categories = type === TRANSACTION_TYPES.INCOME ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;
        
        // Save current value
        const currentValue = categorySelect.value;
        
        // Clear existing options
        categorySelect.innerHTML = '';
        
        // Add new options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.value;
            option.dataset.type = type;
            categorySelect.appendChild(option);
        });
        
        // Restore current value if it exists in new options
        if (categories.some(c => c.value === currentValue)) {
            categorySelect.value = currentValue;
        }
    } catch (error) {
        console.error('Error updating edit category options:', error);
    }
}

function getCategoryIcon(category) {
    // Search in income categories
    const incomeCategory = CATEGORIES.INCOME.find(c => c.value === category);
    if (incomeCategory) return incomeCategory.icon;
    
    // Search in expense categories
    const expenseCategory = CATEGORIES.EXPENSE.find(c => c.value === category);
    if (expenseCategory) return expenseCategory.icon;
    
    // Default icon
    return 'fa-tag';
}

// ======================
// FILTER & SEARCH FUNCTIONS
// ======================
function filterTransactions() {
    renderTransactions();
}

// ======================
// MODAL FUNCTIONS
// ======================
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// ======================
// THEME FUNCTIONS
// ======================
function initializeTheme() {
    try {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
    } catch (error) {
        console.error('Error initializing theme:', error);
    }
}

function toggleTheme() {
    try {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    } catch (error) {
        console.error('Error toggling theme:', error);
    }
}

function setTheme(theme) {
    try {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeIcon = document.getElementById('themeToggleIcon');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    } catch (error) {
        console.error('Error setting theme:', error);
    }
}

// ======================
// IMPORT/EXPORT FUNCTIONS
// ======================
function exportTransactions() {
    try {
        if (transactions.length === 0) {
            showNotification('No transactions to export.', NOTIFICATION_TYPES.ERROR);
            return;
        }
        // Get summary info
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
        const balance = totalIncome - totalExpense;
        // Receipt-style HTML
        let html = `<html><head><title>NeoFinance Receipt</title><style>
            body{font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;background:#fff;color:#222;margin:0;padding:0;}
            .receipt-container{max-width:700px;margin:30px auto;padding:24px 18px;background:#fafbfc;border-radius:12px;box-shadow:0 2px 12px #0001;}
            h2{text-align:center;margin-bottom:8px;}
            .summary{margin-bottom:18px;}
            .summary p{margin:4px 0;font-size:16px;}
            table{border-collapse:collapse;width:100%;margin-top:12px;}
            th,td{border:1px solid #ccc;padding:8px 10px;text-align:left;}
            th{background:#f0f0f0;}
            .income{color:#3ecf8e;}
            .expense{color:#ff6b6b;}
            .footer{text-align:center;margin-top:24px;font-size:13px;color:#888;}
        </style></head><body>`;
        html += '<div class="receipt-container">';
        html += '<h2>NeoFinance - Transactions Receipt</h2>';
        html += `<div class="summary">
            <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Balance:</strong> $${formatCurrency(balance)}</p>
            <p class="income"><strong>Total Income:</strong> $${formatCurrency(totalIncome)}</p>
            <p class="expense"><strong>Total Expense:</strong> $${formatCurrency(totalExpense)}</p>
            <p><strong>Transactions:</strong> ${transactions.length}</p>
        </div>`;
        html += '<table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount ($)</th></tr></thead><tbody>';
        transactions.forEach(t => {
            html += `<tr><td>${new Date(t.date).toLocaleDateString()}</td><td class="${t.type}">${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</td><td>${t.category}</td><td>${t.description}</td><td class="${t.type}">$${formatCurrency(t.amount)}</td></tr>`;
        });
        html += '</tbody></table>';
        html += '<div class="footer">&copy; 2025 NeoFinance. Exported by NeoFinance Expense Tracker.</div>';
        html += '</div></body></html>';
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neofinance_receipt_${new Date().toISOString().slice(0,10)}.html`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        showNotification('Transactions exported as HTML receipt!', NOTIFICATION_TYPES.SUCCESS);
    } catch (error) {
        console.error('Error exporting transactions:', error);
        showNotification('Error exporting transactions', NOTIFICATION_TYPES.ERROR);
    }
}

// ======================
// UTILITY FUNCTIONS
// ======================
function formatCurrency(amount) {
    try {
        return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch (error) {
        console.error('Error formatting currency:', error);
        return amount;
    }
}

function showNotification(message, type) {
    try {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '15px 25px',
            borderRadius: '8px',
            color: '#fff',
            backgroundColor: type === NOTIFICATION_TYPES.SUCCESS ? 'var(--income-color)' : 
                          type === NOTIFICATION_TYPES.ERROR ? 'var(--expense-color)' : 'var(--primary-color)',
            boxShadow: 'var(--shadow)',
            zIndex: '1000',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            transform: 'translateY(20px)',
            minWidth: '200px',
            maxWidth: '400px'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// ======================
// EVENT LISTENERS SETUP
// ======================
function setupEventListeners() {
    try {
        // Transaction form submission
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.addEventListener('submit', handleTransactionSubmit);
        }
        
        // Transaction type change - update category options
        const transactionType = document.getElementById('transactionType');
        if (transactionType) {
            transactionType.addEventListener('change', updateCategoryOptions);
        }
        
        const editTransactionType = document.getElementById('editTransactionType');
        if (editTransactionType) {
            editTransactionType.addEventListener('change', updateEditCategoryOptions);
        }
        
        // Cancel button
        const cancelButton = document.getElementById('cancelTransaction');
        if (cancelButton) {
            cancelButton.addEventListener('click', resetTransactionForm);
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggleIcon')?.parentElement;
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        // Search and filters
        const searchInput = document.getElementById('searchTransactions');
        if (searchInput) {
            searchInput.addEventListener('input', filterTransactions);
        }
        
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterTransactions);
        }
        
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', filterTransactions);
        }
        
        // Modal close button
        const closeModalButton = document.querySelector('.close-modal');
        if (closeModalButton) {
            closeModalButton.addEventListener('click', closeModal);
        }
        
        // Edit transaction form
        const editForm = document.getElementById('editTransactionForm');
        if (editForm) {
            editForm.addEventListener('submit', handleEditTransactionSubmit);
        }
        
        // Delete transaction
        const deleteButton = document.getElementById('deleteTransaction');
        if (deleteButton) {
            deleteButton.addEventListener('click', handleDeleteTransaction);
        }
        
        // Export (robust, only once)
        const exportButton = document.getElementById('exportBtn');
        if (exportButton) {
            exportButton.replaceWith(exportButton.cloneNode(true)); // Remove all previous listeners
            const newExportButton = document.getElementById('exportBtn');
            newExportButton.addEventListener('click', exportTransactions);
            console.log('Export event listener attached');
        }
        
        // Calculator
        setupCalculator();
        
        // User manual toggle
        const toggleManualButton = document.getElementById('toggleManual');
        if (toggleManualButton) {
            toggleManualButton.addEventListener('click', toggleManual);
        }
        
        // Trend modal open/close logic
        const openTrendModalBtn = document.getElementById('openTrendModalBtn');
        const trendModal = document.getElementById('trendModal');
        const closeTrendModal = document.getElementById('closeTrendModal');
        if (openTrendModalBtn && trendModal && closeTrendModal) {
            openTrendModalBtn.addEventListener('click', function() {
                trendModal.hidden = false;
                trendModal.style.display = 'flex';
                window.ChartManager.renderTrendChart();
            });
            closeTrendModal.addEventListener('click', function() {
                trendModal.hidden = true;
                trendModal.style.display = 'none';
            });
            trendModal.addEventListener('click', function(e) {
                if (e.target === trendModal) {
                    trendModal.hidden = true;
                    trendModal.style.display = 'none';
                }
            });
        }
        
        // Keyboard accessibility
        document.addEventListener('keydown', function(event) {
            // Close modal with Escape key
            if (event.key === 'Escape' && document.getElementById('editModal').style.display === 'flex') {
                closeModal();
            }
            
            // Submit transaction form with Enter key when focused
            if (event.key === 'Enter' && document.activeElement.closest('#transactionForm')) {
                document.getElementById('transactionForm').dispatchEvent(new Event('submit'));
            }
            
            // Submit edit form with Enter key when focused
            if (event.key === 'Enter' && document.activeElement.closest('#editTransactionForm')) {
                document.getElementById('editTransactionForm').dispatchEvent(new Event('submit'));
            }
        });
        
        // Handle window resize for chart responsiveness
        window.addEventListener('resize', function() {
            if (chart) {
                chart.resize();
            }
        });
        
        // Responsive calculator modal: close on resize if too small
        window.addEventListener('resize', function() {
            const calcModal = document.getElementById('calculatorModal');
            if (calcModal && window.innerWidth < 350) {
                calcModal.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// ======================
// MANUAL TOGGLE FUNCTION
// ======================
function toggleManual() {
    try {
        const manualContent = document.getElementById('manualContent');
        const toggleIcon = document.getElementById('toggleManual')?.querySelector('i');
        
        if (!manualContent || !toggleIcon) return;
        
        if (manualContent.style.display === 'none' || manualContent.style.display === '') {
            manualContent.style.display = 'block';
            toggleIcon.classList.replace('fa-book', 'fa-book-open');
        } else {
            manualContent.style.display = 'none';
            toggleIcon.classList.replace('fa-book-open', 'fa-book');
        }
    } catch (error) {
        console.error('Error toggling manual:', error);
    }
}

// ======================
// CALCULATOR SETUP
// ======================
function setupCalculator() {
    try {
        const calcModal = document.getElementById('calculatorModal');
        const display = document.getElementById('calcDisplay');
        const buttons = document.querySelectorAll('.calc-btn');
        let currentInput = '';
        let lastCalculation = '';

        if (!display || !buttons.length) return;

        // Helper: update display
        function updateDisplay(value) {
            display.value = value;
        }

        // Button click logic
        buttons.forEach(btn => {
            btn.onclick = function () {
                const val = btn.dataset.value;
                if (!val) return;
                if (val === 'C') {
                    currentInput = '';
                    updateDisplay('');
                } else if (val === '←') {
                    currentInput = currentInput.slice(0, -1);
                    updateDisplay(currentInput);
                } else if (val === '=') {
                    try {
                        // Only allow numbers and basic operators
                        if (/^[0-9+\-*/. ()]+$/.test(currentInput)) {
                            // eslint-disable-next-line no-eval
                            let result = eval(currentInput);
                            if (typeof result === 'number' && isFinite(result)) {
                                updateDisplay(result);
                                lastCalculation = currentInput + ' = ' + result;
                                currentInput = result.toString();
                            } else {
                                updateDisplay('Error');
                                currentInput = '';
                            }
                        } else {
                            updateDisplay('Error');
                            currentInput = '';
                        }
                    } catch {
                        updateDisplay('Error');
                        currentInput = '';
                    }
                } else {
                    // Prevent multiple decimals in a number
                    if (val === '.' && /\.?$/.test(currentInput.split(/[-+*/]/).pop())) {
                        if (currentInput.split(/[-+*/]/).pop().includes('.')) return;
                    }
                    currentInput += val;
                    updateDisplay(currentInput);
                }
            };
        });

        // Keyboard support
        display.onkeydown = function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const eqBtn = Array.from(buttons).find(b => b.dataset.value === '=');
                if (eqBtn) eqBtn.click();
            } else if (e.key === 'Escape') {
                currentInput = '';
                updateDisplay('');
            }
        };

        // Optional: clear input when modal closes
        if (calcModal) {
            calcModal.addEventListener('hide', function () {
                currentInput = '';
                updateDisplay('');
            });
        }
    } catch (error) {
        console.error('Error setting up calculator:', error);
    }
}

// ======================
// CALCULATOR INTEGRATION
// ======================
function setupCalculatorIntegration() {
    setupCalculator();
}

// --- Patch setupTransactionEventListeners to remove checkbox logic ---
function setupTransactionEventListeners() {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;
    
    // Event delegation for transaction actions
    transactionsList.onclick = function(e) {
        const item = e.target.closest('.transaction-item');
        if (!item) return;
        
        const transactionId = item.getAttribute('data-id');
        
        if (e.target.closest('.edit-btn')) {
            openEditModal(transactionId);
        } else if (e.target.closest('.delete-btn')) {
            handleDeleteTransactionById(transactionId);
        }
    };
}

// --- Patch setupEventListeners to remove deleteSelectedBtn event ---
const origSetupEventListeners = setupEventListeners;
setupEventListeners = function() {
    origSetupEventListeners && origSetupEventListeners();
};

// Reset the add transaction form fields and error states
function resetTransactionForm() {
    const form = document.getElementById('transactionForm');
    if (form) {
        form.reset();
        // Optionally, clear any custom error messages or UI highlights here
    } else {
        console.warn('Transaction form not found');
    }
}

// --- Trend Chart Logic (restored, modern, only for #trendChart) ---
(function() {
    let trendChartInstance = null;
    const openTrendModalBtn = document.getElementById('openTrendModalBtn');
    const trendModal = document.getElementById('trendModal');
    const closeTrendModal = document.getElementById('closeTrendModal');
    const trendChartCanvas = document.getElementById('trendChart');
    const trendEmptyMsg = document.getElementById('trendEmptyMsg');

    function getMonthlyTotals(transactions) {
        // Returns { 'YYYY-MM': { income: 0, expense: 0 } }
        const monthly = {};
        transactions.forEach(t => {
            const date = new Date(t.date);
            if (isNaN(date)) return;
            const ym = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
            if (!monthly[ym]) monthly[ym] = { income: 0, expense: 0 };
            if (t.type === 'income') monthly[ym].income += Number(t.amount);
            else if (t.type === 'expense') monthly[ym].expense += Number(t.amount);
        });
        return monthly;
    }

    function formatMonth(ym) {
        // ym = 'YYYY-MM' to 'Month YYYY'
        const [year, month] = ym.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    let selectedMonthIndex = null;
    function renderTrendChart() {
        if (!trendChartCanvas) return;
        // Get transactions from global or localStorage
        let tx = window.transactions;
        if (!tx) {
            try {
                tx = JSON.parse(localStorage.getItem('transactions') || '[]');
            } catch { tx = []; }
        }
        const monthly = getMonthlyTotals(tx || []);
        const labels = Object.keys(monthly).sort();
        const incomeData = labels.map(m => monthly[m].income);
        const expenseData = labels.map(m => monthly[m].expense);
        let displayLabels = labels.map(formatMonth);
        let displayIncome = incomeData;
        let displayExpense = expenseData;
        // If a month is selected, show only that month
        if (selectedMonthIndex !== null && labels[selectedMonthIndex]) {
            displayLabels = [labels.map(formatMonth)[selectedMonthIndex]];
            displayIncome = [incomeData[selectedMonthIndex]];
            displayExpense = [expenseData[selectedMonthIndex]];
        }
        if (trendChartInstance) {
            trendChartInstance.destroy();
        }
        if (labels.length === 0) {
            trendChartCanvas.style.display = 'none';
            if (trendEmptyMsg) trendEmptyMsg.style.display = 'flex';
            return;
        }
        trendChartCanvas.style.display = 'block';
        if (trendEmptyMsg) trendEmptyMsg.style.display = 'none';
        trendChartInstance = new Chart(trendChartCanvas, {
            type: 'bar',
            data: {
                labels: displayLabels,
                datasets: [
                    {
                        label: 'Income',
                        data: displayIncome,
                        backgroundColor: 'rgba(0, 219, 222, 0.7)',
                        maxBarThickness: 18,
                        barPercentage: 0.5,
                        categoryPercentage: 0.5
                    },
                    {
                        label: 'Expense',
                        data: displayExpense,
                        backgroundColor: 'rgba(252, 0, 255, 0.7)',
                        maxBarThickness: 18,
                        barPercentage: 0.5,
                        categoryPercentage: 0.5
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Income & Expense Trend by Month' },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const type = context.dataset.label;
                                const value = context.parsed.y;
                                const month = context.chart.data.labels[context.dataIndex];
                                // Calculate total for this month
                                const income = context.chart.data.datasets[0].data[context.dataIndex] || 0;
                                const expense = context.chart.data.datasets[1].data[context.dataIndex] || 0;
                                const total = income + expense;
                                let percent = total > 0 ? (value / total * 100) : 0;
                                percent = percent.toFixed(1);
                                return `${month} — ${type}: $${value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${percent}% of total)`;
                            }
                        }
                    }
                },
                hover: {
                    mode: 'index',
                    intersect: false
                },
                onClick: (e, elements, chart) => {
                    // Show tooltip and select month on bar click
                    const points = chart.getElementsAtEventForMode(e, 'index', { intersect: false }, true);
                    if (points.length > 0) {
                        // Find the index in the original labels array
                        let idx = points[0].index;
                        if (selectedMonthIndex === null) {
                            selectedMonthIndex = idx;
                        } else {
                            // If already selected, reset
                            selectedMonthIndex = null;
                        }
                        renderTrendChart();
                        // Show tooltip for selected bar
                        setTimeout(() => {
                            if (trendChartInstance && selectedMonthIndex !== null) {
                                const tooltipPoints = trendChartInstance.getElementsAtEventForMode(e, 'index', { intersect: false }, true);
                                trendChartInstance.setActiveElements(tooltipPoints);
                                trendChartInstance.tooltip.setActiveElements(tooltipPoints, {x: 0, y: tooltipPoints[0].datasetIndex});
                                trendChartInstance.update();
                            }
                        }, 50);
                    }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Amount ($)' } },
                    x: {
                        title: { display: true, text: 'Month' },
                        barPercentage: 0.5,
                        categoryPercentage: 0.5
                    }
                }
            }
        });
    }

    // Expose ChartManager globally
    window.ChartManager = window.ChartManager || {};
    window.ChartManager.renderTrendChart = renderTrendChart;

    if (openTrendModalBtn && trendModal && closeTrendModal) {
        openTrendModalBtn.addEventListener('click', function() {
            trendModal.hidden = false;
            trendModal.style.display = 'flex';
            window.ChartManager.renderTrendChart();
        });
        closeTrendModal.addEventListener('click', function() {
            trendModal.hidden = true;
            trendModal.style.display = 'none';
        });
        trendModal.addEventListener('click', function(e) {
            if (e.target === trendModal) {
                trendModal.hidden = true;
                trendModal.style.display = 'none';
            }
        });
    }
})();

// --- Trend Chart Controls Logic (Dropdown modal, then single month bar chart modal) ---
(function() {
    const openTrendModalBtn = document.getElementById('openTrendModalBtn');
    const trendModal = document.getElementById('trendModal');
    const trendMonthSelect = document.getElementById('trendMonthSelect');
    const trendBackBtn = document.getElementById('trendBackBtn');
    const trendChartCanvas = document.getElementById('trendChart');
    const trendEmptyMsg = document.getElementById('trendEmptyMsg');
    let trendDropdownMsg = document.getElementById('trendDropdownMsg');
    if (!trendDropdownMsg) {
        trendDropdownMsg = document.createElement('div');
        trendDropdownMsg.id = 'trendDropdownMsg';
        trendDropdownMsg.style.margin = '0 0 10px 0';
        trendDropdownMsg.style.fontWeight = 'bold';
        trendDropdownMsg.style.fontSize = '1.1em';
        trendDropdownMsg.style.color = 'var(--text-color, #333)';
        trendMonthSelect.parentNode.insertBefore(trendDropdownMsg, trendMonthSelect);
    }
    let lastMonthOptions = [];
    let allMonthData = [];
    let selectedMonthIndex = null;
    let trendChartInstance = null;

    // Helper to get sorted months and their data from transactions
    function getSortedMonthsAndData() {
        let tx = window.transactions;
        if (!tx) {
            try {
                tx = JSON.parse(localStorage.getItem('transactions') || '[]');
            } catch { tx = []; }
        }
        const monthly = {};
        tx.forEach(t => {
            const date = new Date(t.date);
            if (!isNaN(date)) {
                const ym = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
                if (!monthly[ym]) monthly[ym] = { income: 0, expense: 0 };
                if (t.type === 'income') monthly[ym].income += Number(t.amount);
                else if (t.type === 'expense') monthly[ym].expense += Number(t.amount);
            }
        });
        const months = Object.keys(monthly).sort();
        const data = months.map(m => monthly[m]);
        return { months, data };
    }

    // Helper to format month
    function formatMonth(ym) {
        const [year, month] = ym.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    // Populate dropdown (no 'All Months' option)
    function populateMonthDropdown() {
        if (!trendMonthSelect) return;
        const { months, data } = getSortedMonthsAndData();
        lastMonthOptions = months;
        allMonthData = data;
        trendMonthSelect.innerHTML = '';
        months.forEach((ym, idx) => {
            const opt = document.createElement('option');
            opt.value = ym;
            opt.textContent = formatMonth(ym);
            trendMonthSelect.appendChild(opt);
        });
        trendMonthSelect.value = '';
        trendBackBtn.style.display = 'none';
        selectedMonthIndex = null;
        // Hide chart, show dropdown and message
        if (trendChartCanvas) trendChartCanvas.style.display = 'none';
        if (trendEmptyMsg) trendEmptyMsg.style.display = 'none';
        trendMonthSelect.style.display = 'inline-block';
        if (trendDropdownMsg) trendDropdownMsg.textContent = 'Select month to see flow';
    }

    // Show only the selected month's bar chart (income/expense for that month)
    function showSingleMonthBarChart(idx) {
        if (!trendChartCanvas) return;
        if (trendChartInstance) {
            trendChartInstance.destroy();
        }
        if (!allMonthData[idx]) {
            trendChartCanvas.style.display = 'none';
            if (trendEmptyMsg) trendEmptyMsg.style.display = 'flex';
            return;
        }
        trendChartCanvas.style.display = 'block';
        if (trendEmptyMsg) trendEmptyMsg.style.display = 'none';
        const monthLabel = formatMonth(lastMonthOptions[idx]);
        trendChartInstance = new Chart(trendChartCanvas, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expense'],
                datasets: [{
                    label: monthLabel,
                    data: [allMonthData[idx].income, allMonthData[idx].expense],
                    backgroundColor: [
                        'rgba(0, 219, 222, 0.7)',
                        'rgba(252, 0, 255, 0.7)'
                    ],
                    maxBarThickness: 40,
                    barPercentage: 0.6,
                    categoryPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: monthLabel + ' Income & Expense' },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return context.label + ': $' + context.parsed.y.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Amount ($)' } },
                    x: { title: { display: false } }
                }
            }
        });
    }

    // Handle dropdown change
    function handleMonthSelectChange() {
        const val = trendMonthSelect.value;
        if (!val) {
            // No month selected, keep chart hidden
            selectedMonthIndex = null;
            if (trendChartCanvas) trendChartCanvas.style.display = 'none';
            if (trendEmptyMsg) trendEmptyMsg.style.display = 'none';
            trendBackBtn.style.display = 'none';
            if (trendDropdownMsg) trendDropdownMsg.textContent = 'Select month to see flow';
        } else {
            // Find index and show chart for that month
            const idx = lastMonthOptions.indexOf(val);
            if (idx !== -1) {
                selectedMonthIndex = idx;
                trendBackBtn.style.display = 'inline-block';
                trendMonthSelect.style.display = 'none';
                if (trendDropdownMsg) trendDropdownMsg.textContent = '';
                showSingleMonthBarChart(idx);
            }
        }
    }

    // Handle back button
    function handleBackBtn() {
        trendMonthSelect.value = '';
        selectedMonthIndex = null;
        trendBackBtn.style.display = 'none';
        trendMonthSelect.style.display = 'inline-block';
        if (trendDropdownMsg) trendDropdownMsg.textContent = 'Select month to see flow';
        if (trendChartCanvas) trendChartCanvas.style.display = 'none';
        if (trendEmptyMsg) trendEmptyMsg.style.display = 'none';
        if (trendChartInstance) {
            trendChartInstance.destroy();
            trendChartInstance = null;
        }
    }

    // Open modal: show only dropdown
    if (openTrendModalBtn && trendModal) {
        openTrendModalBtn.addEventListener('click', function() {
            trendModal.hidden = false;
            trendModal.style.display = 'flex';
            populateMonthDropdown();
        });
    }
    // Close modal
    const closeTrendModal = document.getElementById('closeTrendModal');
    if (closeTrendModal && trendModal) {
        closeTrendModal.addEventListener('click', function() {
            trendModal.hidden = true;
            trendModal.style.display = 'none';
            handleBackBtn();
        });
    }
    // Overlay click closes modal
    if (trendModal) {
        trendModal.addEventListener('click', function(e) {
            if (e.target === trendModal) {
                trendModal.hidden = true;
                trendModal.style.display = 'none';
                handleBackBtn();
            }
        });
    }
    // Wire up events
    if (trendMonthSelect) {
        trendMonthSelect.addEventListener('change', handleMonthSelectChange);
    }
    if (trendBackBtn) {
        trendBackBtn.addEventListener('click', handleBackBtn);
    }
    // On DOMContentLoaded, ensure dropdown is ready
    document.addEventListener('DOMContentLoaded', function() {
        populateMonthDropdown();
    });
})();

// --- Chart Update Utility ---
function updateAllCharts() {
    // Re-render the trend chart if available
    if (typeof renderTrendChart === 'function') {
        renderTrendChart();
    }
    // Add other chart updates here if needed in the future
    // console.log("Charts updated (placeholder)");
}

// Edit modal close on overlay click
const editModal = document.getElementById('editModal');
if (editModal) {
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeModal();
        }
    });
}
