document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    initApp();
});

// Global variables
let transactions = [];
let chart = null;
let calculatorValue = '0';
let calculatorOperator = null;
let calculatorPreviousValue = null;
let calculatorWaitingForOperand = false;

function initApp() {
    // Set current date
    setCurrentDate();
    
    // Load saved transactions
    loadTransactions();
    
    // Update UI summaries
    updateSummaryUI();
    
    // Initialize Chart
    initializeChart();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize theme
    initializeTheme();
}

function setCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDate = new Date().toLocaleDateString(undefined, options);
    dateElement.textContent = currentDate;
    
    // Set default date for transaction form to today
    document.getElementById('transactionDate').valueAsDate = new Date();
}

function loadTransactions() {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
        renderTransactions();
    }
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function setupEventListeners() {
    // Transaction form submission
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    
    // Transaction type change - update category options
    document.getElementById('transactionType').addEventListener('change', updateCategoryOptions);
    document.getElementById('editTransactionType').addEventListener('change', updateEditCategoryOptions);
    
    // Cancel button
    document.getElementById('cancelTransaction').addEventListener('click', resetTransactionForm);
    
    // Theme toggle
    document.getElementById('themeToggleIcon').parentElement.addEventListener('click', toggleTheme);
    
    // Search and filters
    document.getElementById('searchTransactions').addEventListener('input', filterTransactions);
    document.getElementById('categoryFilter').addEventListener('change', filterTransactions);
    document.getElementById('typeFilter').addEventListener('change', filterTransactions);
    
    // Modal close button
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    
    // Edit transaction form
    document.getElementById('editTransactionForm').addEventListener('submit', handleEditTransactionSubmit);
    
    // Delete transaction
    document.getElementById('deleteTransaction').addEventListener('click', handleDeleteTransaction);
    
    // Export & Import
    document.getElementById('exportBtn').addEventListener('click', exportTransactions);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', importTransactions);
    
    // Calculator
    setupCalculator();
    
    // User manual toggle
    document.getElementById('toggleManual').addEventListener('click', toggleManual);
}

function toggleManual() {
    const manualContent = document.getElementById('manualContent');
    const toggleIcon = document.getElementById('toggleManual').querySelector('i');
    if (manualContent.style.display === 'none') {
        manualContent.style.display = 'block';
        toggleIcon.classList.remove('fa-book');
        toggleIcon.classList.add('fa-book-open');
    } else {
        manualContent.style.display = 'none';
        toggleIcon.classList.remove('fa-book-open');
        toggleIcon.classList.add('fa-book');
    }
}

function setupCalculator() {
    const display = document.getElementById('calculatorDisplay');
    const buttons = document.querySelectorAll('.calc-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('number')) {
                inputNumber(button.textContent);
            } else if (button.classList.contains('operator')) {
                inputOperator(button.textContent);
            } else if (button.classList.contains('equals')) {
                calculate();
            } else if (button.classList.contains('clear')) {
                clearCalculator();
            }
            updateCalculatorDisplay();
        });
    });
    
    function inputNumber(num) {
        if (calculatorWaitingForOperand) {
            calculatorValue = num;
            calculatorWaitingForOperand = false;
        } else {
            calculatorValue = calculatorValue === '0' ? num : calculatorValue + num;
        }
    }
    
    function inputOperator(op) {
        if (op === '←') {
            calculatorValue = calculatorValue.toString().slice(0, -1);
            if (calculatorValue === '') calculatorValue = '0';
            return;
        }
        
        const inputValue = parseFloat(calculatorValue);
        
        if (calculatorPreviousValue === null) {
            calculatorPreviousValue = inputValue;
        } else if (calculatorOperator) {
            const result = calculate();
            calculatorPreviousValue = result;
            calculatorValue = String(result);
        }
        
        calculatorWaitingForOperand = true;
        calculatorOperator = op;
    }
    
    function calculate() {
        const inputValue = parseFloat(calculatorValue);
        let result;
        
        if (calculatorPreviousValue === null || calculatorOperator === null) {
            return inputValue;
        }
        
        switch (calculatorOperator) {
            case '+':
                result = calculatorPreviousValue + inputValue;
                break;
            case '-':
                result = calculatorPreviousValue - inputValue;
                break;
            case '×':
                result = calculatorPreviousValue * inputValue;
                break;
            case '÷':
                result = calculatorPreviousValue / inputValue;
                break;
            case '%':
                result = calculatorPreviousValue % inputValue;
                break;
            default:
                return inputValue;
        }
        
        // Round to 2 decimal places to avoid floating point issues
        result = Math.round((result + Number.EPSILON) * 100) / 100;
        
        calculatorValue = String(result);
        calculatorOperator = null;
        calculatorPreviousValue = null;
        calculatorWaitingForOperand = true;
        return result;
    }
    
    function clearCalculator() {
        calculatorValue = '0';
        calculatorOperator = null;
        calculatorPreviousValue = null;
        calculatorWaitingForOperand = false;
    }
    
    function updateCalculatorDisplay() {
        display.textContent = calculatorValue;
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggleIcon').classList.remove('fa-moon');
        document.getElementById('themeToggleIcon').classList.add('fa-sun');
    } else {
        document.body.removeAttribute('data-theme');
        document.getElementById('themeToggleIcon').classList.remove('fa-sun');
        document.getElementById('themeToggleIcon').classList.add('fa-moon');
    }
}

function toggleTheme() {
    if (document.body.getAttribute('data-theme') === 'dark') {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        document.getElementById('themeToggleIcon').classList.remove('fa-sun');
        document.getElementById('themeToggleIcon').classList.add('fa-moon');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('themeToggleIcon').classList.remove('fa-moon');
        document.getElementById('themeToggleIcon').classList.add('fa-sun');
    }
    
    // Update chart with new theme colors if it exists
    if (chart) {
        updateChart();
    }
}

function updateCategoryOptions() {
    const transactionType = document.getElementById('transactionType').value;
    const categorySelect = document.getElementById('transactionCategory');
    
    // Hide all options first
    Array.from(categorySelect.options).forEach(option => {
        const optionType = option.getAttribute('data-type');
        if (optionType && optionType !== transactionType) {
            option.style.display = 'none';
        } else {
            option.style.display = '';
        }
    });
    
    // Select first visible option
    for (let i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].style.display !== 'none') {
            categorySelect.selectedIndex = i;
            break;
        }
    }
}

function updateEditCategoryOptions() {
    const transactionType = document.getElementById('editTransactionType').value;
    const categorySelect = document.getElementById('editTransactionCategory');
    
    // Hide all options first
    Array.from(categorySelect.options).forEach(option => {
        const optionType = option.getAttribute('data-type');
        if (optionType && optionType !== transactionType) {
            option.style.display = 'none';
        } else {
            option.style.display = '';
        }
    });
    
    // Select first visible option
    for (let i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].style.display !== 'none') {
            categorySelect.selectedIndex = i;
            break;
        }
    }
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const date = document.getElementById('transactionDate').value;
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const description = document.getElementById('transactionDescription').value;
    
    // Validate input
    if (!date || !type || !amount || isNaN(amount) || amount <= 0 || !category || !description) {
        showNotification('Please fill in all fields with valid values.', 'error');
        return;
    }
    
    // Create transaction object
    const transaction = {
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
    
    // Save to localStorage
    saveTransactions();
    
    // Update UI with real-time feedback
    renderTransactions();
    highlightNewTransaction(transaction.id);
    updateSummaryUI();
    updateChart();
    
    // Reset form
    resetTransactionForm();
    
    // Show success message
    showNotification('Transaction added successfully!', 'success');
}

function highlightNewTransaction(transactionId) {
    const transactionElement = document.querySelector(`.transaction-item[data-id="${transactionId}"]`);
    if (transactionElement) {
        transactionElement.classList.add('highlight');
        setTimeout(() => {
            transactionElement.classList.remove('highlight');
        }, 2000);
    }
}

function resetTransactionForm() {
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionDate').valueAsDate = new Date();
    updateCategoryOptions();
}

function renderTransactions() {
    const transactionsList = document.getElementById('transactionsList');
    const emptyState = document.querySelector('.empty-state');
    
    // Check if there are transactions
    if (transactions.length === 0) {
        emptyState.style.display = 'flex';
        transactionsList.innerHTML = '';
        transactionsList.appendChild(emptyState);
        return;
    }
    
    // Hide empty state and render transactions
    emptyState.style.display = 'none';
    
    // Get current filter values
    const searchTerm = document.getElementById('searchTransactions').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    // Filter transactions
    let filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) || 
                              transaction.category.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
        
        return matchesSearch && matchesCategory && matchesType;
    });
    
    // Create HTML for transactions
    let transactionsHTML = '';
    
    filteredTransactions.forEach(transaction => {
        const formattedDate = new Date(transaction.date).toLocaleDateString();
        const amountClass = transaction.type === 'income' ? 'income-amount' : 'expense-amount';
        const iconClass = transaction.type === 'income' ? 'income-icon' : 'expense-icon';
        const indicatorClass = transaction.type === 'income' ? 'income-indicator' : 'expense-indicator';
        const iconType = getCategoryIcon(transaction.category);
        const formattedAmount = formatCurrency(transaction.amount);
        
        transactionsHTML += `
            <div class="transaction-item fade-in" data-id="${transaction.id}" title="Click to edit or delete">
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
                    ${transaction.type === 'income' ? '+' : '-'}${formattedAmount}
                </div>
            </div>
        `;
    });
    
    // Update DOM
    transactionsList.innerHTML = transactionsHTML;
    
    // Add click event listeners to transaction items
    document.querySelectorAll('.transaction-item').forEach(item => {
        item.addEventListener('click', () => {
            const transactionId = item.getAttribute('data-id');
            openEditModal(transactionId);
        });
    });
}

function getCategoryIcon(category) {
    const icons = {
        'Salary': 'fa-money-bill-wave',
        'Freelance': 'fa-laptop-code',
        'Investment': 'fa-chart-line',
        'Gift': 'fa-gift',
        'Other Income': 'fa-coins',
        'Food': 'fa-utensils',
        'Transportation': 'fa-car',
        'Housing': 'fa-home',
        'Entertainment': 'fa-film',
        'Shopping': 'fa-shopping-bag',
        'Utilities': 'fa-plug',
        'Health': 'fa-heartbeat',
        'Education': 'fa-graduation-cap',
        'Travel': 'fa-plane',
        'Other Expense': 'fa-receipt'
    };
    
    return icons[category] || 'fa-receipt';
}

function formatCurrency(amount) {
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function updateSummaryUI() {
    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });
    
    const balance = totalIncome - totalExpense;
    
    // Update UI
    document.getElementById('totalIncome').textContent = `$${formatCurrency(totalIncome)}`;
    document.getElementById('totalExpense').textContent = `$${formatCurrency(totalExpense)}`;
    document.getElementById('balanceAmount').textContent = `$${formatCurrency(balance)}`;
    
    // Set balance color based on value
    if (balance < 0) {
        document.getElementById('balanceAmount').style.color = 'var(--expense-color)';
    } else {
        document.getElementById('balanceAmount').style.color = 'white';
    }
}

function initializeChart() {
    const ctx = document.getElementById('expenseChart');
    
    // If there are no expenses, don't initialize chart
    const hasExpenses = transactions.some(transaction => transaction.type === 'expense');
    
    if (!hasExpenses) {
        return;
    }
    
    // Get expense categories and amounts
    const expensesByCategory = {};
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            if (expensesByCategory[transaction.category]) {
                expensesByCategory[transaction.category] += transaction.amount;
            } else {
                expensesByCategory[transaction.category] = transaction.amount;
            }
        }
    });
    
    const categories = Object.keys(expensesByCategory);
    const amounts = Object.values(expensesByCategory);
    const backgroundColors = getChartColors(categories.length);
    
    // Create chart
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                        font: {
                            size: 11
                        },
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: $${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function updateChart() {
    // If chart doesn't exist and we have expenses, initialize it
    const hasExpenses = transactions.some(transaction => transaction.type === 'expense');
    
    if (!chart && hasExpenses) {
        initializeChart();
        return;
    }
    
    // If no expenses, destroy chart if it exists
    if (!hasExpenses && chart) {
        chart.destroy();
        chart = null;
        document.getElementById('expenseChart').innerHTML = '<div class="empty-chart-message">Add expenses to see distribution</div>';
        return;
    }
    
    // If chart exists and we have expenses, update it
    if (chart && hasExpenses) {
        // Get expense categories and amounts
        const expensesByCategory = {};
        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                if (expensesByCategory[transaction.category]) {
                    expensesByCategory[transaction.category] += transaction.amount;
                } else {
                    expensesByCategory[transaction.category] = transaction.amount;
                }
            }
        });
        
        const categories = Object.keys(expensesByCategory);
        const amounts = Object.values(expensesByCategory);
        const backgroundColors = getChartColors(categories.length);
        
        // Update chart data
        chart.data.labels = categories;
        chart.data.datasets[0].data = amounts;
        chart.data.datasets[0].backgroundColor = backgroundColors;
        
        // Update chart options for theme
        chart.options.plugins.legend.labels.color = getComputedStyle(document.body).getPropertyValue('--text-color');
        
        chart.update();
    }
}

function getChartColors(count) {
    const colors = getComputedStyle(document.documentElement).getPropertyValue('--chart-colors').split(',');
    const result = [];
    
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length].trim());
    }
    
    return result;
}

function filterTransactions() {
    renderTransactions();
}

function openEditModal(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) return;
    
    // Fill form fields
    document.getElementById('editTransactionId').value = transaction.id;
    document.getElementById('editTransactionDate').value = transaction.date;
    document.getElementById('editTransactionType').value = transaction.type;
    document.getElementById('editTransactionAmount').value = transaction.amount;
    document.getElementById('editTransactionDescription').value = transaction.description;
    
    // Update category options based on type
    updateEditCategoryOptions();
    
    // Set selected category
    const categorySelect = document.getElementById('editTransactionCategory');
    for (let i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].value === transaction.category) {
            categorySelect.selectedIndex = i;
            break;
        }
    }
    
    // Show modal with animation
    const modal = document.getElementById('editModal');
    modal.style.display = 'flex';
    modal.classList.add('animate__animated', 'animate__fadeIn');
    setTimeout(() => {
        modal.classList.remove('animate__animated', 'animate__fadeIn');
    }, 500);
}

function closeModal() {
    const modal = document.getElementById('editModal');
    modal.classList.add('animate__animated', 'animate__fadeOut');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('animate__animated', 'animate__fadeOut');
    }, 300);
}

function handleEditTransactionSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const id = document.getElementById('editTransactionId').value;
    const date = document.getElementById('editTransactionDate').value;
    const type = document.getElementById('editTransactionType').value;
    const amount = parseFloat(document.getElementById('editTransactionAmount').value);
    const category = document.getElementById('editTransactionCategory').value;
    const description = document.getElementById('editTransactionDescription').value;
    
    // Validate input
    if (!date || !type || !amount || isNaN(amount) || amount <= 0 || !category || !description) {
        showNotification('Please fill in all fields with valid values.', 'error');
        return;
    }
    
    // Find transaction index
    const index = transactions.findIndex(t => t.id === id);
    
    if (index !== -1) {
        // Update transaction
        transactions[index] = {
            ...transactions[index],
            date,
            type,
            amount,
            category,
            description,
            updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        saveTransactions();
        
        // Update UI
        renderTransactions();
        highlightNewTransaction(id); // Highlight updated transaction
        updateSummaryUI();
        updateChart();
        
        // Close modal
        closeModal();
        
        // Show success message
        showNotification('Transaction updated successfully!', 'success');
    }
}

function handleDeleteTransaction() {
    const id = document.getElementById('editTransactionId').value;
    
    // Find transaction index
    const index = transactions.findIndex(t => t.id === id);
    
    if (index !== -1) {
        // Mark transaction for animation
        const transactionElement = document.querySelector(`.transaction-item[data-id="${id}"]`);
        if (transactionElement) {
            transactionElement.classList.add('removing');
            
            // Remove after animation
            setTimeout(() => {
                // Remove transaction
                transactions.splice(index, 1);
                
                // Save to localStorage
                saveTransactions();
                
                // Update UI
                renderTransactions();
                updateSummaryUI();
                updateChart();
                
                // Close modal
                closeModal();
                
                // Show success message
                showNotification('Transaction deleted successfully!', 'success');
            }, 300);
        } else {
            // If element not found, just remove
            transactions.splice(index, 1);
            saveTransactions();
            renderTransactions();
            updateSummaryUI();
            updateChart();
            closeModal();
            showNotification('Transaction deleted successfully!', 'success');
        }
    }
}

function exportTransactions() {
    if (transactions.length === 0) {
        showNotification('No transactions to export.', 'error');
        return;
    }
    
    // Create export data object with metadata
    const exportData = {
        appName: 'NeoFinance Expense Tracker',
        exportDate: new Date().toISOString(),
        version: '1.0',
        transactions: transactions
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Generate filename with date
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    a.href = url;
    a.download = `neofinance_transactions_${formattedDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Transactions exported successfully!', 'success');
}

function importTransactions(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.json')) {
        showNotification('Please select a valid JSON file.', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate imported data structure
            if (!importedData.transactions || !Array.isArray(importedData.transactions)) {
                showNotification('Invalid data format.', 'error');
                return;
            }
            
            // Validate transaction objects
            const validTransactions = importedData.transactions.filter(t => 
                t.id && t.date && t.type && t.amount && t.category && t.description
            );
            
            if (validTransactions.length === 0) {
                showNotification('No valid transactions found in the file.', 'error');
                return;
            }
            
            // Merge with existing transactions (avoid duplicates)
            const existingIds = new Set(transactions.map(t => t.id));
            const newTransactions = validTransactions.filter(t => !existingIds.has(t.id));
            
            transactions = [...newTransactions, ...transactions];
            saveTransactions();
            renderTransactions();
            updateSummaryUI();
            updateChart();
            
            showNotification(`Successfully imported ${newTransactions.length} transactions!`, 'success');
            
            // Reset file input
            document.getElementById('importFile').value = '';
        } catch (error) {
            showNotification('Error reading file. Please ensure it\'s a valid JSON file.', 'error');
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style notification
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '8px',
        color: '#fff',
        backgroundColor: type === 'success' ? 'var(--income-color)' : 'var(--expense-color)',
        boxShadow: 'var(--shadow)',
        zIndex: '1000',
        opacity: '0',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        transform: 'translateY(20px)'
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

// Prevent modal from closing when clicking inside content
document.querySelector('.modal-content').addEventListener('click', function(e) {
    e.stopPropagation();
});

// Close modal when clicking outside
document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Update transaction amount field to accept calculator result
document.querySelector('.calc-btn.equals').addEventListener('click', function() {
    const calculatorResult = parseFloat(calculatorValue);
    if (!isNaN(calculatorResult) && calculatorResult > 0) {
        document.getElementById('transactionAmount').value = calculatorResult.toFixed(2);
    }
});

// Handle window resize for chart responsiveness
window.addEventListener('resize', function() {
    if (chart) {
        chart.resize();
    }
});

// Initialize category options on load
updateCategoryOptions();

// Handle form input validation in real-time
document.querySelectorAll('#transactionForm input, #transactionForm select').forEach(input => {
    input.addEventListener('input', function() {
        if (this.type === 'number') {
            if (this.value <= 0) {
                this.classList.add('invalid');
            } else {
                this.classList.remove('invalid');
            }
        } else if (this.required && !this.value) {
            this.classList.add('invalid');
        } else {
            this.classList.remove('invalid');
        }
    });
});

// Add CSS for invalid inputs and highlight animation
const style = document.createElement('style');
style.textContent = `
    .invalid {
        border-color: var(--expense-color) !important;
        box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.2) !important;
    }
    
    .notification {
        min-width: 200px;
        max-width: 400px;
    }
    
    .highlight {
        background-color: rgba(62, 207, 142, 0.1) !important;
        border: 2px solid var(--income-color) !important;
        animation: highlightPulse 0.5s ease-in-out 2;
    }
    
    @keyframes highlightPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    .manual-section {
        margin-top: 20px;
        padding: 20px;
        background: var(--card-background);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
    }
    
    .manual-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .manual-content {
        margin-top: 10px;
        font-size: 14px;
        color: var(--text-color);
    }
    
    .manual-content h4 {
        margin-bottom: 10px;
    }
    
    .manual-content details {
        margin: 10px 0;
        padding: 10px;
        background: var(--background);
        border-radius: 4px;
    }
    
    .manual-content summary {
        cursor: pointer;
        font-weight: bold;
    }
    
    .manual-content p, .manual-content ul {
        margin: 10px 0;
    }
    
    .manual-content ul {
        padding-left: 20px;
    }
`;
document.head.appendChild(style);

// Handle transaction sorting (optional feature)
function sortTransactions(criteria = 'date') {
    transactions.sort((a, b) => {
        switch (criteria) {
            case 'date':
                return new Date(b.date) - new Date(a.date);
            case 'amount':
                return b.amount - a.amount;
            case 'category':
                return a.category.localeCompare(b.category);
            default:
                return 0;
        }
    });
    renderTransactions();
}

// Add sort functionality to transaction header
document.querySelector('.transactions-header h2').addEventListener('click', function() {
    sortTransactions('date');
});

// Handle data backup to cloud (mock implementation)
function backupToCloud() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // Mock cloud backup
                console.log('Backing up to cloud:', transactions.length, 'transactions');
                resolve(true);
            } catch (error) {
                reject(error);
            }
        }, 1000);
    });
}

// Auto-save to cloud every 5 minutes
setInterval(() => {
    if (transactions.length > 0) {
        backupToCloud()
            .then(() => {
                console.log('Cloud backup successful');
            })
            .catch(error => {
                console.error('Cloud backup failed:', error);
            });
    }
}, 300000);

// Handle currency formatting based on user locale
function getUserLocale() {
    return navigator.language || 'en-US';
}

function formatCurrencyWithLocale(amount) {
    return new Intl.NumberFormat(getUserLocale(), {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Update existing formatCurrency to use locale
function formatCurrency(amount) {
    return formatCurrencyWithLocale(amount).replace(/USD|\$/g, '').trim();
}

// Add animation for balance updates
function animateBalanceUpdate(elementId, newValue) {
    const element = document.getElementById(elementId);
    element.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
        element.textContent = `$${formatCurrency(newValue)}`;
        element.classList.remove('animate__animated', 'animate__pulse');
    }, 300);
}

// Update updateSummaryUI to use animations
function updateSummaryUI() {
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });
    
    const balance = totalIncome - totalExpense;
    
    // Animate updates
    animateBalanceUpdate('totalIncome', totalIncome);
    animateBalanceUpdate('totalExpense', totalExpense);
    animateBalanceUpdate('balanceAmount', balance);
    
    // Update balance color
    const balanceElement = document.getElementById('balanceAmount');
    balanceElement.style.color = balance < 0 ? 'var(--expense-color)' : 'white';
}