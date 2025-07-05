document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const logoutBtn = document.getElementById('logout');
    const sessionNameElement = document.getElementById('session-name');

    
    // Get session ID and data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('id');
    
    // Session data (will be fetched from server or local storage)
    let sessionData = null;
    
    // Initialize
    init();
    
    // User menu dropdown toggle
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', () => {
            userDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }
    
    // Dark mode functionality
    if (darkModeToggle) {
        const savedTheme = localStorage.getItem('theme');
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            let newTheme = 'light';
            
            if (currentTheme !== 'dark') {
                newTheme = 'dark';
            }
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = '../index.html';
                } else {
                    showNotification('Logout failed. Please try again.', true);
                }
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('An error occurred during logout.', true);
            }
        });
    }
    
    // Initialize the session
    async function init() {
        try {
            await checkAuthStatus();
            
            if (!sessionId) {
                updateSessionUI();
                showNotification('No session selected.', true);
                return;
            }
            
            await fetchSessionData();
        } catch (error) {
            console.error('Error initializing session:', error);
            showNotification('Failed to load session data', true);
        }
    }
    
    // Fetch session data
    async function fetchSessionData() {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`);
            const data = await response.json();
            
            if (data.success) {
                sessionData = data.session;
            } else {
                throw new Error(data.message || 'Failed to fetch session');
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            throw new Error('Failed to load session data');
        }
        
        if (sessionData) {
            updateSessionUI();
        } else {
            throw new Error('Session not found');
        }
    }
    
    // Update UI with session data
    function updateSessionUI() {
        if (sessionNameElement) {
            sessionNameElement.textContent = sessionData ? (sessionData.type || 'Untitled Session') : 'No Session';
        }
    }
        
    // Check authentication status
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                setupAuthenticatedUser(data.username);
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = 'login.html';
        }
    }
    
    // Setup UI for authenticated user
    function setupAuthenticatedUser(username) {
        const usernameElement = document.getElementById('username');
        const avatarElement = document.querySelector('.avatar');
        
        if (usernameElement) {
            usernameElement.textContent = username;
        }
        
        if (avatarElement) {
            avatarElement.textContent = username.charAt(0).toUpperCase();
        }
    }
    

    
    // Helper function to show notifications
    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}); 