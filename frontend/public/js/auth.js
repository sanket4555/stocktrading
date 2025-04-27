// Base API URL
const API_URL = 'http://localhost:5000/api';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            login(email, password);
        });
    }
    
    // Handle registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Check if passwords match
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            register(name, email, password);
        });
    }
});

// Login function
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Save user data and token to local storage
        saveUserData(data);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        showError(error.message);
    }
}

// Register function
async function register(name, email, password) {
    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        // Save user data and token to local storage
        saveUserData(data);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        showError(error.message);
    }
}

// Save user data to local storage
function saveUserData(userData) {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify({
        id: userData._id,
        name: userData.name,
        email: userData.email,
        balance: userData.balance
    }));
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Function to check if user is authenticated
function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
    return token;
} 