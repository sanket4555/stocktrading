// Function to load user info from localStorage
function loadUserInfo() {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) return;
    
    // Update username in navbar and sidebar
    const userNameElements = document.querySelectorAll('#user-name, #sidebar-user-name');
    userNameElements.forEach(element => {
        if (element) element.textContent = userData.name;
    });
    
    // Update user balance
    const userBalanceElement = document.getElementById('user-balance');
    if (userBalanceElement && userData.balance !== undefined) {
        userBalanceElement.textContent = userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    // Update user initials
    const userInitialsElement = document.getElementById('user-initials');
    if (userInitialsElement && userData.name) {
        const initials = userData.name.split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase();
        userInitialsElement.textContent = initials;
    }
}

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
    const typeFilter = document.getElementById('transaction-filter');
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
                <td colspan="8" class="text-center">Loading transactions...</td>
            </tr>
        `;
        
        // Clear statistics
        document.getElementById('total-transactions').textContent = '0';
        document.getElementById('buy-transactions').textContent = '0';
        document.getElementById('sell-transactions').textContent = '0';
        document.getElementById('total-volume').textContent = '0.00';
        
        // Fetch transactions from API
        const response = await fetch(`${API_URL}/transactions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load transactions');
        }
        
        // Parse response
        const transactions = await response.json();
        console.log('Transactions data:', transactions);
        
        if (!transactions || transactions.length === 0) {
            // Handle empty transactions
            document.getElementById('transactions-table-body').innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No transactions found</td>
                </tr>
            `;
            
            // Show placeholder charts
            document.getElementById('monthly-chart').innerHTML = `
                <div class="chart-placeholder-text">
                    <i class="fas fa-chart-bar"></i>
                    <p>Chart will appear when you have transaction history</p>
                </div>
            `;
            
            document.getElementById('types-chart').innerHTML = `
                <div class="chart-placeholder-text">
                    <i class="fas fa-chart-pie"></i>
                    <p>Chart will appear when you have transaction history</p>
                </div>
            `;
            return;
        }
        
        // Update statistics
        const buyTransactions = transactions.filter(t => t.type === 'buy');
        const sellTransactions = transactions.filter(t => t.type === 'sell');
        const totalVolume = transactions.reduce((sum, t) => sum + t.total, 0);
        
        document.getElementById('total-transactions').textContent = transactions.length;
        document.getElementById('buy-transactions').textContent = buyTransactions.length;
        document.getElementById('sell-transactions').textContent = sellTransactions.length;
        document.getElementById('total-volume').textContent = totalVolume.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Update table
        renderTransactionsTable(transactions);
        
        // Update charts
        renderMonthlyChart(transactions);
        renderTypesChart(transactions);
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactions-table-body').innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Failed to load transaction data: ${error.message}</td>
            </tr>
        `;
    }
}

// Render transactions table
function renderTransactionsTable(transactions) {
    const tableBody = document.getElementById('transactions-table-body');
    if (!tableBody) return;
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    
    sortedTransactions.forEach(transaction => {
        // Format the date
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Set class based on transaction type
        const typeClass = transaction.type === 'buy' ? 'positive' : 'negative';
        
        // Create table row
        html += `
            <tr data-id="${transaction._id}" data-type="${transaction.type}" data-symbol="${transaction.symbol}">
                <td>${formattedDate} ${formattedTime}</td>
                <td class="${typeClass}">${transaction.type.toUpperCase()}</td>
                <td>${transaction.symbol}</td>
                <td>${transaction.stock && transaction.stock.companyName ? transaction.stock.companyName : 'Unknown'}</td>
                <td>${transaction.quantity}</td>
                <td>$${parseFloat(transaction.price).toFixed(2)}</td>
                <td>$${parseFloat(transaction.total).toFixed(2)}</td>
                <td><span class="status-badge complete">Complete</span></td>
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
                showTransactionDetails(transactionId, transactions);
            }
        });
    });
    
    // Initialize pagination if needed
    updatePagination(1, Math.ceil(transactions.length / 10));
}

// Update pagination controls
function updatePagination(currentPage, totalPages) {
    const currentPageElement = document.getElementById('current-page');
    const totalPagesElement = document.getElementById('total-pages');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    if (currentPageElement) currentPageElement.textContent = currentPage;
    if (totalPagesElement) totalPagesElement.textContent = totalPages;
    
    if (prevButton) prevButton.disabled = currentPage <= 1;
    if (nextButton) nextButton.disabled = currentPage >= totalPages;
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
        
        // Check if any cell content matches the query
        const symbol = row.getAttribute('data-symbol')?.toLowerCase();
        const date = row.cells[0]?.textContent.toLowerCase();
        const company = row.cells[3]?.textContent.toLowerCase(); // Updated index to match new table structure
        
        if (
            symbol?.includes(lowerQuery) ||
            date?.includes(lowerQuery) ||
            company?.includes(lowerQuery)
        ) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update the count of displayed transactions
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

// Render monthly activity chart
function renderMonthlyChart(transactions) {
    const chartElement = document.getElementById('monthly-chart');
    if (!chartElement) return;
    
    // Get transactions from the last 6 months
    const now = new Date();
    
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
            const date = new Date(t.date);
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
    
    // Check if there is any data to display
    const hasData = monthlyData.some(m => m.totalCount > 0);
    
    if (!hasData) {
        chartElement.innerHTML = `
            <div class="chart-placeholder-text">
                <i class="fas fa-chart-bar"></i>
                <p>No transaction data available for the last 6 months</p>
            </div>
        `;
        return;
    }
    
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

// Render transaction types chart
function renderTypesChart(transactions) {
    const chartElement = document.getElementById('types-chart');
    if (!chartElement) return;
    
    // Count transaction types
    const buyCount = transactions.filter(t => t.type === 'buy').length;
    const sellCount = transactions.filter(t => t.type === 'sell').length;
    const total = buyCount + sellCount;
    
    if (total === 0) {
        chartElement.innerHTML = `
            <div class="chart-placeholder-text">
                <i class="fas fa-chart-pie"></i>
                <p>No transaction data available</p>
            </div>
        `;
        return;
    }
    
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
            const date = new Date(t.date);
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
                        <span class="detail-value">${new Date(transaction.date).toLocaleString()}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Stock Symbol:</span>
                        <span class="detail-value">${transaction.symbol}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Company Name:</span>
                        <span class="detail-value">${transaction.stock && transaction.stock.companyName ? transaction.stock.companyName : 'Unknown'}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Transaction Type:</span>
                        <span class="detail-value ${transaction.type === 'buy' ? 'positive' : 'negative'}">${transaction.type.toUpperCase()}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Quantity:</span>
                        <span class="detail-value">${transaction.quantity}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Price per Share:</span>
                        <span class="detail-value">$${parseFloat(transaction.price).toFixed(2)}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Total Amount:</span>
                        <span class="detail-value ${transaction.type === 'buy' ? 'negative' : 'positive'}">$${parseFloat(transaction.total).toFixed(2)}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value"><span class="status-badge complete">Complete</span></span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing modals
    const existingModal = document.getElementById('transaction-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to the DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal elements
    const modal = document.getElementById('transaction-details-modal');
    const closeModalBtn = modal.querySelector('.close-modal');
    const closeModalBtnFooter = modal.querySelector('.close-modal-btn');
    
    // Show modal
    modal.style.display = 'block';
    
    // Close modal when clicking X button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            modal.remove();
        });
    }
    
    // Close modal when clicking close button in footer
    if (closeModalBtnFooter) {
        closeModalBtnFooter.addEventListener('click', function() {
            modal.remove();
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
} 