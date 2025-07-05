document.addEventListener('DOMContentLoaded', () => {
    // Apply page transition effect
    document.body.classList.add('page-transition-active');
    
    // Handle page transitions for links
    document.querySelectorAll('a:not([target="_blank"])').forEach(link => {
        // Skip anchors
        if (link.getAttribute('href').startsWith('#')) {
            return;
        }
        
        link.addEventListener('click', function(e) {
            // Skip if modifier keys are pressed
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
            }
            
            const href = this.getAttribute('href');
            const isExternal = href.indexOf('://') > -1;
            
            // Don't apply transition to external links
            if (isExternal) {
                return;
            }
            
            e.preventDefault();
            
            // Fade out
            document.body.classList.add('page-transition-out');
            
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
    
    // Add subtle water ripple effect to auth container
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
        authContainer.addEventListener('mouseenter', createRippleEffect);
    }
    
    function createRippleEffect() {
        const ripple = document.createElement('div');
        ripple.classList.add('water-ripple');
        
        // Position at random location within container
        const width = authContainer.offsetWidth;
        const height = authContainer.offsetHeight;
        
        const x = Math.random() * width;
        const y = Math.random() * (height / 2) + (height / 2); // Bottom half only
        
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        // Add to DOM
        authContainer.appendChild(ripple);
        
        // Remove after animation completes
        setTimeout(() => {
            ripple.remove();
        }, 2000);
    }
    
    // Create initial ripple effect
    setTimeout(createRippleEffect, 1000);
    
    // Create periodic ripple effects
    setInterval(createRippleEffect, 5000);
    
    // Dark mode functionality
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (darkModeToggle) {
        // Check for saved theme preference or use preference from OS
        const savedTheme = localStorage.getItem('theme');
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Apply the saved theme or OS preference
        if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        
        // Toggle dark mode on button click
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            let newTheme = 'light';
            
            if (currentTheme !== 'dark') {
                newTheme = 'dark';
            }
            
            // Apply new theme and save preference
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Tab switching functionality with enhanced animations
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Check URL hash for direct tab access
    const hash = window.location.hash.substring(1);
    if (hash === 'register') {
        switchTab('register');
    }
    
    // Tab click event handlers
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    function switchTab(tabName) {
        // Update active button state
        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Fade out current content
        tabContents.forEach(content => {
            if (content.classList.contains('active')) {
                content.style.opacity = '0';
                content.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    content.classList.remove('active');
                    
                    // Show new content with animation
                    tabContents.forEach(newContent => {
                        if (newContent.id === `${tabName}-tab`) {
                            newContent.classList.add('active');
                            newContent.style.opacity = '0';
                            newContent.style.transform = 'translateY(10px)';
                            
                            // Trigger reflow
                            void newContent.offsetWidth;
                            
                            // Fade in
                            newContent.style.opacity = '1';
                            newContent.style.transform = 'translateY(0)';
                        }
                    });
                }, 200);
            }
        });
    }
    
    // Form submissions
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Redirect based on user role
                    if (data.isAdmin) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    alert(data.message || 'Login failed. Please try again.');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            // Password validation
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }
    

    

    
    // Check authentication status on page load
    checkAuthStatus();
    
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                // User is already logged in, redirect to appropriate page
                if (data.isAdmin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }
}); 