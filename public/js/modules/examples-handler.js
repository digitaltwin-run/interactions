// examples-handler.js - Functions for handling example files

import { getState } from './state.js';
import { showToast } from './ui-utils.js';
import { addResourceToList } from './file-handlers.js';

// Handle example file actions
export function handleExampleAction(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  
  const action = target.getAttribute('data-action');
  const type = target.getAttribute('data-type');
  const file = target.getAttribute('data-file');
  
  if (action === 'view-example') {
    viewExampleFile(type, file);
  } else if (action === 'copy-example') {
    copyExampleFile(type, file);
  } else if (action === 'open-example') {
    openExampleFile(file);
  }
}

// View example file content
export async function viewExampleFile(type, file) {
  try {
    const response = await fetch(`/examples/${file}`);
    const content = await response.text();
    
    // Load into code editor
    const fileSelector = document.getElementById('fileSelector');
    const codeEditor = document.getElementById('codeEditor');
    const saveCodeBtn = document.getElementById('saveCodeBtn');
    
    codeEditor.value = content;
    fileSelector.value = ''; // Clear selection as this is just a preview
    saveCodeBtn.disabled = true; // Can't save example files directly
    
    // Switch to code tab
    document.querySelector('[data-tab="code"]').click();
    
    showToast(`Example file ${file} loaded for viewing`, 'success');
  } catch (error) {
    console.error('Error viewing example file:', error);
    showToast(`Error loading example file ${file}`, 'error');
  }
}

// Copy example file to the project
export async function copyExampleFile(type, file) {
  try {
    // Fetch the example file
    const response = await fetch(`/examples/${file}`);
    const content = await response.text();
    
    // Create FormData for upload
    const formData = new FormData();
    
    // Create a File object from the content
    const blob = new Blob([content], { type: 'text/plain' });
    const fileObj = new File([blob], file, { type: 'text/plain' });
    
    formData.append('files', fileObj);
    
    // Upload to server
    const uploadResponse = await fetch(`/upload/${type}`, {
      method: 'POST',
      body: formData
    });
    
    const data = await uploadResponse.json();
    
    if (data.success) {
      // Add to resource list
      const listElement = document.getElementById(`${type}List`);
      addResourceToList(listElement, file, type);
      
      showToast(`Example file ${file} copied to project`, 'success');
    } else {
      showToast(`Error copying example file ${file}`, 'error');
    }
  } catch (error) {
    console.error('Error copying example file:', error);
    showToast(`Error copying example file ${file}`, 'error');
  }
}

// Open example HTML file in new tab
export function openExampleFile(file) {
  window.open(`/examples/${file}`, '_blank');
}
