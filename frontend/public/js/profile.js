// Global variables
let user = null;
let activityChart = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load user data
    loadUserInfo();
    
    // Setup form submission events
    setupUpdateProfileForm();
    setupChangePasswordForm();
    
    // Initialize the activity chart
    initActivityChart();
    
    // Setup dropdown toggle
    setupDropdownToggle();
    
    // Setup tab navigation
    setupTabNavigation();
    
    // Load activity
    loadActivity();
});

// Load user information from localStorage
function loadUserInfo() {
    const userData = JSON.parse(localStorage.getItem('user'));
    
    if (!userData) {
        window.location.href = "login.html";
        return;
    }
    
    // Update navbar user info
    document.getElementById('user-name').textContent = userData.name;
    document.getElementById('navbar-balance').textContent = `$${parseFloat(userData.balance).toFixed(2)}`;
    
    // Update user info in profile
    document.getElementById('profile-name').textContent = userData.name;
    document.getElementById('profile-email').textContent = userData.email;
    document.getElementById('profile-balance').textContent = `$${parseFloat(userData.balance).toFixed(2)}`;
    
    // Set user avatar initials
    const initials = getUserInitials(userData.name);
    document.getElementById('user-avatar').textContent = initials;
    
    // Pre-fill form fields
    document.getElementById('input-name').value = userData.name;
    document.getElementById('input-email').value = userData.email;
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
    const updateForm = document.getElementById('update-profile-form');
    updateForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('update-name').value.trim();
        const email = document.getElementById('update-email').value.trim();
        
        if (!name || !email) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // In a real application, this would make an API call
        // For now, we'll just update localStorage
        user.name = name;
        user.email = email;
        
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update UI
        loadUserInfo();
        showNotification('Profile updated successfully!', 'success');
    });
}

// Setup the change password form
function setupChangePasswordForm() {
    const passwordForm = document.getElementById('change-password-form');
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('Please fill in all password fields', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        // In a real application, this would make an API call
        // For now, we'll just show a success message
        showNotification('Password changed successfully!', 'success');
        
        // Reset form
        passwordForm.reset();
    });
}

// Initialize the activity chart
function initActivityChart() {
    const ctx = document.getElementById('activity-chart').getContext('2d');
    
    // Sample data - in a real app, this would come from an API
    const dates = [];
    const loginCounts = [];
    
    // Generate sample data for the last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        loginCounts.push(Math.floor(Math.random() * 3) + 1); // Random login count between 1-3
    }
    
    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Login Activity',
                data: loginCounts,
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        precision: 0
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
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Load user activity
function loadActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Sample activity data
    const activities = [
        { 
            type: 'purchase', 
            icon: 'fa-shopping-cart', 
            description: 'Purchased 5 shares of AAPL', 
            time: '2 hours ago' 
        },
        { 
            type: 'sale', 
            icon: 'fa-money-bill-wave', 
            description: 'Sold 10 shares of MSFT', 
            time: '1 day ago' 
        },
        { 
            type: 'deposit', 
            icon: 'fa-wallet', 
            description: 'Deposited $500.00 to account', 
            time: '3 days ago' 
        },
        { 
            type: 'login', 
            icon: 'fa-sign-in-alt', 
            description: 'Logged in from new device', 
            time: '1 week ago' 
        }
    ];
    
    let activityHTML = '<h3>Recent Activity</h3>';
    
    activities.forEach(activity => {
        activityHTML += `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-details">
                    <p>${activity.description}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `;
    });
    
    activityList.innerHTML = activityHTML;
}

// Handle logout
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = "login.html";
} 