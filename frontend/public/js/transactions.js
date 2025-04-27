// Require authentication for this page
document.addEventListener('DOMContentLoaded', function() {
    const token = requireAuth();
    
    // Load user info
    loadUserInfo();
    
    // Load transaction data
    loadTransactionData(token);
    
    // Setup refresh button
    setupRefreshButton(token);
    
    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Handle transaction search
    const searchInput = document.getElementById('transaction-search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', function() {
            filterTransactions(searchInput.value.trim());
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterTransactions(searchInput.value.trim());
            }
        });
    }
    
    // Handle transaction type filter
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            const searchQuery = searchInput ? searchInput.value.trim() : '';
            filterTransactions(searchQuery, this.value);
        });
    }
});

// Load transaction data
async function loadTransactionData(token) {
    try {
        // Show loading state
        document.getElementById('transactions-table-body').innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Loading transactions...</td>
            </tr>
        `;
        
        const response = await fetch(`${API_URL}/transactions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load transactions');
        }
        
        const transactionsData = await response.json();
        
        // Update transaction statistics
        updateTransactionStats(transactionsData);
        
        // Update transactions table
        updateTransactionsTable(transactionsData);
        
        // Update transaction charts if there are transactions
        if (transactionsData.transactions.length > 0) {
            updateTransactionCharts(transactionsData);
        }
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactions-table-body').innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Failed to load transaction data</td>
            </tr>
        `;
    }
}

// Update transaction statistics
function updateTransactionStats(transactionsData) {
    const totalTransactionsElement = document.getElementById('total-transactions');
    const buyOrdersElement = document.getElementById('buy-orders');
    const sellOrdersElement = document.getElementById('sell-orders');
    const totalVolumeElement = document.getElementById('total-volume');
    
    const transactions = transactionsData.transactions;
    
    if (totalTransactionsElement) {
        totalTransactionsElement.textContent = transactions.length;
    }
    
    if (buyOrdersElement) {
        const buyOrders = transactions.filter(t => t.type === 'buy').length;
        buyOrdersElement.textContent = buyOrders;
    }
    
    if (sellOrdersElement) {
        const sellOrders = transactions.filter(t => t.type === 'sell').length;
        sellOrdersElement.textContent = sellOrders;
    }
    
    if (totalVolumeElement) {
        const totalVolume = transactions.reduce((total, t) => total + t.quantity, 0);
        totalVolumeElement.textContent = totalVolume;
    }
}

// Update transactions table
function updateTransactionsTable(transactionsData) {
    const tableBody = document.getElementById('transactions-table-body');
    if (!tableBody) return;
    
    const transactions = transactionsData.transactions;
    
    if (transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No transactions found</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedTransactions.forEach(transaction => {
        const date = new Date(transaction.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const typeClass = transaction.type === 'buy' ? 'positive' : 'negative';
        const typePrefix = transaction.type === 'buy' ? '+' : '-';
        
        html += `
            <tr data-id="${transaction._id}" data-type="${transaction.type}" data-symbol="${transaction.stock.symbol}">
                <td>${formattedDate} ${formattedTime}</td>
                <td>${transaction.stock.symbol}</td>
                <td>${transaction.stock.companyName}</td>
                <td class="${typeClass}">${transaction.type.toUpperCase()}</td>
                <td class="${typeClass}">${typePrefix}${transaction.quantity}</td>
                <td>$${transaction.price.toFixed(2)}</td>
                <td>$${transaction.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to table rows for showing details
    const tableRows = tableBody.querySelectorAll('tr');
    tableRows.forEach(row => {
        row.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            if (transactionId) {
                showTransactionDetails(transactionId, transactionsData.transactions);
            }
        });
    });
}

// Filter transactions based on search query and type
function filterTransactions(query, type = 'all') {
    const tableRows = document.querySelectorAll('#transactions-table-body tr');
    
    tableRows.forEach(row => {
        // Check type filter first
        const rowType = row.getAttribute('data-type');
        const typeMatch = type === 'all' || !type || rowType === type;
        
        if (!typeMatch) {
            row.style.display = 'none';
            return;
        }
        
        // If no query, show the row (if it passes the type filter)
        if (!query) {
            row.style.display = '';
            return;
        }
        
        // Convert query to lowercase for case-insensitive matching
        const lowerQuery = query.toLowerCase();
        
        // Check for matches in symbol and company name
        const symbol = row.getAttribute('data-symbol')?.toLowerCase();
        const companyName = row.cells[2]?.textContent.toLowerCase();
        
        if (symbol?.includes(lowerQuery) || companyName?.includes(lowerQuery)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update displayed count of filtered transactions
    updateFilteredCount();
}

// Update the count of displayed transactions after filtering
function updateFilteredCount() {
    const visibleRows = document.querySelectorAll('#transactions-table-body tr:not([style*="display: none"])').length;
    const countElement = document.getElementById('filtered-count');
    
    if (countElement) {
        const totalRows = document.querySelectorAll('#transactions-table-body tr').length;
        
        if (visibleRows === totalRows) {
            countElement.textContent = `Showing all ${totalRows} transactions`;
        } else {
            countElement.textContent = `Showing ${visibleRows} of ${totalRows} transactions`;
        }
    }
}

// Setup refresh button
function setupRefreshButton(token) {
    const refreshButton = document.getElementById('refresh-transactions');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            loadTransactionData(token);
        });
    }
}

// Update transaction charts
function updateTransactionCharts(transactionsData) {
    // These are placeholder implementations for charts
    // In a real application, you would use a chart library like Chart.js
    
    const monthlyActivityChart = document.getElementById('monthly-activity-chart');
    const transactionTypesChart = document.getElementById('transaction-types-chart');
    
    if (monthlyActivityChart) {
        // Basic monthly activity chart
        updateMonthlyActivityChart(monthlyActivityChart, transactionsData.transactions);
    }
    
    if (transactionTypesChart) {
        // Basic transaction types pie chart
        updateTransactionTypesChart(transactionTypesChart, transactionsData.transactions);
    }
}

// Update monthly activity chart
function updateMonthlyActivityChart(chartElement, transactions) {
    // Get transactions from the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    
    // Get array of last 6 months in "MMM YYYY" format
    const months = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        months.unshift(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }
    
    // Count transactions per month, separated by type
    const monthlyData = months.map(month => {
        const [monthName, year] = month.split(' ');
        
        // Filter transactions for this month
        const monthlyTransactions = transactions.filter(t => {
            const date = new Date(t.timestamp);
            return date.toLocaleDateString('en-US', { month: 'short' }) === monthName &&
                   date.toLocaleDateString('en-US', { year: 'numeric' }) === year;
        });
        
        const buyCount = monthlyTransactions.filter(t => t.type === 'buy').length;
        const sellCount = monthlyTransactions.filter(t => t.type === 'sell').length;
        
        return {
            month,
            buyCount,
            sellCount,
            totalCount: buyCount + sellCount
        };
    });
    
    // Find the maximum count for scaling
    const maxCount = Math.max(...monthlyData.map(d => d.totalCount), 5);
    
    // Create a simple bar chart visualization
    let html = `
        <div class="chart-container">
            <div class="chart-y-axis">
                ${[...Array(6).keys()].map(i => `
                    <div class="y-tick">${Math.round(maxCount - (i * maxCount / 5))}</div>
                `).join('')}
            </div>
            <div class="chart-bars">
    `;
    
    monthlyData.forEach(data => {
        const buyHeight = maxCount > 0 ? (data.buyCount / maxCount * 100) : 0;
        const sellHeight = maxCount > 0 ? (data.sellCount / maxCount * 100) : 0;
        
        html += `
            <div class="month-group">
                <div class="bar-container">
                    <div class="bar buy-bar" style="height: ${buyHeight}%" title="Buy: ${data.buyCount}"></div>
                    <div class="bar sell-bar" style="height: ${sellHeight}%" title="Sell: ${data.sellCount}"></div>
                </div>
                <div class="x-label">${data.month.split(' ')[0]}</div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        <div class="chart-legend">
            <div class="legend-item">
                <span class="legend-color buy-color"></span>
                <span class="legend-label">Buy Orders</span>
            </div>
            <div class="legend-item">
                <span class="legend-color sell-color"></span>
                <span class="legend-label">Sell Orders</span>
            </div>
        </div>
    `;
    
    chartElement.innerHTML = html;
}

// Update transaction types chart
function updateTransactionTypesChart(chartElement, transactions) {
    // Count transaction types
    const buyCount = transactions.filter(t => t.type === 'buy').length;
    const sellCount = transactions.filter(t => t.type === 'sell').length;
    const total = buyCount + sellCount;
    
    // Calculate percentages
    const buyPercentage = total > 0 ? (buyCount / total * 100) : 0;
    const sellPercentage = total > 0 ? (sellCount / total * 100) : 0;
    
    // Create a simple pie chart
    const html = `
        <div class="pie-chart-container">
            <div class="pie-chart" style="--buy-percentage: ${buyPercentage}">
                <div class="slice buy-slice" title="Buy: ${buyCount} (${buyPercentage.toFixed(1)}%)"></div>
                <div class="slice sell-slice" title="Sell: ${sellCount} (${sellPercentage.toFixed(1)}%)"></div>
            </div>
        </div>
        <div class="chart-legend">
            <div class="legend-item">
                <span class="legend-color buy-color"></span>
                <span class="legend-label">Buy: ${buyCount} (${buyPercentage.toFixed(1)}%)</span>
            </div>
            <div class="legend-item">
                <span class="legend-color sell-color"></span>
                <span class="legend-label">Sell: ${sellCount} (${sellPercentage.toFixed(1)}%)</span>
            </div>
        </div>
    `;
    
    chartElement.innerHTML = html;
}

// Show transaction details
function showTransactionDetails(transactionId, transactions) {
    // Find the transaction with the given ID
    const transaction = transactions.find(t => t._id === transactionId);
    
    if (!transaction) {
        console.error('Transaction not found:', transactionId);
        return;
    }
    
    // Create a modal for displaying the details
    const modalHTML = `
        <div id="transaction-details-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Transaction Details</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="transaction-detail">
                        <span class="detail-label">Transaction ID:</span>
                        <span class="detail-value">${transaction._id}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Date & Time:</span>
                        <span class="detail-value">${new Date(transaction.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Stock Symbol:</span>
                        <span class="detail-value">${transaction.stock.symbol}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Company Name:</span>
                        <span class="detail-value">${transaction.stock.companyName}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Transaction Type:</span>
                        <span class="detail-value ${transaction.type === 'buy' ? 'positive' : 'negative'}">${transaction.type.toUpperCase()}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Quantity:</span>
                        <span class="detail-value">${transaction.quantity} shares</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Price per Share:</span>
                        <span class="detail-value">$${transaction.price.toFixed(2)}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Total Value:</span>
                        <span class="detail-value">$${transaction.total.toFixed(2)}</span>
                    </div>
                    ${transaction.balanceAfter !== undefined ? `
                    <div class="transaction-detail">
                        <span class="detail-label">Balance After Transaction:</span>
                        <span class="detail-value">$${transaction.balanceAfter.toFixed(2)}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-details-btn">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modal
    const existingModal = document.getElementById('transaction-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add the modal to the document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get the new modal and its close buttons
    const modal = document.getElementById('transaction-details-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const closeDetailsBtn = modal.querySelector('.close-details-btn');
    
    // Show the modal
    modal.style.display = 'block';
    
    // Close modal when clicking on X
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking the close button
    closeDetailsBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
} 