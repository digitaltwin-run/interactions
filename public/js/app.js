// app.js - Entry point that imports the modular application structure
document.addEventListener('DOMContentLoaded', function() {
  // Import the main application module
  import('./modules/app-main.js').catch(error => {
    console.error('Error loading application:', error);
    
    // Create error notification if modules fail to load
    const container = document.getElementById('notificationContainer') || (() => {
      const container = document.createElement('div');
      container.id = 'notificationContainer';
      container.className = 'notification-container';
      document.body.appendChild(container);
      return container;
    })();
    
    // Show error toast
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = 'Failed to load application modules. Please check the console for details.';
    container.appendChild(toast);
  });
});
