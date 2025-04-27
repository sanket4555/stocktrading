// Require authentication for this page
document.addEventListener('DOMContentLoaded', function() {
    const token = requireAuth();
    
    // Load user info
    loadUserInfo();
    
    // Load stocks data
    loadStocks(token);
    
    // Handle search
    setupSearch();
    
    // Setup refresh button
    setupRefreshButton(token);
    
    // Setup trade modal
    setupTradeModal(token);
    
    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Check for search parameter in URL
    checkForSearchParam(token);
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

// Load stocks data
async function loadStocks(token) {
    try {
        const response = await fetch(`${API_URL}/stocks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load stocks');
        }
        
        const stocks = await response.json();
        
        // Update stocks table
        updateStocksTable(stocks, token);
        
    } catch (error) {
        console.error('Error loading stocks:', error);
        document.getElementById('stocks-table-body').innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Failed to load stocks data</td>
            </tr>
        `;
    }
}

// Update stocks table
function updateStocksTable(stocks, token) {
    const tableBody = document.getElementById('stocks-table-body');
    if (!tableBody) return;
    
    if (stocks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No stocks found</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    stocks.forEach(stock => {
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const changeSign = stock.change >= 0 ? '+' : '';
        
        html += `
            <tr>
                <td>${stock.symbol}</td>
                <td>${stock.companyName}</td>
                <td class="stock-price">$${stock.price.toFixed(2)}</td>
                <td class="stock-change ${changeClass}">${changeSign}$${Math.abs(stock.change).toFixed(2)}</td>
                <td class="stock-change ${changeClass}">${changeSign}${stock.changePercent.toFixed(2)}%</td>
                <td>
                    <button class="btn btn-primary action-btn trade-btn" data-id="${stock._id}" data-symbol="${stock.symbol}" data-company="${stock.companyName}" data-price="${stock.price}">
                        Trade
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to trade buttons
    const tradeButtons = document.querySelectorAll('.trade-btn');
    tradeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const stockId = this.getAttribute('data-id');
            const symbol = this.getAttribute('data-symbol');
            const company = this.getAttribute('data-company');
            const price = this.getAttribute('data-price');
            
            openTradeModal(stockId, symbol, company, price, token);
        });
    });
}

// Search for stocks
async function searchStocks(query, token) {
    try {
        const response = await fetch(`${API_URL}/stocks/search/${query}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const stocks = await response.json();
        
        // Update stocks table with search results
        updateStocksTable(stocks, token);
        
    } catch (error) {
        console.error('Error searching stocks:', error);
        document.getElementById('stocks-table-body').innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Search failed. Please try again.</td>
            </tr>
        `;
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('stock-search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchInput && searchButton) {
        // Search on button click
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                const token = localStorage.getItem('token');
                searchStocks(query, token);
            }
        });
        
        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    const token = localStorage.getItem('token');
                    searchStocks(query, token);
                }
            }
        });
    }
}

// Setup refresh button
function setupRefreshButton(token) {
    const refreshButton = document.getElementById('refresh-stocks');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            loadStocks(token);
        });
    }
}

// Check for search parameter in URL
function checkForSearchParam(token) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery) {
        // Update search input
        const searchInput = document.getElementById('stock-search-input');
        if (searchInput) {
            searchInput.value = searchQuery;
        }
        
        // Perform search
        searchStocks(searchQuery, token);
    }
}

// Setup trade modal
function setupTradeModal(token) {
    const modal = document.getElementById('trade-modal');
    const closeModalButton = document.querySelector('.close-modal');
    const tradeForm = document.getElementById('trade-form');
    const tradeQuantity = document.getElementById('trade-quantity');
    const tradeType = document.getElementById('trade-type');
    const tradeTotal = document.getElementById('trade-total');
    
    // Close modal when clicking on X
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Update total when quantity or type changes
    if (tradeQuantity && tradeType) {
        const updateTotal = function() {
            const quantity = parseInt(tradeQuantity.value);
            const price = parseFloat(document.getElementById('trade-stock-price').textContent);
            const total = quantity * price;
            
            tradeTotal.textContent = `$${total.toFixed(2)}`;
        };
        
        tradeQuantity.addEventListener('input', updateTotal);
        tradeType.addEventListener('change', updateTotal);
    }
    
    // Handle form submission
    if (tradeForm) {
        tradeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const stockId = document.getElementById('trade-stock-id').value;
            const quantity = parseInt(document.getElementById('trade-quantity').value);
            const type = document.getElementById('trade-type').value;
            
            executeTrade(stockId, quantity, type, token);
        });
    }
}

// Open trade modal
function openTradeModal(stockId, symbol, company, price, token) {
    const modal = document.getElementById('trade-modal');
    const stockSymbolElement = document.getElementById('trade-stock-symbol');
    const companyNameElement = document.getElementById('trade-company-name');
    const stockPriceElement = document.getElementById('trade-stock-price');
    const stockIdElement = document.getElementById('trade-stock-id');
    const tradeQuantity = document.getElementById('trade-quantity');
    const tradeTotal = document.getElementById('trade-total');
    const tradeError = document.getElementById('trade-error');
    
    // Clear previous error
    if (tradeError) {
        tradeError.textContent = '';
    }
    
    // Reset quantity
    if (tradeQuantity) {
        tradeQuantity.value = 1;
    }
    
    // Set modal data
    if (stockSymbolElement) stockSymbolElement.textContent = symbol;
    if (companyNameElement) companyNameElement.textContent = company;
    if (stockPriceElement) stockPriceElement.textContent = parseFloat(price).toFixed(2);
    if (stockIdElement) stockIdElement.value = stockId;
    
    // Calculate and display total
    if (tradeTotal) {
        const total = parseFloat(price);
        tradeTotal.textContent = `$${total.toFixed(2)}`;
    }
    
    // Check portfolio to determine if sell option should be enabled
    checkPortfolioForStock(stockId, token);
    
    // Show modal
    if (modal) {
        modal.style.display = 'block';
    }
}

// Check if user owns the stock for sell option
async function checkPortfolioForStock(stockId, token) {
    try {
        const response = await fetch(`${API_URL}/portfolio`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load portfolio');
        }
        
        const portfolio = await response.json();
        
        // Find stock in portfolio
        const stockInPortfolio = portfolio.stocks.find(s => s.stock._id === stockId);
        
        // Enable/disable sell option
        const tradeType = document.getElementById('trade-type');
        const sellOption = tradeType.querySelector('option[value="sell"]');
        
        if (sellOption) {
            if (stockInPortfolio) {
                sellOption.disabled = false;
            } else {
                sellOption.disabled = true;
                // Make sure buy is selected
                tradeType.value = 'buy';
            }
        }
        
    } catch (error) {
        console.error('Error checking portfolio:', error);
    }
}

// Execute a trade
async function executeTrade(stockId, quantity, type, token) {
    try {
        // Determine the API endpoint based on trade type
        const endpoint = type === 'buy' ? '/transactions/buy' : '/transactions/sell';
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                stockId,
                quantity
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Trade failed');
        }
        
        // Close modal
        const modal = document.getElementById('trade-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Update user balance
        const userData = JSON.parse(localStorage.getItem('user'));
        userData.balance = data.newBalance;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update displayed balance
        loadUserInfo();
        
        // Show success alert
        alert(`${type.toUpperCase()} order executed successfully!`);
        
    } catch (error) {
        console.error('Error executing trade:', error);
        
        // Show error message
        const tradeError = document.getElementById('trade-error');
        if (tradeError) {
            tradeError.textContent = error.message || 'Trade failed. Please try again.';
        }
    }
} 