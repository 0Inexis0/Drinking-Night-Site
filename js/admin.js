document.addEventListener('DOMContentLoaded', () => {
    // Check if the user is an admin
    checkAdminAuth();
    
    // Elements
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const usernameElement = document.getElementById('username');
    const logoutBtn = document.getElementById('logout');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const avatarElement = document.querySelector('.avatar');
    
    // Table elements
    const usersTable = document.getElementById('users-table').querySelector('tbody');
    const sessionsTable = document.getElementById('sessions-table').querySelector('tbody');
    
    // Stats elements
    const totalUsersElement = document.getElementById('total-users');
    const totalSessionsElement = document.getElementById('total-sessions');
    const sessionsThisWeekElement = document.getElementById('sessions-this-week');
    
    // User management modal elements
    const userManageModal = document.getElementById('user-manage-modal-overlay');
    const closeUserManageModalBtn = document.getElementById('close-user-manage-modal');
    const userManageForm = document.getElementById('user-manage-form');
    const userManageTitle = document.getElementById('user-manage-title');
    const usernameInput = document.getElementById('user-username');
    const passwordInput = document.getElementById('user-password');
    const cancelUserManageBtn = document.getElementById('cancel-user-manage');
    const deleteUserBtn = document.getElementById('delete-user-btn');
    
    // Currency management modal elements
    const currencyManageModal = document.getElementById('currency-manage-modal-overlay');
    const closeCurrencyManageModalBtn = document.getElementById('close-currency-manage-modal');
    const currencyManageForm = document.getElementById('currency-manage-form');
    const currencyManageTitle = document.getElementById('currency-manage-title');
    const currencyAmountInput = document.getElementById('currency-amount');
    const currencyReasonInput = document.getElementById('currency-reason');
    const cancelCurrencyManageBtn = document.getElementById('cancel-currency-manage');
    
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
    
    // Load admin data
    async function loadAdminData() {
        await Promise.all([
            fetchUsers(),
            fetchSessions()
        ]);
        
        updateStatistics();
    }
    
    // Fetch users
    async function fetchUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            
            if (data.success) {
                renderUsers(data.users);
            } else {
                console.error('Failed to fetch users:', data.message);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }
    
    // Fetch all sessions
    async function fetchSessions() {
        try {
            const response = await fetch('/api/admin/sessions');
            const data = await response.json();
            
            if (data.success) {
                renderSessions(data.sessions);
            } else {
                console.error('Failed to fetch sessions:', data.message);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    }
    
    // Render users table
    function renderUsers(users) {
        usersTable.innerHTML = '';
        
        if (users.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="no-data">No users found</td>';
            usersTable.appendChild(row);
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.dataset.userId = user.id;
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>
                    <span class="role-badge ${user.is_admin ? 'role-admin' : 'role-user'}">
                        ${user.is_admin ? 'Admin' : 'User'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn btn-small edit-user-btn" title="Edit user">Edit</button>
                    <button class="btn btn-small currency-btn" title="Grant currency">💰</button>
                </td>
            `;
            
            // Add edit button event listener
            const editBtn = row.querySelector('.edit-user-btn');
            editBtn.addEventListener('click', () => {
                openUserManageModal(user);
            });
            
            // Add currency button event listener
            const currencyBtn = row.querySelector('.currency-btn');
            currencyBtn.addEventListener('click', () => {
                openCurrencyManageModal(user);
            });
            
            usersTable.appendChild(row);
        });
    }
    
    // Open user management modal
    function openUserManageModal(user) {
        userManageTitle.textContent = `Edit User: ${user.username}`;
        usernameInput.value = user.username;
        passwordInput.value = '';
        
        // Set user ID as data attribute
        userManageForm.dataset.userId = user.id;
        
        // Handle delete button visibility
        // Don't allow admins to delete themselves or other admins
        if (user.is_admin) {
            deleteUserBtn.style.display = 'none';
        } else {
            deleteUserBtn.style.display = 'block';
        }
        
        // Show modal
        userManageModal.classList.add('active');
    }
    
    // Close user management modal
    function closeUserManageModal() {
        userManageModal.classList.remove('active');
    }
    
    // Close modal buttons
    if (closeUserManageModalBtn) {
        closeUserManageModalBtn.addEventListener('click', closeUserManageModal);
    }
    
    if (cancelUserManageBtn) {
        cancelUserManageBtn.addEventListener('click', closeUserManageModal);
    }
    
    // Close modal when clicking outside
    if (userManageModal) {
        userManageModal.addEventListener('click', (e) => {
            if (e.target === userManageModal) {
                closeUserManageModal();
            }
        });
    }
    
    // Handle user management form submission
    if (userManageForm) {
        userManageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userId = userManageForm.dataset.userId;
            const newUsername = usernameInput.value.trim();
            const newPassword = passwordInput.value.trim();
            
            if (!newUsername) {
                alert('Username is required');
                return;
            }
            
            try {
                // Update username if it has changed
                const updateUsernameResponse = await fetch(`/api/admin/users/${userId}/username`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username: newUsername })
                });
                
                const usernameData = await updateUsernameResponse.json();
                
                if (!usernameData.success) {
                    alert(usernameData.message || 'Failed to update username');
                    return;
                }
                
                // Update password if provided
                if (newPassword) {
                    const updatePasswordResponse = await fetch(`/api/admin/users/${userId}/password`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ password: newPassword })
                    });
                    
                    const passwordData = await updatePasswordResponse.json();
                    
                    if (!passwordData.success) {
                        alert(passwordData.message || 'Failed to update password');
                        return;
                    }
                }
                
                // Close modal and refresh user list
                closeUserManageModal();
                fetchUsers();
                
                alert('User updated successfully');
                
            } catch (error) {
                console.error('Error updating user:', error);
                alert('An error occurred while updating the user');
            }
        });
    }
    
    // Handle user deletion
    if (deleteUserBtn) {
        deleteUserBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const userId = userManageForm.dataset.userId;
            
            if (!confirm('Are you sure you want to delete this user? This will delete all their sessions and cannot be undone.')) {
                return;
            }
            
            try {
                const response = await fetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    closeUserManageModal();
                    fetchUsers();
                    fetchSessions();
                    alert('User deleted successfully');
                } else {
                    alert(data.message || 'Failed to delete user');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('An error occurred while deleting the user');
            }
        });
    }
    
    // Currency management functions
    function openCurrencyManageModal(user) {
        currencyManageTitle.textContent = `Grant Currency to: ${user.username}`;
        currencyAmountInput.value = '';
        currencyReasonInput.value = '';
        
        // Set user ID as data attribute
        currencyManageForm.dataset.userId = user.id;
        currencyManageForm.dataset.username = user.username;
        
        // Show modal
        currencyManageModal.classList.add('active');
        
        // Focus on amount input
        setTimeout(() => {
            currencyAmountInput.focus();
        }, 300);
    }
    
    // Close currency management modal
    function closeCurrencyManageModal() {
        currencyManageModal.classList.remove('active');
    }
    
    // Close modal buttons
    if (closeCurrencyManageModalBtn) {
        closeCurrencyManageModalBtn.addEventListener('click', closeCurrencyManageModal);
    }
    
    if (cancelCurrencyManageBtn) {
        cancelCurrencyManageBtn.addEventListener('click', closeCurrencyManageModal);
    }
    
    // Close modal when clicking outside
    if (currencyManageModal) {
        currencyManageModal.addEventListener('click', (e) => {
            if (e.target === currencyManageModal) {
                closeCurrencyManageModal();
            }
        });
    }
    
    // Handle currency management form submission
    if (currencyManageForm) {
        currencyManageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userId = currencyManageForm.dataset.userId;
            const username = currencyManageForm.dataset.username;
            const amount = parseInt(currencyAmountInput.value);
            const reason = currencyReasonInput.value.trim();
            
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            try {
                const response = await fetch(`/api/admin/users/${userId}/currency`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        amount: amount,
                        reason: reason || `Currency granted by admin`
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    closeCurrencyManageModal();
                    alert(data.message);
                    
                    // Refresh sessions to show the new currency grant
                    fetchSessions();
                } else {
                    alert(data.message || 'Failed to grant currency');
                }
            } catch (error) {
                console.error('Error granting currency:', error);
                alert('An error occurred while granting currency');
            }
        });
    }
    
    // Render sessions table
    function renderSessions(sessions) {
        sessionsTable.innerHTML = '';
        
        if (sessions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="no-data">No sessions found</td>';
            sessionsTable.appendChild(row);
            return;
        }
        
        sessions.forEach(session => {
            const sessionDate = new Date(session.date);
            const formattedDate = sessionDate.toLocaleDateString() + ' ' + 
                                 sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${session.id}</td>
                <td>${session.username}</td>
                <td>${session.type.charAt(0).toUpperCase() + session.type.slice(1)}</td>
                <td>${formattedDate}</td>
            `;
            
            // Add click event to show session details
            row.addEventListener('click', () => {
                openSessionDetailModal(session);
            });
            
            sessionsTable.appendChild(row);
        });
    }
    
    // Update statistics
    function updateStatistics() {
        const userCount = usersTable.querySelectorAll('tr').length;
        totalUsersElement.textContent = userCount;
        
        const sessionCount = sessionsTable.querySelectorAll('tr').length;
        totalSessionsElement.textContent = sessionCount;
        
        // Count sessions from this week
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        
        let weeklyCount = 0;
        sessionsTable.querySelectorAll('tr').forEach(row => {
            const dateCell = row.cells[3];
            if (dateCell) {
                const sessionDate = new Date(dateCell.textContent);
                if (sessionDate >= startOfWeek) {
                    weeklyCount++;
                }
            }
        });
        
        sessionsThisWeekElement.textContent = weeklyCount;
    }
    
    // Session detail modal
    function openSessionDetailModal(session) {
        const modalOverlay = document.getElementById('activity-modal-overlay');
        const detailTitle = document.getElementById('activity-detail-title');
        const detailContent = document.getElementById('activity-detail-content');
        
        // Set modal title
        detailTitle.textContent = session.type.charAt(0).toUpperCase() + session.type.slice(1);
        
        // Format date
        const sessionDate = new Date(session.date);
        const formattedDate = sessionDate.toLocaleDateString() + ' ' + 
                             sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Build HTML content for session details
        let contentHTML = `
            <div class="detail-item">
                <span class="detail-label">User</span>
                <span class="detail-value">${session.username}</span>
            </div>
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
        
        if (session.notes) {
            contentHTML += `
                <div class="detail-item">
                    <span class="detail-label">Notes</span>
                    <div class="detail-notes">${session.notes}</div>
                </div>
            `;
        }
        
        // Set content
        detailContent.innerHTML = contentHTML;
        
        // Show modal
        modalOverlay.classList.add('active');
        
        // Set up close buttons
        const closeButtons = document.querySelectorAll('#close-activity-modal, #close-detail-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modalOverlay.classList.remove('active');
            });
        });
        
        // Close when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }
    
    // Check if user is admin and redirect if not
    async function checkAdminAuth() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (!data.authenticated || !data.isAdmin) {
                window.location.href = 'login.html';
                return;
            }
            
            // Set username and avatar
            usernameElement.textContent = data.username;
            if (avatarElement) {
                avatarElement.textContent = data.username.charAt(0).toUpperCase();
            }
            
            // Load admin data after authentication check
            loadAdminData();
            
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = 'login.html';
        }
    }
}); 