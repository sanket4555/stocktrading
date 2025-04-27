// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Initialize stock ticker
    initStockTicker();
});

// Function to initialize the stock ticker
function initStockTicker() {
    const tickerElement = document.getElementById('ticker-tape');
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

// Function to check if token exists
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Redirect to dashboard if already logged in
function checkAuthStatus() {
    if (isLoggedIn() && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
        window.location.href = 'dashboard.html';
    }
}

// Check auth status on pages that need it
if (document.querySelector('.form-card')) {
    checkAuthStatus();
} 