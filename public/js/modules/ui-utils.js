// ui-utils.js - UI related utilities and functions

import { getState } from './state.js';

// Create notification container if it doesn't exist
export function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notificationContainer';
  container.className = 'notification-container';
  document.body.appendChild(container);
  return container;
}

// Show toast notification
export function showToast(message, type = 'info', duration = 3000) {
  const state = getState();
  const container = document.getElementById('notificationContainer') || createNotificationContainer();
  
  // Clear existing timeout if there is one
  if (state.lastToast && state.lastToast.timeout) {
    clearTimeout(state.lastToast.timeout);
  }
  
  // Remove existing toast if present
  if (state.lastToast && state.lastToast.element) {
    state.lastToast.element.remove();
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add to container
  container.appendChild(toast);
  
  // Set timeout to remove toast
  const timeout = setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
    state.lastToast = null;
  }, duration);
  
  // Store in state for management
  state.lastToast = {
    element: toast,
    timeout: timeout
  };
  
  return toast;
}

// Switch between tabs
export function switchTab(tabIndex) {
  const centerTabs = document.querySelectorAll('.center-tab');
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  // Remove active class from all tabs and buttons
  centerTabs.forEach(tab => tab.classList.remove('active'));
  tabBtns.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected tab and button
  centerTabs[tabIndex].classList.add('active');
  tabBtns[tabIndex].classList.add('active');
}

// Filter resource lists based on search input
export function filterResources() {
  const state = getState();
  const searchInput = document.getElementById('searchInput');
  const filterText = searchInput.value.toLowerCase();
  state.filterText = filterText;
  
  // Filter SVG list
  const svgItems = document.querySelectorAll('#svgList .resource-item');
  svgItems.forEach(item => {
    const name = item.getAttribute('data-filename').toLowerCase();
    item.style.display = name.includes(filterText) ? 'flex' : 'none';
  });
  
  // Filter script list
  const scriptItems = document.querySelectorAll('#scriptList .resource-item');
  scriptItems.forEach(item => {
    const name = item.getAttribute('data-filename').toLowerCase();
    item.style.display = name.includes(filterText) ? 'flex' : 'none';
  });
}

// Helper function to escape HTML
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
