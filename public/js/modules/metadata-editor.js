// metadata-editor.js - Functions for handling metadata editing

import { getState } from './state.js';
import { showToast } from './ui-utils.js';

// Update element properties with metadata
export function updateElementProperties() {
  const state = getState();
  
  if (!state.selectedElement) {
    return;
  }
  
  // Get all metadata fields
  const metadataInputs = document.querySelectorAll('.metadata-value');
  const metadata = {};
  
  // Collect metadata from inputs
  metadataInputs.forEach(input => {
    const key = input.getAttribute('data-key');
    const value = input.value;
    metadata[key] = value;
  });
  
  // Store metadata in state
  state.metadataFields[state.selectedElementId] = metadata;
  
  // Apply metadata to element
  applyMetadataToElement(state.selectedElement, metadata);
  
  // Update JSON editor if visible
  const jsonEditor = document.getElementById('jsonMetadataTextarea');
  if (jsonEditor) {
    jsonEditor.value = JSON.stringify(metadata, null, 2);
  }
}

// Setup metadata tabs switching
export function setupMetadataTabs() {
  const metadataTabs = document.querySelectorAll('.metadata-tab');
  const metadataEditors = document.querySelectorAll('.metadata-editor');
  
  metadataTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs and editors
      metadataTabs.forEach(t => t.classList.remove('active'));
      metadataEditors.forEach(e => e.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show corresponding editor
      const editorType = tab.getAttribute('data-editor');
      document.getElementById(`${editorType}MetadataEditor`).classList.add('active');
      
      // If switching to JSON editor, update JSON from metadata
      if (editorType === 'json') {
        updateJsonFromMetadata();
      }
    });
  });
}

// Convert metadata to JSON and update the JSON editor
export function updateJsonFromMetadata() {
  const state = getState();
  const jsonTextarea = document.getElementById('jsonMetadataTextarea');
  
  if (!state.selectedElementId) {
    jsonTextarea.value = '{}';
    return;
  }
  
  const metadata = state.metadataFields[state.selectedElementId] || {};
  jsonTextarea.value = JSON.stringify(metadata, null, 2);
}

// Parse JSON from the editor and update metadata fields
export function updateMetadataFromJson(jsonData) {
  const state = getState();
  const metadataFields = document.getElementById('metadataFields');
  
  if (!state.selectedElementId || !state.selectedElement) {
    return;
  }
  
  // Clear existing fields
  metadataFields.innerHTML = '';
  
  // Add new fields
  for (let key in jsonData) {
    createMetadataField(metadataFields, key, jsonData[key]);
  }
  
  // Update element with new metadata
  state.metadataFields[state.selectedElementId] = jsonData;
  applyMetadataToElement(state.selectedElement, jsonData);
}

// Create a metadata field in the simple editor
export function createMetadataField(container, key, value) {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'metadata-field';
  
  const keySpan = document.createElement('span');
  keySpan.className = 'metadata-key';
  keySpan.textContent = key;
  
  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'metadata-value';
  valueInput.value = value;
  valueInput.setAttribute('data-key', key);
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'metadata-remove';
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  
  removeBtn.addEventListener('click', function() {
    fieldDiv.remove();
    updateElementProperties();
  });
  
  valueInput.addEventListener('change', function() {
    updateElementProperties();
  });
  
  fieldDiv.appendChild(keySpan);
  fieldDiv.appendChild(valueInput);
  fieldDiv.appendChild(removeBtn);
  container.appendChild(fieldDiv);
  
  return fieldDiv;
}

// Setup JSON editor functionality
export function setupJsonEditor() {
  const jsonTextarea = document.getElementById('jsonMetadataTextarea');
  const jsonApplyBtn = document.getElementById('jsonApplyBtn');
  
  jsonApplyBtn.addEventListener('click', function() {
    try {
      const jsonData = JSON.parse(jsonTextarea.value);
      updateMetadataFromJson(jsonData);
      showToast('JSON metadata applied successfully', 'success');
      
      // Switch back to simple editor
      document.querySelector('.metadata-tab[data-editor="simple"]').click();
    } catch (error) {
      showToast('Invalid JSON format', 'error');
      console.error('Error parsing JSON metadata:', error);
    }
  });
}

// Handle updating metadata in state when fields change
export function updateMetadataState() {
  const state = getState();
  const metadataInputs = document.querySelectorAll('.metadata-value');
  
  if (!state.selectedElementId) {
    return;
  }
  
  // Initialize metadata for element if not exists
  if (!state.metadataFields[state.selectedElementId]) {
    state.metadataFields[state.selectedElementId] = {};
  }
  
  // Update metadata in state
  metadataInputs.forEach(input => {
    const key = input.getAttribute('data-key');
    const value = input.value;
    state.metadataFields[state.selectedElementId][key] = value;
  });
}

// Apply metadata to SVG element
export function applyMetadataToElement(element, metadata) {
  if (!element) return;
  
  // Remove existing metadata attributes
  for (let attr of [...element.attributes]) {
    if (attr.name.startsWith('data-')) {
      element.removeAttribute(attr.name);
    }
  }
  
  // Remove existing metadata elements
  const metadataElement = element.querySelector('metadata');
  if (metadataElement) {
    while (metadataElement.firstChild) {
      metadataElement.removeChild(metadataElement.firstChild);
    }
  }
  
  // Add new metadata attributes and elements
  for (let key in metadata) {
    // Add as data attribute
    element.setAttribute(`data-${key}`, metadata[key]);
    
    // Add as metadata element
    if (!metadataElement) {
      const newMetadataEl = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
      element.appendChild(newMetadataEl);
    }
    
    const metaEl = element.querySelector('metadata') || element.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'metadata'));
    const dataEl = document.createElementNS('http://www.w3.org/2000/svg', key);
    dataEl.textContent = metadata[key];
    metaEl.appendChild(dataEl);
  }
}

// Add new metadata field
export function addNewMetadataField() {
  const state = getState();
  
  if (!state.selectedElement) {
    showToast('No element selected', 'error');
    return;
  }
  
  const metadataFields = document.getElementById('metadataFields');
  const metadataModal = document.getElementById('metadataModal');
  const metadataKey = document.getElementById('metadataKey');
  const metadataValue = document.getElementById('metadataValue');
  
  const key = metadataKey.value.trim();
  const value = metadataValue.value.trim();
  
  if (!key) {
    showToast('Metadata key cannot be empty', 'error');
    return;
  }
  
  // Create new field
  createMetadataField(metadataFields, key, value);
  
  // Update element properties
  updateElementProperties();
  
  // Clear form and hide modal
  metadataKey.value = '';
  metadataValue.value = '';
  metadataModal.style.display = 'none';
  
  showToast('Metadata field added', 'success');
}
