// Require authentication for this page
document.addEventListener('DOMContentLoaded', function() {
    const token = requireAuth();
    
    // Load user info
    loadUserInfo();
    
    // Load portfolio data
    loadPortfolioData(token);
    
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
    
    // Handle stock search in portfolio
    const searchInput = document.getElementById('stock-search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', function() {
            filterPortfolioItems(searchInput.value.trim());
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterPortfolioItems(searchInput.value.trim());
            }
        });
    }
});

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
        
        // Update portfolio statistics
        updatePortfolioStats(portfolioData);
        
        // Update portfolio table
        updatePortfolioTable(portfolioData);
        
        // Update portfolio charts if there are stocks
        if (portfolioData.stocks.length > 0) {
            updatePortfolioCharts(portfolioData);
        }
        
    } catch (error) {
        console.error('Error loading portfolio:', error);
        document.getElementById('portfolio-table-body').innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Failed to load portfolio data</td>
            </tr>
        `;
    }
}

// Update portfolio statistics
function updatePortfolioStats(portfolioData) {
    const totalValueElement = document.getElementById('portfolio-total-value');
    const profitLossElement = document.getElementById('portfolio-profit-loss');
    const stocksCountElement = document.getElementById('portfolio-stocks-count');
    const diversificationElement = document.getElementById('portfolio-diversification');
    
    if (totalValueElement) {
        totalValueElement.textContent = portfolioData.totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    if (profitLossElement) {
        const profitLoss = portfolioData.totalProfitLoss;
        const formattedValue = Math.abs(profitLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        profitLossElement.textContent = profitLoss >= 0 ? formattedValue : `-${formattedValue}`;
        profitLossElement.parentElement.classList.remove('positive', 'negative');
        profitLossElement.parentElement.classList.add(profitLoss >= 0 ? 'positive' : 'negative');
    }
    
    if (stocksCountElement) {
        stocksCountElement.textContent = portfolioData.stocks.length;
    }
    
    if (diversificationElement) {
        // Calculate diversification percentage (simple calculation based on number of stocks)
        // More sophisticated calculations could be implemented
        const maxDiversification = 20; // Assuming 20 different stocks is fully diversified
        const diversificationPercentage = Math.min(100, Math.round((portfolioData.stocks.length / maxDiversification) * 100));
        diversificationElement.textContent = `${diversificationPercentage}%`;
    }
}

// Update portfolio table
function updatePortfolioTable(portfolioData) {
    const tableBody = document.getElementById('portfolio-table-body');
    if (!tableBody) return;
    
    if (portfolioData.stocks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No stocks in portfolio</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    // Sort stocks by value (descending)
    const sortedStocks = [...portfolioData.stocks].sort((a, b) => b.currentValue - a.currentValue);
    
    sortedStocks.forEach(stock => {
        const profitLoss = stock.profitLoss;
        const profitLossClass = profitLoss >= 0 ? 'positive' : 'negative';
        const profitLossPrefix = profitLoss >= 0 ? '+' : '-';
        
        html += `
            <tr>
                <td>${stock.symbol}</td>
                <td>${stock.stock.companyName}</td>
                <td>${stock.quantity}</td>
                <td>$${stock.averageBuyPrice.toFixed(2)}</td>
                <td>$${stock.stock.price.toFixed(2)}</td>
                <td>$${stock.currentValue.toFixed(2)}</td>
                <td class="${profitLossClass}">${profitLossPrefix}$${Math.abs(profitLoss).toFixed(2)} (${stock.profitLossPercent.toFixed(2)}%)</td>
                <td>
                    <button class="btn btn-primary action-btn trade-btn" data-id="${stock.stock._id}" data-symbol="${stock.symbol}" data-company="${stock.stock.companyName}" data-price="${stock.stock.price}" data-quantity="${stock.quantity}">
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
            const quantity = this.getAttribute('data-quantity');
            
            openTradeModal(stockId, symbol, company, price, quantity);
        });
    });
}

// Filter portfolio items based on search query
function filterPortfolioItems(query) {
    const tableRows = document.querySelectorAll('#portfolio-table-body tr');
    
    if (!query) {
        // If query is empty, show all rows
        tableRows.forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    // Convert query to lowercase for case-insensitive matching
    const lowerQuery = query.toLowerCase();
    
    tableRows.forEach(row => {
        const symbol = row.cells[0]?.textContent.toLowerCase();
        const company = row.cells[1]?.textContent.toLowerCase();
        
        if (symbol?.includes(lowerQuery) || company?.includes(lowerQuery)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Setup refresh button
function setupRefreshButton(token) {
    const refreshButton = document.getElementById('refresh-portfolio');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            loadPortfolioData(token);
        });
    }
}

// Update portfolio charts
function updatePortfolioCharts(portfolioData) {
    // This is a placeholder for chart implementation
    // In a real application, you would use a library like Chart.js
    
    const allocationChart = document.getElementById('allocation-chart');
    const performanceChart = document.getElementById('performance-chart');
    
    if (allocationChart) {
        // Clear placeholder
        allocationChart.innerHTML = '';
        
        // Create a simple visualization
        const chartHTML = `
            <div class="simple-pie-chart">
                ${portfolioData.stocks.map((stock, index) => {
                    // Calculate percentage of total portfolio
                    const percentage = (stock.currentValue / portfolioData.totalCurrentValue) * 100;
                    // Generate a simple color based on index
                    const hue = (index * 137) % 360; // Golden ratio approximation for good color distribution
                    const color = `hsl(${hue}, 70%, 60%)`;
                    
                    return `
                        <div class="pie-segment" style="
                            --percentage: ${percentage};
                            --color: ${color};
                            --index: ${index};
                        " title="${stock.symbol}: ${percentage.toFixed(1)}%"></div>
                    `;
                }).join('')}
            </div>
            <div class="chart-legend">
                ${portfolioData.stocks.map((stock, index) => {
                    const percentage = (stock.currentValue / portfolioData.totalCurrentValue) * 100;
                    const hue = (index * 137) % 360;
                    const color = `hsl(${hue}, 70%, 60%)`;
                    
                    return `
                        <div class="legend-item">
                            <span class="legend-color" style="background-color: ${color}"></span>
                            <span class="legend-label">${stock.symbol}</span>
                            <span class="legend-value">${percentage.toFixed(1)}%</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        allocationChart.innerHTML = chartHTML;
    }
    
    if (performanceChart) {
        // Simple implementation for the performance chart
        performanceChart.innerHTML = `
            <div class="placeholder-chart-message">
                <p>Performance chart requires transaction history data over time.</p>
                <p>This would be implemented with a real chart library in a production environment.</p>
            </div>
        `;
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
function openTradeModal(stockId, symbol, company, price, sharesOwned) {
    const modal = document.getElementById('trade-modal');
    const stockSymbolElement = document.getElementById('trade-stock-symbol');
    const companyNameElement = document.getElementById('trade-company-name');
    const stockPriceElement = document.getElementById('trade-stock-price');
    const stockIdElement = document.getElementById('trade-stock-id');
    const sharesOwnedElement = document.getElementById('trade-shares-owned');
    const tradeQuantity = document.getElementById('trade-quantity');
    const tradeType = document.getElementById('trade-type');
    const tradeTotal = document.getElementById('trade-total');
    const tradeError = document.getElementById('trade-error');
    
    // Clear previous error
    if (tradeError) {
        tradeError.textContent = '';
    }
    
    // Set modal data
    if (stockSymbolElement) stockSymbolElement.textContent = symbol;
    if (companyNameElement) companyNameElement.textContent = company;
    if (stockPriceElement) stockPriceElement.textContent = parseFloat(price).toFixed(2);
    if (stockIdElement) stockIdElement.value = stockId;
    if (sharesOwnedElement) sharesOwnedElement.textContent = sharesOwned;
    
    // Update trade type options based on shares owned
    if (tradeType) {
        const sellOption = tradeType.querySelector('option[value="sell"]');
        
        if (parseInt(sharesOwned) > 0) {
            sellOption.disabled = false;
            // Make sell the default for portfolio page
            tradeType.value = 'sell';
        } else {
            sellOption.disabled = true;
            tradeType.value = 'buy';
        }
    }
    
    // Reset quantity
    if (tradeQuantity) {
        if (tradeType.value === 'sell') {
            // Default to selling all shares
            tradeQuantity.value = sharesOwned;
            tradeQuantity.max = sharesOwned;
        } else {
            tradeQuantity.value = 1;
            tradeQuantity.removeAttribute('max');
        }
    }
    
    // Calculate and display total
    if (tradeTotal) {
        const quantity = parseInt(tradeQuantity.value);
        const priceValue = parseFloat(price);
        const total = quantity * priceValue;
        tradeTotal.textContent = `$${total.toFixed(2)}`;
    }
    
    // Setup event listener for trade type change
    if (tradeType && tradeQuantity) {
        tradeType.addEventListener('change', function() {
            if (this.value === 'sell') {
                tradeQuantity.max = sharesOwned;
                tradeQuantity.value = Math.min(tradeQuantity.value, sharesOwned);
            } else {
                tradeQuantity.removeAttribute('max');
            }
            
            // Update total
            const quantity = parseInt(tradeQuantity.value);
            const priceValue = parseFloat(price);
            const total = quantity * priceValue;
            tradeTotal.textContent = `$${total.toFixed(2)}`;
        });
    }
    
    // Show modal
    if (modal) {
        modal.style.display = 'block';
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
        
        // Refresh portfolio data
        loadPortfolioData(token);
        
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