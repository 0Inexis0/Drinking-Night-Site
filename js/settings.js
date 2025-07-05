document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const passwordChangeForm = document.getElementById('password-change-form');
    const accountDeletionForm = document.getElementById('account-deletion-form');
    const confirmationModal = document.getElementById('confirmation-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    // State

    let currentAction = null;
    let formData = null;
    
    // Check authentication status
    checkAuthStatus();
    
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
    
    // Password Change Form
    if (passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Basic validation
            if (!newPassword) {
                showNotification('Please enter a new password', true);
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', true);
                return;
            }
            
            // Store form data for submission
            formData = {
                currentPassword,
                newPassword
            };
            
            // Set current action
            currentAction = 'changePassword';
            
            // Show confirmation modal
            showConfirmationModal(
                'Confirm Password Change',
                'Are you sure you want to change your password? You will need to use the new password for your next login.'
            );
        });
    }
    
    // Account Deletion Form
    if (accountDeletionForm) {
        accountDeletionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const password = document.getElementById('deletion-password').value;
            const confirmed = document.getElementById('deletion-confirm').checked;
            
            if (!password) {
                showNotification('Please enter your password', true);
                return;
            }
            
            if (!confirmed) {
                showNotification('Please confirm that you understand this action cannot be undone', true);
                return;
            }
            
            // Store form data for submission
            formData = {
                currentPassword: password
            };
            
            // Set current action
            currentAction = 'deleteAccount';
            
            // Show confirmation modal
            showConfirmationModal(
                'Confirm Account Deletion',
                'This will permanently delete your account and all associated data. This action CANNOT be undone. Are you absolutely sure?'
            );
        });
    }
    
    // Modal close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            hideConfirmationModal();
        });
    }
    
    // Modal cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            hideConfirmationModal();
        });
    }
    
    // Modal confirm button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (currentAction === 'changePassword') {
                changePassword();
            } else if (currentAction === 'deleteAccount') {
                deleteAccount();
            }
            
            hideConfirmationModal();
        });
    }
    
    // Show confirmation modal
    function showConfirmationModal(title, message) {
        modalTitle.textContent = title;
        modalContent.textContent = message;
        confirmationModal.classList.add('active');
    }
    
    // Hide confirmation modal
    function hideConfirmationModal() {
        confirmationModal.classList.remove('active');
    }
    
    // Simple password check
    function validatePassword(password) {
        return password.length > 0;
    }
    
    // Change password
    async function changePassword() {
        try {
            
            
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Password changed successfully');
                passwordChangeForm.reset();
            } else {
                showNotification(data.message || 'Failed to change password', true);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification('An error occurred. Please try again later.', true);
        }
    }
    
    // Delete account
    async function deleteAccount() {
        try {
            const response = await fetch('/api/user/delete-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Account deleted successfully');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } else {
                showNotification(data.message || 'Failed to delete account', true);
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            showNotification('An error occurred. Please try again later.', true);
        }
    }
    
    // Check authentication status
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                // User is authenticated
                setupAuthenticatedUser(data.username, data.isAdmin);
            } else {
                // Not logged in, redirect to login
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
        // Update UI for authenticated user
        const usernameElements = document.querySelectorAll('#username, #welcome-name');
        usernameElements.forEach(el => {
            if (el) el.textContent = username;
        });
        
        // Update avatar
        const avatarElement = document.querySelector('.avatar');
        if (avatarElement) {
            avatarElement.textContent = username.charAt(0).toUpperCase();
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
}); 