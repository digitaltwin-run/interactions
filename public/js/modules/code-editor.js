// code-editor.js - Functions for managing the code editor

import { getState } from './state.js';
import { showToast } from './ui-utils.js';

// Load file content to editor
export async function loadFileToEditor(fileValue) {
  const state = getState();
  const codeEditor = document.getElementById('codeEditor');
  const saveCodeBtn = document.getElementById('saveCodeBtn');
  
  if (!fileValue) {
    codeEditor.value = '';
    saveCodeBtn.disabled = true;
    return;
  }
  
  const [type, fileName] = fileValue.split(':');
  
  try {
    // First check if we have this content in state
    if (state.editorContent[type] && state.editorContent[type][fileName]) {
      codeEditor.value = state.editorContent[type][fileName];
    } else {
      // Otherwise fetch from server
      const response = await fetch(`/resource/${type}/${fileName}`);
      const content = await response.text();
      
      codeEditor.value = content;
      
      // Store in state
      if (!state.editorContent[type]) {
        state.editorContent[type] = {};
      }
      state.editorContent[type][fileName] = content;
    }
    
    saveCodeBtn.disabled = false;
    
    // Update current file in state
    state.editorCurrentFile = fileName;
    state.editorCurrentType = type;
  } catch (error) {
    console.error('Error loading file to editor:', error);
    codeEditor.value = 'Error loading file.';
    saveCodeBtn.disabled = true;
  }
}

// Save editor content to server
export async function saveEditorContent() {
  const state = getState();
  const fileSelector = document.getElementById('fileSelector');
  const codeEditor = document.getElementById('codeEditor');
  
  if (!fileSelector.value) {
    showToast('No file selected', 'error');
    return;
  }
  
  const [type, fileName] = fileSelector.value.split(':');
  const content = codeEditor.value;
  
  // Update content in state
  if (!state.editorContent[type]) {
    state.editorContent[type] = {};
  }
  state.editorContent[type][fileName] = content;
  
  try {
    // Save to server
    const response = await fetch(`/save/${type}/${fileName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast(`File ${fileName} saved successfully`, 'success');
    } else {
      showToast(`Error saving file ${fileName}`, 'error');
    }
  } catch (error) {
    console.error('Error saving file:', error);
    showToast(`Error saving file ${fileName}`, 'error');
  }
}

// Initialize editor file selector with available resources
export function initializeEditorSelector() {
  const fileSelector = document.getElementById('fileSelector');
  
  // Fetch available resources
  fetch('/resources')
    .then(response => response.json())
    .then(data => {
      // Clear selector
      fileSelector.innerHTML = '<option value="">Select a file to edit</option>';
      
      // Add SVG files
      if (data.svgFiles && data.svgFiles.length > 0) {
        data.svgFiles.forEach(file => {
          addFileToEditorSelector(file, 'svg');
        });
      }
      
      // Add script files
      if (data.scriptFiles && data.scriptFiles.length > 0) {
        data.scriptFiles.forEach(file => {
          addFileToEditorSelector(file, 'script');
        });
      }
    })
    .catch(error => {
      console.error('Error initializing editor selector:', error);
    });
}

// Add file to editor selector
export function addFileToEditorSelector(fileName, type) {
  const fileSelector = document.getElementById('fileSelector');
  
  // Check if option already exists
  const existingOption = Array.from(fileSelector.options).find(
    option => option.value === `${type}:${fileName}`
  );
  
  if (existingOption) return;
  
  // Create option
  const option = document.createElement('option');
  option.value = `${type}:${fileName}`;
  option.textContent = `${type}: ${fileName}`;
  fileSelector.appendChild(option);
}
