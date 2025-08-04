// canvas-handlers.js - Functions for handling SVG canvas operations

import { getState } from './state.js';
import { showToast } from './ui-utils.js';

// Preview a resource in the preview tab
export function previewResource(type, fileName) {
  const state = getState();
  const canvasContainer = document.getElementById('canvasContainer');
  
  // Switch to preview tab
  document.querySelector('[data-tab="preview"]').click();
  
  if (type === 'svg') {
    // Fetch SVG content if not in state
    if (!state.canvasContents[fileName]) {
      fetch(`/resource/svg/${fileName}`)
        .then(response => response.text())
        .then(content => {
          state.canvasContents[fileName] = content;
          canvasContainer.innerHTML = content;
          addSvgInteractivity(canvasContainer.querySelector('svg'));
        })
        .catch(error => {
          console.error(`Error loading SVG file ${fileName}:`, error);
          showToast(`Error loading SVG file ${fileName}`, 'error');
        });
    } else {
      canvasContainer.innerHTML = state.canvasContents[fileName];
      addSvgInteractivity(canvasContainer.querySelector('svg'));
    }
  } else if (type === 'script') {
    // Just display the script name in preview
    canvasContainer.innerHTML = `<div class="script-preview">
      <h3>Script Preview</h3>
      <p>File: ${fileName}</p>
      <p>Preview not available for script files. Please use the Code tab to view and edit.</p>
    </div>`;
  }
}

// Add a resource to the canvas
export function addResourceToCanvas(type, fileName) {
  const state = getState();
  
  if (type === 'svg') {
    // Check if SVG is already selected
    if (state.selectedSvgFiles.includes(fileName)) {
      showToast(`SVG file ${fileName} is already selected`, 'info');
      return;
    }
    
    // Fetch SVG content if not in state
    if (!state.canvasContents[fileName]) {
      fetch(`/resource/svg/${fileName}`)
        .then(response => response.text())
        .then(content => {
          state.canvasContents[fileName] = content;
          addSvgToCanvas(fileName, content);
          state.selectedSvgFiles.push(fileName);
        })
        .catch(error => {
          console.error(`Error loading SVG file ${fileName}:`, error);
          showToast(`Error loading SVG file ${fileName}`, 'error');
        });
    } else {
      addSvgToCanvas(fileName, state.canvasContents[fileName]);
      state.selectedSvgFiles.push(fileName);
    }
  } else if (type === 'script') {
    // Check if script is already selected
    if (state.selectedScriptFiles.includes(fileName)) {
      showToast(`Script file ${fileName} is already selected`, 'info');
      return;
    }
    
    // Fetch script content if not in state
    if (!state.scriptContents[fileName]) {
      fetch(`/resource/script/${fileName}`)
        .then(response => response.text())
        .then(content => {
          state.scriptContents[fileName] = content;
          state.selectedScriptFiles.push(fileName);
          showToast(`Script file ${fileName} added`, 'success');
        })
        .catch(error => {
          console.error(`Error loading script file ${fileName}:`, error);
          showToast(`Error loading script file ${fileName}`, 'error');
        });
    } else {
      state.selectedScriptFiles.push(fileName);
      showToast(`Script file ${fileName} added`, 'success');
    }
  }
}

// Add SVG to canvas
export function addSvgToCanvas(fileName, svgContent) {
  const canvasContainer = document.getElementById('canvasContainer');
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');
  
  // Add data-filename attribute
  svgElement.setAttribute('data-filename', fileName);
  
  // Ensure SVG has an ID
  if (!svgElement.id) {
    svgElement.id = `svg-${Date.now()}`;
  }
  
  // Append SVG to canvas container
  canvasContainer.appendChild(svgElement);
  
  // Add interactivity
  addSvgInteractivity(svgElement);
  
  showToast(`SVG file ${fileName} added to canvas`, 'success');
}

// Add interactivity to SVG elements
export function addSvgInteractivity(svgElement) {
  // Find all child elements
  const elements = svgElement.querySelectorAll('*');
  
  elements.forEach(element => {
    // Skip elements without ID
    if (!element.id) return;
    
    // Add click event
    element.addEventListener('click', function(e) {
      e.stopPropagation();
      selectElement(element);
    });
    
    // Add hover effect
    element.addEventListener('mouseenter', function() {
      this.dataset.originalStroke = this.getAttribute('stroke');
      this.dataset.originalStrokeWidth = this.getAttribute('stroke-width');
      this.setAttribute('stroke', '#ff6700');
      this.setAttribute('stroke-width', '2');
    });
    
    element.addEventListener('mouseleave', function() {
      this.setAttribute('stroke', this.dataset.originalStroke || 'none');
      this.setAttribute('stroke-width', this.dataset.originalStrokeWidth || '1');
    });
  });
}

// Select an element in the SVG canvas
export function selectElement(element) {
  const state = getState();
  
  // Deselect previously selected element
  if (state.selectedElement) {
    state.selectedElement.classList.remove('selected');
  }
  
  // Select new element
  element.classList.add('selected');
  state.selectedElement = element;
  state.selectedElementId = element.id;
  
  // Show element properties
  showElementProperties(element);
}

// Show properties of selected element
export function showElementProperties(element) {
  const elementProperties = document.getElementById('elementProperties');
  const elementId = document.getElementById('elementId');
  const metadataContainer = document.getElementById('metadataContainer');
  const metadataFields = document.getElementById('metadataFields');
  
  // Display element ID
  elementId.textContent = element.id;
  
  // Clear previous metadata
  metadataFields.innerHTML = '';
  
  // Show element properties section
  elementProperties.classList.add('active');
  
  // Get metadata from element
  const metadata = {};
  
  // Get attributes
  for (let attr of element.attributes) {
    if (attr.name.startsWith('data-')) {
      const key = attr.name.substring(5);
      metadata[key] = attr.value;
    }
  }
  
  // Get metadata elements
  const metadataElements = element.querySelectorAll('metadata > *');
  metadataElements.forEach(metaEl => {
    const key = metaEl.tagName;
    const value = metaEl.textContent;
    metadata[key] = value;
  });
  
  // Display metadata
  for (let key in metadata) {
    addMetadataField(key, metadata[key]);
  }
  
  // Update script binding selectors
  updateScriptBindingSelectors(element);
}

// Add metadata field to UI
export function addMetadataField(key, value) {
  const metadataFields = document.getElementById('metadataFields');
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
  metadataFields.appendChild(fieldDiv);
}

// Update script binding selectors
export function updateScriptBindingSelectors(element) {
  const scriptSelect = document.getElementById('scriptSelect');
  const eventSelect = document.getElementById('eventSelect');
  const state = getState();
  
  // Get current bindings for this element
  const elementBindings = state.scriptBindings[element.id] || {};
  
  // Update script selector
  scriptSelect.innerHTML = '<option value="">Select a script</option>';
  state.selectedScriptFiles.forEach(script => {
    const option = document.createElement('option');
    option.value = script;
    option.textContent = script;
    scriptSelect.appendChild(option);
  });
  
  // Set initial values if binding exists
  if (elementBindings.script) {
    scriptSelect.value = elementBindings.script;
  }
  
  if (elementBindings.event) {
    eventSelect.value = elementBindings.event;
  }
}

// Apply script binding to selected element
export function applyScriptBinding() {
  const state = getState();
  const scriptSelect = document.getElementById('scriptSelect');
  const eventSelect = document.getElementById('eventSelect');
  
  if (!state.selectedElement) {
    showToast('No element selected', 'error');
    return;
  }
  
  const script = scriptSelect.value;
  const event = eventSelect.value;
  
  if (!script || !event) {
    showToast('Script and event must be selected', 'error');
    return;
  }
  
  // Store binding in state
  if (!state.scriptBindings[state.selectedElementId]) {
    state.scriptBindings[state.selectedElementId] = {};
  }
  
  state.scriptBindings[state.selectedElementId].script = script;
  state.scriptBindings[state.selectedElementId].event = event;
  
  showToast(`Binding applied: ${script} on ${event} for ${state.selectedElementId}`, 'success');
}
