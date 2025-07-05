document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status
    checkAuthStatus();
    
    // Elements
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const usernameElements = document.querySelectorAll('#username, #welcome-name');

    const logoutBtn = document.getElementById('logout');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const avatarElement = document.querySelector('.avatar');
    const addSessionBtn = document.getElementById('add-session-btn');
    
    // Session detail modal elements
    const sessionModal = document.getElementById('activity-modal-overlay');
    const closeSessionModalBtn = document.getElementById('close-activity-modal');
    const closeDetailBtn = document.getElementById('close-detail-btn');
    const sessionDetailTitle = document.getElementById('activity-detail-title');
    const sessionDetailContent = document.getElementById('activity-detail-content');
    
    // New session modal elements
    const newSessionModal = document.getElementById('new-session-modal-overlay');
    const closeNewSessionModalBtn = document.getElementById('close-new-session-modal');
    const cancelNewSessionBtn = document.getElementById('cancel-new-session-btn');
    const newSessionForm = document.getElementById('new-session-form');
    const sessionNameInput = document.getElementById('session-name');

    
    // State variables
    let currentUser = null;
    
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
    
    // User menu dropdown toggle
    userMenuBtn.addEventListener('click', () => {
        userDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
    

    

    
    // Logout functionality
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
                alert('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout.');
        }
    });
    
    // New session modal functionality
    // Add new session button
    if (addSessionBtn) {
        addSessionBtn.addEventListener('click', () => {
            openNewSessionModal();
        });
    }
    
    // Open new session modal
    function openNewSessionModal() {
        // Clear previous input
        sessionNameInput.value = '';
        
        // Show modal with animation
        newSessionModal.classList.add('active');
        
        // Focus on input field
        setTimeout(() => {
            sessionNameInput.focus();
        }, 300);
    }
    
    // Close new session modal
    function closeNewSessionModal() {
        newSessionModal.classList.remove('active');
    }
    
    // Close new session modal buttons
    if (closeNewSessionModalBtn) {
        closeNewSessionModalBtn.addEventListener('click', closeNewSessionModal);
    }
    
    if (cancelNewSessionBtn) {
        cancelNewSessionBtn.addEventListener('click', closeNewSessionModal);
    }
    


    // Handle new session form submission
    if (newSessionForm) {
        newSessionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const sessionName = sessionNameInput.value.trim();
            
            // Create a new session with default name if empty
            createNewSession(sessionName || "Untitled Session");
            
            // Close the modal
            closeNewSessionModal();
        });
    }
    
    // Function to create a new session
    async function createNewSession(name) {
        try {
            // Create a new session object with basic info
            const sessionData = {
                type: name,
                date: new Date().toISOString(),
                partyIntensity: 5
            };

            // Use the server database
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sessionData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Refresh sessions from server
                await fetchSessions();
                showNotification('Session created successfully!');
            } else {
                throw new Error(data.message || 'Failed to create session');
            }
        } catch (error) {
            console.error('Error creating session:', error);
            showNotification(`Failed to create session: ${error.message}`, true);
        }
    }
    
    // Helper function to show notifications
    function showNotification(message, isError = false) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.textContent = message;
        
        // Add to the DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Function to delete a session
    async function deleteSession(id) {
        try {
            // Delete from database
            const response = await fetch(`/api/sessions/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Refresh sessions
                await fetchSessions();
                showNotification('Session deleted successfully!');
            } else {
                throw new Error(data.message || 'Failed to delete session');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            showNotification(`Failed to delete session: ${error.message}`, true);
        }
    }
    
    // Session modal functionality
    function openSessionModal(session) {
        // Set modal title
        sessionDetailTitle.textContent = session.type.charAt(0).toUpperCase() + session.type.slice(1);
        
        // Format date
        const sessionDate = new Date(session.date);
        const formattedDate = sessionDate.toLocaleDateString() + ' ' + 
                             sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Build HTML content for session details
        let contentHTML = `
            <div class="detail-item">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${formattedDate}</span>
            </div>
        `;
        
        if (session.location) {
            contentHTML += `
                <div class="detail-item">
                    <span class="detail-label">Location</span>
                    <span class="detail-value">${session.location}</span>
                </div>
            `;
        }
        
        if (session.duration) {
            contentHTML += `
                <div class="detail-item">
                    <span class="detail-label">Duration</span>
                    <span class="detail-value">${session.duration} minutes</span>
                </div>
            `;
        }
        

        
        if (session.volume) {
            contentHTML += `
                <div class="detail-item">
                    <span class="detail-label">Volume</span>
                    <span class="detail-value">${session.volume.replace('_', ' ')}</span>
                </div>
            `;
        }
        
        if (session.clothing && session.clothing.length > 0) {
            contentHTML += `
                <div class="detail-item">
                    <span class="detail-label">Clothing</span>
                    <span class="detail-value">${session.clothing.join(', ')}</span>
                </div>
            `;
        }
        
        // Add rating stars if available
        if (session.rating) {
            let starsHTML = '<div class="detail-rating">';
            for (let i = 1; i <= 5; i++) {
                if (i <= session.rating) {
                    starsHTML += '<span class="rating-star filled">★</span>';
                } else {
                    starsHTML += '<span class="rating-star">★</span>';
                }
            }
            starsHTML += '</div>';
            
            contentHTML += `
                <div class="detail-item">
                    <span class="detail-label">Rating</span>
                    ${starsHTML}
                </div>
            `;
        }
        
        // Add notes if available
        if (session.notes) {
            contentHTML += `
                <div class="detail-item">
                    <span class="detail-label">Notes</span>
                    <div class="detail-notes">${session.notes}</div>
                </div>
            `;
        }
        
        // Set content
        sessionDetailContent.innerHTML = contentHTML;
        
        // Show modal with animation
        sessionModal.classList.add('active');
    }
    
    // Close session modal
    function closeSessionModal() {
        sessionModal.classList.remove('active');
    }
    
    // Close modal buttons
    if (closeSessionModalBtn) {
        closeSessionModalBtn.addEventListener('click', closeSessionModal);
    }
    
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeSessionModal);
    }
    
    // Close modal when clicking outside
    sessionModal.addEventListener('click', (e) => {
        if (e.target === sessionModal) {
            closeSessionModal();
        }
    });
    
    // Close new session modal when clicking outside
    newSessionModal.addEventListener('click', (e) => {
        if (e.target === newSessionModal) {
            closeNewSessionModal();
        }
    });
    
    // Fetch sessions from the API
    async function fetchSessions() {
        try {
            const response = await fetch('/api/sessions');
            const data = await response.json();
            
            if (data.success) {
                updateSessionDisplay(data.sessions);
                updateStatistics(data.sessions);
            } else {
                throw new Error(data.message || 'Failed to fetch sessions');
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            showNotification('Failed to load sessions.', true);
        }
    }
    
    // Function to display sessions
    function updateSessionDisplay(sessions) {
        const sessionList = document.querySelector('.activity-list');
        const noDataMsg = document.querySelector('.no-data');
        
        if (sessions.length > 0) {
            // Hide "no data" message and show list
            noDataMsg.style.display = 'none';
            sessionList.style.display = 'block';
            
            // Clear existing list
            sessionList.innerHTML = '';
            
            // Show only the 5 most recent sessions
            const recentSessions = sessions.slice(0, 5);
            
            // Add each session to the list
            recentSessions.forEach(session => {
                const sessionDate = new Date(session.date);
                const formattedDate = sessionDate.toLocaleDateString() + ' ' + 
                                    sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                const li = document.createElement('li');
                li.className = 'activity-item';
                li.dataset.id = session.id;
                
                li.innerHTML = `
                    <div class="activity-content">
                        <div class="activity-type">${session.type.charAt(0).toUpperCase() + session.type.slice(1)}</div>
                        <div class="activity-details">
                            <span class="activity-date">${formattedDate}</span>
                            ${session.location ? `<span class="activity-location"> at ${session.location}</span>` : ''}
                        </div>
                    </div>
                    <div class="activity-actions">
                        <button class="icon-btn play-btn" title="Play session">▶</button>
                        <button class="icon-btn delete-btn" title="Delete session">×</button>
                    </div>
                `;
                
                // Add click event to open detail modal
                const contentArea = li.querySelector('.activity-content');
                contentArea.addEventListener('click', () => {
                    openSessionModal(session);
                });
                
                // Add play button functionality
                const playBtn = li.querySelector('.play-btn');
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent opening the modal
                    window.location.href = `play-session.html?id=${li.dataset.id}`;
                });
                
                // Add delete button functionality
                const deleteBtn = li.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent opening the modal
                    if (confirm('Are you sure you want to delete this session?')) {
                        deleteSession(parseInt(li.dataset.id));
                    }
                });
                
                sessionList.appendChild(li);
            });
        } else {
            // Show "no data" message and hide list
            noDataMsg.style.display = 'block';
            sessionList.style.display = 'none';
        }
    }
    
    // Function to update statistics
    function updateStatistics(sessions) {
        if (sessions.length === 0) return;
        
        // Update total count
        const totalSessionsElement = document.querySelector('.stat-item:nth-child(1) .stat-value');
        if (totalSessionsElement) {
            totalSessionsElement.textContent = sessions.length;
        }
        
        // Update this week's count
        const thisWeekElement = document.querySelector('.stat-item:nth-child(2) .stat-value');
        if (thisWeekElement) {
            const now = new Date();
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            
            const thisWeekSessions = sessions.filter(session => {
                const sessionDate = new Date(session.date);
                return sessionDate >= startOfWeek;
            });
            
            thisWeekElement.textContent = thisWeekSessions.length;
        }
        
        // For a real app, we would calculate streak data here
    }
    

    
    // Check authentication status on page load
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                // User is authenticated
                currentUser = {
                    id: data.userId,
                    username: data.username,
                    isAdmin: data.isAdmin
                };
                
                // Setup UI for authenticated user
                setupAuthenticatedUser(data.username, data.isAdmin);
                
                // Fetch sessions from the database
                await fetchSessions();
            } else {
                // User is not authenticated, redirect to login
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // Redirect to login on error
            window.location.href = 'login.html';
        }
    }
    

    
    // Setup for authenticated user
    function setupAuthenticatedUser(username, isAdmin) {
        usernameElements.forEach(el => el.textContent = username);
        
        // Set avatar initial
        if (avatarElement) {
            avatarElement.textContent = username.charAt(0).toUpperCase();
        }
        
        // Add admin dashboard link if user is admin
        if (isAdmin) {
            const adminLinkExists = Array.from(userDropdown.querySelectorAll('a')).some(a => a.textContent === 'Admin Dashboard');
            
            if (!adminLinkExists) {
                const adminLink = document.createElement('li');
                adminLink.innerHTML = '<a href="admin.html">Admin Dashboard</a>';
                userDropdown.querySelector('ul').insertBefore(adminLink, userDropdown.querySelector('ul').firstChild);
            }
        }
    }
}); 