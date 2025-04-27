// Require authentication for this page
document.addEventListener('DOMContentLoaded', function() {
    const token = requireAuth();
    
    // Load user info
    loadUserInfo();
    
    // Initialize dashboard data
    initDashboard(token);
    
    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Handle stock search
    const searchInput = document.getElementById('stock-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `stocks.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
    
    // Initialize dashboard ticker
    initDashboardTicker();
});

// Load user info from localStorage
function loadUserInfo() {
    const userDataStr = localStorage.getItem('user');
    if (!userDataStr) return;
    
    const userData = JSON.parse(userDataStr);
    
    // Update user name in navbar and sidebar
    const userNameElement = document.getElementById('user-name');
    const sidebarUserNameElement = document.getElementById('sidebar-user-name');
    
    if (userNameElement) userNameElement.textContent = userData.name;
    if (sidebarUserNameElement) sidebarUserNameElement.textContent = userData.name;
    
    // Update user balance
    const userBalanceElement = document.getElementById('user-balance');
    if (userBalanceElement) userBalanceElement.textContent = userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Update user initials
    const userInitialsElement = document.getElementById('user-initials');
    if (userInitialsElement && userData.name) {
        const nameParts = userData.name.split(' ');
        const initials = nameParts.map(part => part[0]).join('').toUpperCase();
        userInitialsElement.textContent = initials;
    }
}

// Initialize dashboard data
async function initDashboard(token) {
    try {
        await Promise.all([
            loadPortfolioData(token),
            loadTransactionData(token)
        ]);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// Load portfolio data
async function loadPortfolioData(token) {
    try {
        const response = await fetch(`${API_URL}/portfolio`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load portfolio');
        }
        
        const portfolioData = await response.json();
        
        // Update portfolio stats
        updatePortfolioStats(portfolioData);
        
        // Update portfolio table
        updatePortfolioTable(portfolioData);
        
    } catch (error) {
        console.error('Error loading portfolio:', error);
        document.getElementById('portfolio-table-body').innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Failed to load portfolio data</td>
            </tr>
        `;
    }
}

// Update portfolio statistics
function updatePortfolioStats(portfolioData) {
    const portfolioValueElement = document.getElementById('portfolio-value');
    const profitLossElement = document.getElementById('profit-loss');
    const stocksOwnedElement = document.getElementById('stocks-owned');
    
    if (portfolioValueElement) {
        portfolioValueElement.textContent = portfolioData.totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    if (profitLossElement) {
        const formattedValue = portfolioData.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        profitLossElement.textContent = portfolioData.totalProfitLoss >= 0 ? formattedValue : `-${formattedValue}`;
        profitLossElement.parentElement.classList.add(portfolioData.totalProfitLoss >= 0 ? 'positive' : 'negative');
    }
    
    if (stocksOwnedElement) {
        stocksOwnedElement.textContent = portfolioData.stocks.length;
    }
}

// Update portfolio table
function updatePortfolioTable(portfolioData) {
    const tableBody = document.getElementById('portfolio-table-body');
    if (!tableBody) return;
    
    if (portfolioData.stocks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No stocks in portfolio</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    // Sort stocks by value (descending)
    const sortedStocks = [...portfolioData.stocks].sort((a, b) => b.currentValue - a.currentValue);
    
    // Take top 5 stocks
    const topStocks = sortedStocks.slice(0, 5);
    
    topStocks.forEach(stock => {
        const profitLossClass = stock.profitLoss >= 0 ? 'positive' : 'negative';
        
        html += `
            <tr>
                <td>${stock.symbol}</td>
                <td>${stock.stock.companyName}</td>
                <td>${stock.quantity}</td>
                <td>$${stock.averageBuyPrice.toFixed(2)}</td>
                <td>$${stock.stock.price.toFixed(2)}</td>
                <td>$${stock.currentValue.toFixed(2)}</td>
                <td class="${profitLossClass}">$${Math.abs(stock.profitLoss).toFixed(2)} (${stock.profitLossPercent.toFixed(2)}%)</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Load transaction data
async function loadTransactionData(token) {
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load transactions');
        }
        
        const transactions = await response.json();
        
        // Update transaction count
        const transactionsCountElement = document.getElementById('transactions-count');
        if (transactionsCountElement) {
            transactionsCountElement.textContent = transactions.length;
        }
        
        // Update transactions table
        updateTransactionsTable(transactions);
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactions-table-body').innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Failed to load transaction data</td>
            </tr>
        `;
    }
}

// Update transactions table
function updateTransactionsTable(transactions) {
    const tableBody = document.getElementById('transactions-table-body');
    if (!tableBody) return;
    
    if (transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No transactions found</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    // Sort transactions by date (most recent first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Take most recent 5 transactions
    const recentTransactions = sortedTransactions.slice(0, 5);
    
    recentTransactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString();
        const typeClass = transaction.type === 'buy' ? 'text-primary' : 'text-success';
        
        html += `
            <tr>
                <td>${date}</td>
                <td class="${typeClass}">${transaction.type.toUpperCase()}</td>
                <td>${transaction.symbol}</td>
                <td>${transaction.quantity}</td>
                <td>$${transaction.price.toFixed(2)}</td>
                <td>$${transaction.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Initialize dashboard ticker
function initDashboardTicker() {
    const tickerElement = document.getElementById('dashboard-ticker');
    if (!tickerElement) return;
    
    // This would normally be fetched from an API
    const sampleStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 175.25, change: 2.50, changePercent: 1.45 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', price: 330.12, change: 0.75, changePercent: 0.23 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 128.55, change: -1.55, changePercent: -1.19 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 132.15, change: 0.25, changePercent: 0.19 },
        { symbol: 'TSLA', name: 'Tesla, Inc.', price: 252.70, change: -5.40, changePercent: -2.09 },
        { symbol: 'META', name: 'Meta Platforms, Inc.', price: 298.67, change: 3.17, changePercent: 1.07 },
        { symbol: 'NFLX', name: 'Netflix, Inc.', price: 393.25, change: 3.15, changePercent: 0.81 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 445.20, change: 4.85, changePercent: 1.10 }
    ];
    
    // Create ticker items
    let tickerHTML = '';
    sampleStocks.forEach(stock => {
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const changeSign = stock.change >= 0 ? '+' : '';
        
        tickerHTML += `
            <div class="ticker-item">
                <span class="ticker-symbol">${stock.symbol}</span>
                <span class="ticker-price">$${stock.price.toFixed(2)}</span>
                <span class="ticker-change ${changeClass}">${changeSign}${stock.change.toFixed(2)} (${changeSign}${stock.changePercent.toFixed(2)}%)</span>
            </div>
        `;
    });
    
    // Add ticker items to the DOM
    tickerElement.innerHTML = tickerHTML;
    
    // Clone ticker items for continuous scrolling
    tickerElement.innerHTML += tickerHTML;
} 