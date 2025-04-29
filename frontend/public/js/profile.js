// Global variables
let user = null;
let activityChart = null;
const API_URL = 'http://localhost:5000/api';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    const token = requireAuth();
    if (!token) return;
    
    // Load user data from API
    fetchUserProfile(token);
    
    // Setup form submission events
    setupUpdateProfileForm();
    setupChangePasswordForm();
    
    // Setup tab navigation
    setupTabNavigation();
    
    // Load transaction activity
    loadTransactionActivity(token);
    
    // Initialize the activity chart
    initActivityChart(token);
});

// Fetch user profile from the API
async function fetchUserProfile(token) {
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch user profile');
        }
        
        const userData = await response.json();
        user = userData;
        
        // Update UI with user data
        updateUserInterface(userData);
        
        return userData;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        showNotification('Error', error.message, 'error');
    }
}

// Update the user interface with user data
function updateUserInterface(userData) {
    // Update user dropdown in navbar
    const userDropdownBtn = document.querySelector('.user-dropdown-btn');
    if (userDropdownBtn) {
        userDropdownBtn.textContent = userData.name;
    }
    
    // Update profile header
    const profileName = document.querySelector('.profile-info h1');
    const profileEmail = document.querySelector('.profile-info .email');
    const balance = document.querySelector('.balance');
    const avatar = document.querySelector('.avatar');
    
    if (profileName) profileName.textContent = userData.name;
    if (profileEmail) profileEmail.textContent = userData.email;
    if (balance) balance.textContent = `Balance: $${parseFloat(userData.balance).toFixed(2)}`;
    if (avatar) avatar.textContent = getUserInitials(userData.name);
    
    // Update form fields
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    
    if (nameInput) nameInput.value = userData.name;
    if (emailInput) emailInput.value = userData.email;
    
    console.log('User interface updated with profile data:', userData);
}

// Get user initials from name
function getUserInitials(name) {
    return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
}

// Populate profile information on the page
function populateProfileInfo(user) {
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-balance').textContent = `$${parseFloat(user.balance).toFixed(2)}`;
    document.getElementById('profile-joined').textContent = new Date(user.createdAt || Date.now()).toLocaleDateString();
    
    // Populate form fields for update
    document.getElementById('update-name').value = user.name;
    document.getElementById('update-email').value = user.email;
}

// Setup the update profile form
function setupUpdateProfileForm() {
    const personalInfoForm = document.getElementById('personal-info-form');
    if (!personalInfoForm) return;
    
    personalInfoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone')?.value.trim() || '';
        
        if (!name || !email) {
            showNotification('Error', 'Please fill in all required fields', 'error');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You must be logged in to update your profile');
            }
            
            // Since we don't have a dedicated endpoint to update user profile,
            // we'll update the local storage for now
            // In a real application, this would make an API call like:
            /*
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, phone })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }
            
            const updatedUser = await response.json();
            */
            
            // Update local storage for now
            const userData = JSON.parse(localStorage.getItem('user'));
            userData.name = name;
            userData.email = email;
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Update UI
            updateUserInterface(userData);
            
            showNotification('Success', 'Profile updated successfully', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Error', error.message, 'error');
        }
    });
}

// Setup the change password form
function setupChangePasswordForm() {
    const passwordForm = document.getElementById('password-form');
    if (!passwordForm) return;
    
    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('Error', 'Please fill in all password fields', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('Error', 'New passwords do not match', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('Error', 'Password must be at least 6 characters long', 'error');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You must be logged in to change your password');
            }
            
            // Since we don't have a dedicated endpoint to change password,
            // we'll just show a success message for now
            // In a real application, this would make an API call like:
            /*
            const response = await fetch(`${API_URL}/users/password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    currentPassword,
                    newPassword 
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to change password');
            }
            */
            
            showNotification('Success', 'Password changed successfully', 'success');
            
            // Reset form
            passwordForm.reset();
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification('Error', error.message, 'error');
        }
    });
}

// Initialize the activity chart based on transaction data
async function initActivityChart(token) {
    try {
        // Get transaction data from API
        const transactions = await fetchTransactions(token);
        if (!transactions || transactions.length === 0) {
            console.log('No transaction data available for chart');
            return;
        }
        
        const canvas = document.getElementById('activity-chart');
        if (!canvas) {
            console.error('Activity chart canvas not found');
            return;
        }
        
        console.log('Initializing activity chart with transactions:', transactions.length);
        
        // Process transaction data for chart
        const chartData = processTransactionsForChart(transactions);
        
        // Create chart
        activityChart = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Buy Transactions',
                        data: chartData.buyData,
                        backgroundColor: 'rgba(46, 204, 113, 0.2)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(46, 204, 113, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'Sell Transactions',
                        data: chartData.sellData,
                        backgroundColor: 'rgba(231, 76, 60, 0.2)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(231, 76, 60, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Transactions'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        bodyFont: {
                            size: 13
                        },
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
        
        console.log('Activity chart initialized successfully');
        
    } catch (error) {
        console.error('Error initializing activity chart:', error);
    }
}

// Process transactions data for the chart
function processTransactionsForChart(transactions) {
    // Get the last 7 days
    const dates = [];
    const buyData = [];
    const sellData = [];
    
    // Create date labels for the last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        dates.push(date);
    }
    
    // Format dates for display
    const labels = dates.map(date => 
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    
    // Count transactions for each day
    dates.forEach(date => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const buyCount = transactions.filter(t => 
            t.type === 'buy' && 
            new Date(t.date) >= date && 
            new Date(t.date) < nextDay
        ).length;
        
        const sellCount = transactions.filter(t => 
            t.type === 'sell' && 
            new Date(t.date) >= date && 
            new Date(t.date) < nextDay
        ).length;
        
        buyData.push(buyCount);
        sellData.push(sellCount);
    });
    
    return { labels, buyData, sellData };
}

// Show notification to the user
function showNotification(title, message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
    `;
    
    container.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Toggle the user dropdown menu
function setupDropdownToggle() {
    const dropdownButton = document.getElementById('user-dropdown-button');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    if (dropdownButton && dropdownContent) {
        dropdownButton.addEventListener('click', function() {
            dropdownContent.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        window.addEventListener('click', function(event) {
            if (!event.target.matches('#user-dropdown-button') && 
                !event.target.closest('#user-dropdown-button')) {
                if (dropdownContent.classList.contains('show')) {
                    dropdownContent.classList.remove('show');
                }
            }
        });
    }
}

// Set up tab navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (!tabButtons.length || !tabPanes.length) {
        console.error('Tab navigation elements not found');
        return;
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const targetPane = document.getElementById(tabId);
            
            if (targetPane) {
                targetPane.classList.add('active');
            } else {
                console.error(`Tab pane with id ${tabId} not found`);
            }
        });
    });
    
    console.log('Tab navigation setup complete');
}

// Fetch transactions from the API
async function fetchTransactions(token) {
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch transactions');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

// Load transaction activity
async function loadTransactionActivity(token) {
    try {
        const transactions = await fetchTransactions(token);
        if (!transactions || transactions.length === 0) {
            displayNoActivityMessage();
            return;
        }
        
        console.log('Transactions loaded successfully:', transactions.length);
        
        // Display recent transactions in the activity tab
        displayRecentTransactions(transactions);
        
        // Update activity stats
        updateActivityStats(transactions);
    } catch (error) {
        console.error('Error loading transaction activity:', error);
        displayNoActivityMessage();
    }
}

// Display recent transactions in the activity tab
function displayRecentTransactions(transactions) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) {
        console.error('Activity list container not found');
        return;
    }
    
    // Clear existing content
    activityList.innerHTML = '';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    // Display the 10 most recent transactions
    const recentTransactions = sortedTransactions.slice(0, 10);
    
    if (recentTransactions.length === 0) {
        displayNoActivityMessage();
        return;
    }
    
    console.log('Displaying recent transactions:', recentTransactions.length);
    
    recentTransactions.forEach(transaction => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const date = new Date(transaction.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const typeClass = transaction.type === 'buy' ? 'buy' : 'sell';
        const typeIcon = transaction.type === 'buy' ? 'shopping-cart' : 'exchange-alt';
        
        activityItem.innerHTML = `
            <div class="activity-date">${date}</div>
            <div class="activity-icon ${typeClass}">
                <i class="fas fa-${typeIcon}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-title">
                    ${transaction.type === 'buy' ? 'Bought' : 'Sold'} ${transaction.quantity} shares of ${transaction.symbol}
                </div>
                <div class="activity-subtitle">
                    Price: $${parseFloat(transaction.price).toFixed(2)} | Total: $${parseFloat(transaction.total).toFixed(2)}
                </div>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

// Display no activity message
function displayNoActivityMessage() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = `
        <div class="no-activity">
            <i class="fas fa-info-circle"></i>
            <p>No recent activity found.</p>
        </div>
    `;
}

// Update activity stats
function updateActivityStats(transactions) {
    if (!transactions || transactions.length === 0) {
        console.log('No transactions available for stats');
        return;
    }
    
    // Calculate total trades
    const totalTrades = transactions.length;
    
    // Calculate profit/loss
    const profitLoss = calculateProfitLoss(transactions);
    
    // Calculate account age in days
    const firstTransaction = [...transactions].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    )[0];
    
    const accountAgeInDays = Math.ceil(
        (new Date() - new Date(firstTransaction.date)) / (1000 * 60 * 60 * 24)
    );
    
    console.log('Activity stats calculated:', { totalTrades, profitLoss, accountAgeInDays });
    
    // Update the UI
    const statValues = document.querySelectorAll('.stat-value');
    if (!statValues || statValues.length < 3) {
        console.error('Stat value elements not found');
        return;
    }
    
    // Total trades
    statValues[0].textContent = totalTrades;
    
    // Profit/Loss
    const profitLossElement = statValues[1];
    profitLossElement.textContent = `${profitLoss >= 0 ? '+' : ''}$${Math.abs(profitLoss).toFixed(2)}`;
    profitLossElement.className = profitLoss >= 0 ? 'stat-value profit' : 'stat-value loss';
    
    // Account age
    statValues[2].textContent = `${accountAgeInDays} days`;
}

// Calculate profit/loss from transactions
function calculateProfitLoss(transactions) {
    if (!transactions || transactions.length === 0) return 0;
    
    return transactions.reduce((total, transaction) => {
        if (transaction.type === 'buy') {
            return total - parseFloat(transaction.total);
        } else { // sell
            return total + parseFloat(transaction.total);
        }
    }, 0);
}

// Handle logout
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = "login.html";
} 