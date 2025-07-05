document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const getStartedBtn = document.getElementById('get-started');
    const loginBtn = document.getElementById('login');
    const signupBtn = document.getElementById('signup');

    
    // Page transition effects
    document.body.classList.add('page-transition-active');
    
    // Handle page transitions for links
    document.querySelectorAll('a').forEach(link => {
        // Skip links that open in new tabs or are anchors
        if (link.getAttribute('target') === '_blank' || link.getAttribute('href').startsWith('#')) {
            return;
        }
        
        link.addEventListener('click', function(e) {
            // Skip if modifier keys are pressed (new tab, download, etc.)
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
            }, 300); // Match this with the CSS transition duration
        });
    });
    
    // Water ripple effect on mouse move for welcome section - reduced intensity
    const welcomeSection = document.querySelector('.welcome');
    if (welcomeSection) {
        let lastRippleTime = 0;
        const rippleDelay = 1000; // Only create a ripple every 1 second
        
        welcomeSection.addEventListener('mousemove', (e) => {
            const now = Date.now();
            
            // Limit the frequency of ripple creation
            if (now - lastRippleTime < rippleDelay) {
                return;
            }
            
            lastRippleTime = now;
            
            // Create ripple element
            const ripple = document.createElement('div');
            ripple.classList.add('water-ripple');
            
            // Position at mouse location
            const rect = welcomeSection.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // Add to DOM
            welcomeSection.appendChild(ripple);
            
            // Remove after animation completes
            setTimeout(() => {
                ripple.remove();
            }, 2000);
        });
    }
    
    // Dark mode functionality
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
    
    // Check if user is already logged in
    checkAuthStatus();
    
    // Get Started button
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            window.location.href = 'pages/login.html';
        });
    }
    

    
    // Check authentication status
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                // Update UI for logged-in users
                if (loginBtn) loginBtn.textContent = 'Dashboard';
                if (loginBtn) loginBtn.href = 'pages/dashboard.html';
                if (signupBtn) signupBtn.style.display = 'none';
                if (getStartedBtn) getStartedBtn.textContent = 'Go to Dashboard';
                getStartedBtn.removeEventListener('click', getStartedBtn.clickHandler);
                getStartedBtn.clickHandler = () => {
                    window.location.href = 'pages/dashboard.html';
                };
                if (getStartedBtn) getStartedBtn.addEventListener('click', getStartedBtn.clickHandler);
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }
    
    // Add smooth scrolling for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add animation on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Enhanced animation when scrolling to features section
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Staggered animation
                setTimeout(() => {
                    entry.target.classList.add('feature-card-visible');
                }, index * 150);
            }
        });
    }, observerOptions);
    
    featureCards.forEach(card => {
        observer.observe(card);
    });
}); 