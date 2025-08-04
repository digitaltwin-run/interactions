// file-handlers.js - File and resource management functions

import { getState } from './state.js';
import { showToast } from './ui-utils.js';

// Setup drag and drop for file uploads
export function setupDragAndDrop() {
  const uploadZones = document.querySelectorAll('.upload-zone');
  
  uploadZones.forEach(zone => {
    const type = zone.getAttribute('data-type');
    
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        uploadFiles(files, type);
      }
    });
  });
}

// Upload multiple files
export function uploadFiles(files, type) {
  const formData = new FormData();
  let validFiles = [];
  
  // Filter files based on type
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if ((type === 'svg' && file.name.endsWith('.svg')) ||
        (type === 'script' && file.name.endsWith('.js'))) {
      formData.append('files', file);
      validFiles.push(file);
    }
  }
  
  if (validFiles.length === 0) {
    showToast(`No valid ${type} files selected`, 'error');
    return;
  }
  
  // Upload files
  fetch(`/upload/${type}`, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      validFiles.forEach(file => {
        addResourceToList(document.getElementById(`${type}List`), file.name, type);
      });
      showToast(`${validFiles.length} ${type} file(s) uploaded successfully`, 'success');
    } else {
      showToast(`Error uploading ${type} files`, 'error');
    }
  })
  .catch(error => {
    console.error(`Error uploading ${type} files:`, error);
    showToast(`Error uploading ${type} files`, 'error');
  });
}

// Upload a single resource
export function uploadResource(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const type = form.getAttribute('data-type');
  
  // Check if any file is selected
  const fileInput = form.querySelector('input[type="file"]');
  if (fileInput.files.length === 0) {
    showToast(`No ${type} file selected`, 'error');
    return;
  }
  
  // Upload file
  fetch(`/upload/${type}`, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const fileName = fileInput.files[0].name;
      addResourceToList(document.getElementById(`${type}List`), fileName, type);
      showToast(`${type} file uploaded successfully`, 'success');
      fileInput.value = ''; // Clear the input
    } else {
      showToast(`Error uploading ${type} file`, 'error');
    }
  })
  .catch(error => {
    console.error(`Error uploading ${type} file:`, error);
    showToast(`Error uploading ${type} file`, 'error');
  });
}

// Add a resource to its list
export function addResourceToList(listElement, fileName, type) {
  // Check if item already exists
  const existingItem = Array.from(listElement.children).find(
    item => item.getAttribute('data-filename') === fileName
  );
  
  if (existingItem) return;
  
  // Create list item
  const item = document.createElement('div');
  item.className = 'resource-item';
  item.setAttribute('data-filename', fileName);
  item.setAttribute('data-type', type);
  
  // Add filename
  const nameSpan = document.createElement('span');
  nameSpan.className = 'resource-name';
  nameSpan.textContent = fileName;
  item.appendChild(nameSpan);
  
  // Add action buttons
  const actions = document.createElement('div');
  actions.className = 'resource-actions';
  
  // Add preview button
  const previewBtn = document.createElement('button');
  previewBtn.innerHTML = '<i class="fas fa-eye"></i>';
  previewBtn.className = 'action-btn preview-btn';
  previewBtn.setAttribute('data-action', 'preview');
  actions.appendChild(previewBtn);
  
  // Add edit button
  const editBtn = document.createElement('button');
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.className = 'action-btn edit-btn';
  editBtn.setAttribute('data-action', 'edit');
  actions.appendChild(editBtn);
  
  // Add remove button
  const removeBtn = document.createElement('button');
  removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
  removeBtn.className = 'action-btn remove-btn';
  removeBtn.setAttribute('data-action', 'remove');
  actions.appendChild(removeBtn);
  
  item.appendChild(actions);
  listElement.appendChild(item);
  
  // Add to editor selector
  addFileToEditorSelector(fileName, type);
  
  // If it's a script, add to script selector
  if (type === 'script') {
    addFileToScriptSelector(fileName);
  }
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

// Add file to script selector
export function addFileToScriptSelector(fileName) {
  const scriptSelector = document.getElementById('scriptSelector');
  
  // Check if option already exists
  const existingOption = Array.from(scriptSelector.options).find(
    option => option.value === fileName
  );
  
  if (existingOption) return;
  
  // Create option
  const option = document.createElement('option');
  option.value = fileName;
  option.textContent = fileName;
  scriptSelector.appendChild(option);
}

// Handle resource actions (preview, edit, remove)
export function handleResourceAction(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  
  const action = target.getAttribute('data-action');
  const item = target.closest('.resource-item');
  const type = item.getAttribute('data-type');
  const fileName = item.getAttribute('data-filename');
  
  if (action === 'preview') {
    previewResource(type, fileName);
  } else if (action === 'edit') {
    loadFileToEditor(`${type}:${fileName}`);
  } else if (action === 'remove') {
    removeResource(item);
  }
}
