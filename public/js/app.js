document.addEventListener('DOMContentLoaded', function() {
  // State management
  const state = {
    selectedSvgFiles: [],
    selectedScriptFiles: [],
    selectedElementId: null,
    canvasContents: {},
    scriptContents: {},
    editorCurrentFile: null,
    editorCurrentType: null,
    selectedElement: null,
    filterText: '',
    metadataFields: {},
    scriptBindings: {},
    lastToast: null,
    selectedJsFiles: [],
    editorContent: {
      svg: {},
      script: {}
    }
  };

  // DOM elements
  const svgList = document.getElementById('svgList');
  const scriptList = document.getElementById('scriptList');
  const svgFileInput = document.getElementById('svgFileInput');
  const scriptFileInput = document.getElementById('scriptFileInput');
  const svgUploadBtn = document.getElementById('svgUploadBtn');
  const scriptUploadBtn = document.getElementById('scriptUploadBtn');
  const generateBtn = document.getElementById('generateBtn');
  const canvasContainer = document.getElementById('canvasContainer');
  const centerTabs = document.querySelectorAll('.center-tab');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const editorContainer = document.getElementById('editorContainer');
  const editorTextarea = document.getElementById('editorTextarea');
  const editorFileSelect = document.getElementById('editorFileSelect');
  const saveEditorBtn = document.getElementById('saveEditorBtn');
  const elementProperties = document.getElementById('elementProperties');
  const elementId = document.getElementById('elementId');
  const elementType = document.getElementById('elementType');
  const metadataContainer = document.getElementById('metadataContainer');
  const addMetadataBtn = document.getElementById('addMetadataBtn');
  const scriptBindingContainer = document.getElementById('scriptBindingContainer');
  const scriptSelect = document.getElementById('scriptSelect');
  const eventSelect = document.getElementById('eventSelect');
  const bindScriptBtn = document.getElementById('bindScriptBtn');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchInput = document.getElementById('searchInput');
  const notificationContainer = document.getElementById('notificationContainer') || createNotificationContainer();
  
  // Create notification container if it doesn't exist
  function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1000';
    document.body.appendChild(container);
    return container;
  }
  
  // Show toast notification
  function showToast(message, type = 'info', duration = 3000) {
    // Remove previous toast if it exists
    if (state.lastToast && state.lastToast.parentNode) {
      state.lastToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close">×</button>
    `;
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });
    
    notificationContainer.appendChild(toast);
    state.lastToast = toast;
    
    // Fade in
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    // Auto dismiss
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, duration);
  }

  // Add keyboard shortcuts
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
      // Ctrl+S to save current file in editor
      if (event.ctrlKey && event.key === 's' && state.editorCurrentFile) {
        event.preventDefault();
        saveEditorContent();
        showToast('File saved successfully', 'success');
      }
      
      // Ctrl+G to generate HTML
      if (event.ctrlKey && event.key === 'g') {
        event.preventDefault();
        if (state.selectedSvgFiles.length > 0) {
          generateHTML();
        } else {
          showToast('Please select at least one SVG file', 'error');
        }
      }
      
      // Ctrl+1 for preview tab
      if (event.ctrlKey && event.key === '1') {
        event.preventDefault();
        switchTab(0);
      }
      
      // Ctrl+2 for code editor tab
      if (event.ctrlKey && event.key === '2') {
        event.preventDefault();
        switchTab(1);
      }
    });
  }
  
  // Switch between tabs
  function switchTab(tabIndex) {
    tabBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === tabIndex);
    });
    centerTabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === tabIndex);
    });
  }
  
  // Setup drag and drop for file uploads
  function setupDragAndDrop() {
    const dropZones = [
      { element: document.querySelector('.left-panel'), type: 'all' },
      { element: document.getElementById('svgDropZone'), type: 'svg' },
      { element: document.getElementById('scriptDropZone'), type: 'script' }
    ];
    
    dropZones.forEach(zone => {
      if (!zone.element) return;
      
      zone.element.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.element.classList.add('drag-over');
      });
      
      zone.element.addEventListener('dragleave', () => {
        zone.element.classList.remove('drag-over');
      });
      
      zone.element.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.element.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;
        
        if (zone.type === 'svg' || zone.type === 'all') {
          const svgFiles = files.filter(f => f.name.endsWith('.svg'));
          if (svgFiles.length > 0) {
            uploadFiles(svgFiles, 'svg');
          }
        }
        
        if (zone.type === 'script' || zone.type === 'all') {
          const jsFiles = files.filter(f => f.name.endsWith('.js'));
          if (jsFiles.length > 0) {
            uploadFiles(jsFiles, 'script');
          }
        }
      });
    });
  }
  
  // Upload multiple files
  function uploadFiles(files, type) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append(type === 'svg' ? 'svg' : 'script', file);
    });
    
    showToast(`Uploading ${files.length} ${type} files...`, 'info');
    
    fetch(`/upload-${type}`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showToast(`${files.length} ${type} files uploaded successfully`, 'success');
        if (type === 'svg') {
          loadSvgFiles();
        } else {
          loadScriptFiles();
        }
      } else {
        showToast(`Error uploading ${type} files: ${data.error}`, 'error');
      }
    })
    .catch(error => {
      showToast(`Error uploading ${type} files: ${error.message}`, 'error');
      console.error('Error:', error);
    });
  }
  
  // Filter resource lists based on search input
  function filterResources() {
    const searchTerm = searchInput.value.toLowerCase();
    state.filterText = searchTerm;
    
    // Filter SVG list
    const svgItems = svgList.querySelectorAll('li');
    svgItems.forEach(item => {
      const fileName = item.textContent.toLowerCase();
      item.style.display = fileName.includes(searchTerm) ? '' : 'none';
    });
    
    // Filter Script list
    const scriptItems = scriptList.querySelectorAll('li');
    scriptItems.forEach(item => {
      const fileName = item.textContent.toLowerCase();
      item.style.display = fileName.includes(searchTerm) ? '' : 'none';
    });
    
    // Show/hide clear button
    clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
  }

  // DOM Elements
  const uploadSvgForm = document.getElementById('uploadSvgForm');
  const uploadJsForm = document.getElementById('uploadJsForm');
  const svgList = document.getElementById('svgList');
  const jsList = document.getElementById('jsList');
  const canvasContainer = document.getElementById('canvasContainer');
  const selectedSvgFilesList = document.getElementById('selectedSvgFiles');
  const selectedJsFilesList = document.getElementById('selectedJsFiles');
  const svgCode = document.getElementById('svgCode');
  const jsCode = document.getElementById('jsCode');
  const generateBtn = document.getElementById('generateBtn');
  const projectTitle = document.getElementById('projectTitle');
  const resultModal = document.getElementById('resultModal');
  const previewModal = document.getElementById('previewModal');
  const metadataModal = document.getElementById('metadataModal');
  const downloadLink = document.getElementById('downloadLink');
  const previewHtmlBtn = document.getElementById('previewHtmlBtn');
  const previewContent = document.getElementById('previewContent');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // New elements
  const centerTabButtons = document.querySelectorAll('.center-tab-btn');
  const centerTabContents = document.querySelectorAll('.center-tab-content');
  const editorFileSelector = document.getElementById('editorFileSelector');
  const codeEditorTextarea = document.getElementById('codeEditorTextarea');
  const saveEditorChanges = document.getElementById('saveEditorChanges');
  const elementId = document.getElementById('elementId');
  const elementType = document.getElementById('elementType');
  const metadataFields = document.getElementById('metadataFields');
  const addMetadataBtn = document.getElementById('addMetadataBtn');
  const scriptSelector = document.getElementById('scriptSelector');
  const eventSelector = document.getElementById('eventSelector');
  const applyBindingBtn = document.getElementById('applyBindingBtn');
  const updatePropertiesBtn = document.getElementById('updatePropertiesBtn');
  const addMetadataFieldBtn = document.getElementById('addMetadataFieldBtn');
  const propertiesContainer = document.querySelector('.properties-container');
  const noSelectionMessage = document.querySelector('.no-selection-message');

  // Event Listeners
  uploadSvgForm.addEventListener('submit', uploadResource);
  uploadJsForm.addEventListener('submit', uploadResource);
  svgList.addEventListener('click', handleResourceAction);
  jsList.addEventListener('click', handleResourceAction);
  generateBtn.addEventListener('click', generateInteractiveHTML);
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      resultModal.style.display = 'none';
      previewModal.style.display = 'none';
      metadataModal.style.display = 'none';
    });
  });

  // Tab functionality
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
    });
  });

  // Center tab functionality
  centerTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      centerTabButtons.forEach(btn => btn.classList.remove('active'));
      centerTabContents.forEach(content => content.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
    });
  });

  // Code editor functionality
  editorFileSelector.addEventListener('change', function() {
    loadFileToEditor(this.value);
  });

  saveEditorChanges.addEventListener('click', function() {
    saveEditorContent();
  });

  // Element properties functionality
  addMetadataBtn.addEventListener('click', function() {
    metadataModal.style.display = 'block';
  });

  addMetadataFieldBtn.addEventListener('click', function() {
    const key = document.getElementById('metadataKey').value.trim();
    const value = document.getElementById('metadataValue').value.trim();
    
    if (key && value) {
      addMetadataField(key, value);
      document.getElementById('metadataKey').value = '';
      document.getElementById('metadataValue').value = '';
      metadataModal.style.display = 'none';
    } else {
      alert('Both key and value are required!');
    }
  });

  updatePropertiesBtn.addEventListener('click', function() {
    updateElementProperties();
  });

  applyBindingBtn.addEventListener('click', function() {
    applyScriptBinding();
  });

  // Window click to close modal
  window.addEventListener('click', (event) => {
    if (event.target === resultModal) {
      resultModal.style.display = 'none';
    }
    if (event.target === previewModal) {
      previewModal.style.display = 'none';
    }
    if (event.target === metadataModal) {
      metadataModal.style.display = 'none';
    }
  });

  // Functions
  async function uploadResource(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const fileInput = e.target.querySelector('input[type="file"]');
    
    if (!fileInput.files.length) {
      alert('Please select a file to upload');
      return;
    }
    
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add the new file to the appropriate list
        if (result.type === 'svg') {
          addResourceToList(svgList, result.file, 'svg');
          // Add to editor file selector
          addFileToEditorSelector(result.file, 'svg');
        } else {
          addResourceToList(jsList, result.file, 'script');
          // Add to editor file selector and script selector
          addFileToEditorSelector(result.file, 'script');
          addFileToScriptSelector(result.file);
        }
        
        // Reset the form
        e.target.reset();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  }

  function addResourceToList(listElement, fileName, type) {
    // Check if this file already exists in the list
    const existingItem = listElement.querySelector(`[data-file="${fileName}"]`);
    if (existingItem) {
      return;
    }
    
    // Remove empty list message if present
    const emptyMsg = listElement.querySelector('.empty-list');
    if (emptyMsg) {
      emptyMsg.remove();
    }
    
    // Create the new list item
    const itemDiv = document.createElement('div');
    itemDiv.className = `resource-item ${type === 'svg' ? 'svg-item' : 'js-item'}`;
    itemDiv.dataset.file = fileName;
    
    itemDiv.innerHTML = `
      <span class="file-name">${fileName}</span>
      <div class="resource-actions">
        <button class="preview-btn" data-type="${type}" data-file="${fileName}">Preview</button>
        <button class="add-btn" data-type="${type}" data-file="${fileName}">Add</button>
      </div>
    `;
    
    listElement.appendChild(itemDiv);
  }

  function addFileToEditorSelector(fileName, type) {
    const option = document.createElement('option');
    option.value = `${type}:${fileName}`;
    option.textContent = `${type === 'svg' ? 'SVG: ' : 'JS: '}${fileName}`;
    editorFileSelector.appendChild(option);
  }

  function addFileToScriptSelector(fileName) {
    const option = document.createElement('option');
    option.value = fileName;
    option.textContent = fileName;
    scriptSelector.appendChild(option);
  }

  function handleResourceAction(e) {
    if (!e.target.matches('button')) return;
    
    const button = e.target;
    const fileItem = button.closest('.resource-item');
    const fileName = fileItem.dataset.file;
    const type = button.dataset.type;
    
    if (button.classList.contains('preview-btn')) {
      previewResource(type, fileName);
    } else if (button.classList.contains('add-btn')) {
      addResourceToCanvas(type, fileName);
    }
  }

  async function previewResource(type, fileName) {
    try {
      const response = await fetch(`/resource/${type}/${fileName}`);
      const content = await response.text();
      
      if (type === 'svg') {
        // For SVG, show the rendered SVG and its code
        previewContent.innerHTML = `
          <div class="svg-preview">${content}</div>
          <h4>SVG Code:</h4>
          <pre><code>${escapeHtml(content)}</code></pre>
        `;
        
        // Update the code preview in the right panel
        svgCode.textContent = content;
        
        // Switch to SVG tab
        document.querySelector('.tab-btn[data-tab="svgPreview"]').click();

        // Store in state
        state.editorContent.svg[fileName] = content;
      } else {
        // For JS, show the code
        previewContent.innerHTML = `<pre><code>${escapeHtml(content)}</code></pre>`;
        
        // Update the code preview in the right panel
        jsCode.textContent = content;
        
        // Switch to JS tab
        document.querySelector('.tab-btn[data-tab="jsPreview"]').click();

        // Store in state
        state.editorContent.script[fileName] = content;
      }
      
      previewModal.style.display = 'block';
    } catch (error) {
      console.error(`Error previewing ${type} file:`, error);
      alert(`Error loading ${type} file for preview.`);
    }
  }

  async function addResourceToCanvas(type, fileName) {
    if (type === 'svg') {
      // Only add if not already in selected list
      if (!state.selectedSvgFiles.includes(fileName)) {
        try {
          const response = await fetch(`/resource/${type}/${fileName}`);
          const content = await response.text();
          
          // Add to state
          state.selectedSvgFiles.push(fileName);
          
          // Add to selected list
          const listItem = document.createElement('li');
          listItem.innerHTML = `
            ${fileName}
            <button class="remove-btn" data-file="${fileName}" data-type="svg">&times;</button>
          `;
          selectedSvgFilesList.appendChild(listItem);
          
          // Add remove event listener
          listItem.querySelector('.remove-btn').addEventListener('click', removeResource);
          
          // Add to canvas
          addSvgToCanvas(fileName, content);
        } catch (error) {
          console.error('Error adding SVG to canvas:', error);
          alert('Error loading SVG file.');
        }
      }
    } else if (type === 'script') {
      // Only add if not already in selected list
      if (!state.selectedJsFiles.includes(fileName)) {
        try {
          const response = await fetch(`/resource/${type}/${fileName}`);
          const content = await response.text();
          
          // Add to state
          state.selectedJsFiles.push(fileName);
          
          // Add to selected list
          const listItem = document.createElement('li');
          listItem.innerHTML = `
            ${fileName}
            <button class="remove-btn" data-file="${fileName}" data-type="script">&times;</button>
          `;
          selectedJsFilesList.appendChild(listItem);
          
          // Add remove event listener
          listItem.querySelector('.remove-btn').addEventListener('click', removeResource);
          
          // Update code preview
          jsCode.textContent = content;
          document.querySelector('.tab-btn[data-tab="jsPreview"]').click();
        } catch (error) {
          console.error('Error adding JS file:', error);
          alert('Error loading JavaScript file.');
        }
      }
    }
  }

  function addSvgToCanvas(fileName, svgContent) {
    // Remove empty state if present
    const emptyState = canvasContainer.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }
    
    // Create wrapper for the SVG
    const wrapper = document.createElement('div');
    wrapper.className = 'svg-wrapper';
    wrapper.dataset.file = fileName;
    
    // Add the SVG content
    wrapper.innerHTML = svgContent;
    
    // Add a label
    const label = document.createElement('div');
    label.className = 'svg-label';
    label.textContent = fileName;
    wrapper.prepend(label);
    
    // Add event listeners for SVG elements
    const svgElement = wrapper.querySelector('svg');
    addSvgInteractivity(svgElement);
    
    // Add to the canvas container
    canvasContainer.appendChild(wrapper);
  }

  function addSvgInteractivity(svgElement) {
    // Find all interactive elements
    const interactiveElements = svgElement.querySelectorAll('rect, circle, path, ellipse, polygon, polyline, g');
    
    interactiveElements.forEach(element => {
      // Add click event to select element and show properties
      element.addEventListener('click', function(e) {
        e.stopPropagation();
        selectElement(element);
      });
      
      // Add hover effect
      element.addEventListener('mouseenter', function() {
        if (element !== state.selectedElement) {
          element.style.cursor = 'pointer';
          element.dataset.originalFill = element.getAttribute('fill');
          element.setAttribute('fill-opacity', '0.7');
        }
      });
      
      element.addEventListener('mouseleave', function() {
        if (element !== state.selectedElement) {
          element.setAttribute('fill-opacity', '1');
        }
      });
    });
  }

  function selectElement(element) {
    // Remove highlight from previously selected element
    if (state.selectedElement) {
      state.selectedElement.classList.remove('svg-element-highlight');
    }
    
    // Set new selected element
    state.selectedElement = element;
    
    // Add highlight
    element.classList.add('svg-element-highlight');
    
    // Show element properties
    showElementProperties(element);
  }

  function showElementProperties(element) {
    // Hide no selection message and show properties container
    noSelectionMessage.style.display = 'none';
    propertiesContainer.style.display = 'block';
    
    // Update element info
    elementId.value = element.id || 'No ID';
    elementType.value = element.tagName;
    
    // Clear existing metadata fields
    metadataFields.innerHTML = '';
    
    // Check for metadata in the element or parent SVG
    const svg = element.closest('svg');
    const metadata = svg.querySelector('metadata');
    
    if (metadata) {
      // Parse and display metadata fields
      for (const key in metadata.dataset) {
        addMetadataField(key, metadata.dataset[key]);
      }
    }
    
    // Update script binding selector
    updateScriptBindingSelectors(element);
  }

  function addMetadataField(key, value) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'metadata-field';
    fieldDiv.innerHTML = `
      <input type="text" class="metadata-key" value="${key}" readonly>
      <input type="text" class="metadata-value" value="${value}">
      <button class="remove-metadata-btn">&times;</button>
    `;
    
    // Add event listener to remove button
    fieldDiv.querySelector('.remove-metadata-btn').addEventListener('click', function() {
      fieldDiv.remove();
    });
    
    metadataFields.appendChild(fieldDiv);
  }

  function updateScriptBindingSelectors(element) {
    // Check if element has event listeners from our scripts
    scriptSelector.value = '';
    eventSelector.value = 'click';
    
    // If element has data-script and data-event attributes, select them
    if (element.dataset.script) {
      scriptSelector.value = element.dataset.script;
    }
    
    if (element.dataset.event) {
      eventSelector.value = element.dataset.event;
    }
  }

  function applyScriptBinding() {
    if (!state.selectedElement) return;
    
    const scriptFile = scriptSelector.value;
    const eventType = eventSelector.value;
    
    if (scriptFile) {
      // Store script binding in element data attributes
      state.selectedElement.dataset.script = scriptFile;
      state.selectedElement.dataset.event = eventType;
      
      alert(`Bound ${scriptFile} to ${state.selectedElement.tagName} on ${eventType} event`);
    } else {
      // Remove script binding
      delete state.selectedElement.dataset.script;
      delete state.selectedElement.dataset.event;
    }
  }

  function updateElementProperties() {
    if (!state.selectedElement) return;
    
    // Update element ID if changed and not empty
    const newId = elementId.value;
    if (newId && newId !== 'No ID') {
      state.selectedElement.id = newId;
    }
    
    // Update metadata in SVG
    const svg = state.selectedElement.closest('svg');
    let metadata = svg.querySelector('metadata');
    
    // Create metadata element if it doesn't exist
    if (!metadata) {
      metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
      svg.appendChild(metadata);
    }
    
    // Clear existing metadata
    while (metadata.hasChildNodes()) {
      metadata.removeChild(metadata.lastChild);
    }
    
    // Add all metadata fields to the element
    const metadataKeyValues = metadataFields.querySelectorAll('.metadata-field');
    metadataKeyValues.forEach(field => {
      const key = field.querySelector('.metadata-key').value;
      const value = field.querySelector('.metadata-value').value;
      
      if (key && value) {
        metadata.dataset[key] = value;
      }
    });
    
    alert('Element properties updated');
  }

  function removeResource(e) {
    const button = e.target;
    const fileName = button.dataset.file;
    const type = button.dataset.type;
    
    if (type === 'svg') {
      // Remove from state
      state.selectedSvgFiles = state.selectedSvgFiles.filter(file => file !== fileName);
      
      // Remove from selected list
      button.closest('li').remove();
      
      // Remove from canvas
      const svgWrapper = canvasContainer.querySelector(`.svg-wrapper[data-file="${fileName}"]`);
      if (svgWrapper) {
        svgWrapper.remove();
      }
      
      // Add empty state if no SVGs left
      if (state.selectedSvgFiles.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = '<p>Add SVG files from the left panel to see them here</p>';
        canvasContainer.appendChild(emptyState);
      }
    } else if (type === 'script') {
      // Remove from state
      state.selectedJsFiles = state.selectedJsFiles.filter(file => file !== fileName);
      
      // Remove from selected list
      button.closest('li').remove();
    }
  }

  async function loadFileToEditor(fileValue) {
    if (!fileValue) {
      codeEditorTextarea.value = '';
      saveEditorChanges.disabled = true;
      return;
    }
    
    const [type, fileName] = fileValue.split(':');
    
    try {
      // First check if we have this content in state
      if (state.editorContent[type] && state.editorContent[type][fileName]) {
        codeEditorTextarea.value = state.editorContent[type][fileName];
      } else {
        // Otherwise fetch from server
        const response = await fetch(`/resource/${type}/${fileName}`);
        const content = await response.text();
        
        codeEditorTextarea.value = content;
        
        // Store in state
        if (!state.editorContent[type]) {
          state.editorContent[type] = {};
        }
        state.editorContent[type][fileName] = content;
      }
      
      saveEditorChanges.disabled = false;
    } catch (error) {
      console.error('Error loading file to editor:', error);
      codeEditorTextarea.value = 'Error loading file.';
      saveEditorChanges.disabled = true;
    }
  }

  async function saveEditorContent() {
    const fileValue = editorFileSelector.value;
    
    if (!fileValue) {
      alert('No file selected');
      return;
    }
    
    const [type, fileName] = fileValue.split(':');
    const content = codeEditorTextarea.value;
    
    // Update content in state
    if (!state.editorContent[type]) {
      state.editorContent[type] = {};
    }
    state.editorContent[type][fileName] = content;
    
    // TODO: Add endpoint to save file content back to server
    alert('File edited in memory. Server-side save feature coming soon.');
  }

  async function generateInteractiveHTML() {
    if (state.selectedSvgFiles.length === 0) {
      alert('Please add at least one SVG file first');
      return;
    }
    
    try {
      // Prepare SVG files with their bindings
      const svgBindings = {};
      state.selectedSvgFiles.forEach(fileName => {
        const svgWrapper = canvasContainer.querySelector(`.svg-wrapper[data-file="${fileName}"]`);
        const elementBindings = [];
        
        if (svgWrapper) {
          const elements = svgWrapper.querySelectorAll('[data-script]');
          
          elements.forEach(element => {
            elementBindings.push({
              elementId: element.id || null,
              elementTag: element.tagName,
              scriptFile: element.dataset.script,
              eventType: element.dataset.event || 'click'
            });
          });
        }
        
        svgBindings[fileName] = elementBindings;
      });
      
      const response = await fetch('/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          svgFiles: state.selectedSvgFiles,
          scriptFiles: state.selectedJsFiles,
          title: projectTitle.value || 'Interactive SVG',
          bindings: svgBindings
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        downloadLink.href = result.downloadUrl;
        previewHtmlBtn.addEventListener('click', () => {
          window.open(result.downloadUrl, '_blank');
        });
        resultModal.style.display = 'block';
      }
    } catch (error) {
      console.error('Error generating HTML:', error);
      alert('Error generating interactive HTML file.');
    }
  }

  // Helper function to escape HTML
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initialize existing resources in editor selector
  function initializeEditorSelector() {
    // Add SVG files
    document.querySelectorAll('.svg-item').forEach(item => {
      const fileName = item.dataset.file;
      addFileToEditorSelector(fileName, 'svg');
    });
    
    // Add JS files
    document.querySelectorAll('.js-item').forEach(item => {
      const fileName = item.dataset.file;
      addFileToEditorSelector(fileName, 'script');
      addFileToScriptSelector(fileName);
    });
  }

  // Call initialization functions
  initializeEditorSelector();
  
  // Handle metadata tab switching
  function setupMetadataTabs() {
    const tabs = document.querySelectorAll('.metadata-tab');
    const editors = document.querySelectorAll('.metadata-editor');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update active tab
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        
        // Show appropriate editor
        editors.forEach(editor => {
          const isActive = editor.id === targetTab + 'MetadataEditor';
          editor.classList.toggle('active', isActive);
        });
        
        // If switching to JSON tab, update JSON content from simple view
        if (targetTab === 'json' && state.selectedElement) {
          updateJsonFromMetadata();
        }
        
        // If switching to simple tab, update from JSON if valid
        if (targetTab === 'simple' && state.selectedElement) {
          const jsonEditor = document.getElementById('jsonMetadataTextarea');
          try {
            const jsonData = JSON.parse(jsonEditor.value);
            updateMetadataFromJson(jsonData);
          } catch (error) {
            // If JSON is invalid, don't update simple view
            console.error('Invalid JSON, not updating simple view:', error);
          }
        }
      });
    });
  }
  
  // Convert metadata to JSON and update the JSON editor
  function updateJsonFromMetadata() {
    const element = state.selectedElement;
    if (!element) return;
    
    // Get metadata from state or element
    let metadata = state.metadataFields[element.id] || {};
    
    // If no metadata in state, try to extract from element
    if (Object.keys(metadata).length === 0) {
      const metadataElement = element.querySelector('metadata') || element.closest('svg').querySelector('metadata');
      if (metadataElement) {
        // Extract from data attributes
        Array.from(metadataElement.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .forEach(attr => {
            const key = attr.name.replace('data-', '');
            metadata[key] = attr.value;
          });
        
        // Also check for child elements that might contain metadata
        Array.from(metadataElement.children).forEach(child => {
          if (child.tagName.startsWith('data-')) {
            const key = child.tagName.replace('data-', '');
            metadata[key] = child.textContent;
          }
        });
      }
    }
    
    // Format the JSON for display
    const jsonString = JSON.stringify(metadata, null, 2);
    const jsonEditor = document.getElementById('jsonMetadataTextarea');
    jsonEditor.value = jsonString;
  }
  
  // Parse JSON from the editor and update metadata fields
  function updateMetadataFromJson(jsonData) {
    const element = state.selectedElement;
    if (!element) return;
    
    // Clear existing metadata fields
    const metadataContainer = document.getElementById('metadataContainer');
    metadataContainer.innerHTML = '';
    
    // Update state
    state.metadataFields[element.id] = jsonData;
    
    // Recreate metadata fields in simple view
    Object.entries(jsonData).forEach(([key, value]) => {
      // Create a new field for each entry
      createMetadataField(metadataContainer, key, value);
    });
    
    // Apply metadata to the element
    applyMetadataToElement(element, jsonData);
  }
  
  // Create a metadata field in the simple editor
  function createMetadataField(container, key, value) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'metadata-field';
    
    // Key input
    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'metadata-key-input';
    keyInput.value = key;
    keyInput.placeholder = 'Key';
    
    // Value input
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'metadata-value-input';
    valueInput.value = value;
    valueInput.placeholder = 'Value';
    
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.title = 'Remove field';
    removeBtn.addEventListener('click', function() {
      container.removeChild(fieldDiv);
      updateMetadataState();
    });
    
    // Add all elements to the field div
    fieldDiv.appendChild(keyInput);
    fieldDiv.appendChild(valueInput);
    fieldDiv.appendChild(removeBtn);
    
    // Add change listeners to update state
    keyInput.addEventListener('change', updateMetadataState);
    valueInput.addEventListener('change', updateMetadataState);
    
    // Add to container
    container.appendChild(fieldDiv);
    
    return fieldDiv;
  }
  
  // Setup JSON editor functionality
  function setupJsonEditor() {
    const validateBtn = document.getElementById('validateJsonBtn');
    const applyBtn = document.getElementById('applyJsonBtn');
    const formatBtn = document.getElementById('formatJsonBtn');
    const jsonEditor = document.getElementById('jsonMetadataTextarea');
    const jsonError = document.getElementById('jsonError');
    
    // Validate JSON
    validateBtn.addEventListener('click', function() {
      try {
        const json = JSON.parse(jsonEditor.value);
        jsonError.classList.remove('visible');
        jsonError.textContent = '';
        showToast('JSON is valid', 'success');
        return json;
      } catch (error) {
        jsonError.classList.add('visible');
        jsonError.textContent = `Error: ${error.message}`;
        showToast('Invalid JSON', 'error');
        return null;
      }
    });
    
    // Apply JSON to metadata
    applyBtn.addEventListener('click', function() {
      const json = validateBtn.click();
      if (json) {
        updateMetadataFromJson(json);
        showToast('Metadata updated', 'success');
      }
    });
    
    // Format JSON
    formatBtn.addEventListener('click', function() {
      try {
        const json = JSON.parse(jsonEditor.value);
        const formatted = JSON.stringify(json, null, 2);
        jsonEditor.value = formatted;
        jsonError.classList.remove('visible');
        showToast('JSON formatted', 'success');
      } catch (error) {
        jsonError.classList.add('visible');
        jsonError.textContent = `Error: ${error.message}`;
        showToast('Cannot format invalid JSON', 'error');
      }
    });
  }
  
  // Handle updating metadata in state when fields change
  function updateMetadataState() {
    const element = state.selectedElement;
    if (!element) return;
    
    // Get all metadata fields
    const metadataContainer = document.getElementById('metadataContainer');
    const fields = metadataContainer.querySelectorAll('.metadata-field');
    
    // Build metadata object
    const metadata = {};
    fields.forEach(field => {
      const keyInput = field.querySelector('.metadata-key-input');
      const valueInput = field.querySelector('.metadata-value-input');
      
      if (keyInput.value) {
        metadata[keyInput.value] = valueInput.value;
      }
    });
    
    // Update state
    state.metadataFields[element.id] = metadata;
    
    // Apply to element
    applyMetadataToElement(element, metadata);
  }
  
  // Apply metadata to SVG element
  function applyMetadataToElement(element, metadata) {
    if (!element) return;
    
    // Find or create metadata element
    let metadataElement = element.querySelector('metadata');
    if (!metadataElement) {
      // If not found on the element, look in the parent SVG
      const svg = element.closest('svg');
      metadataElement = svg.querySelector('metadata');
      
      // If still not found, create one
      if (!metadataElement) {
        metadataElement = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
        svg.insertBefore(metadataElement, svg.firstChild);
      }
    }
    
    // Clear existing data attributes and child elements
    Array.from(metadataElement.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .forEach(attr => {
        metadataElement.removeAttribute(attr.name);
      });
    
    while (metadataElement.firstChild) {
      metadataElement.removeChild(metadataElement.firstChild);
    }
    
    // Add new metadata as both attributes and child elements
    Object.entries(metadata).forEach(([key, value]) => {
      // As data attribute
      metadataElement.setAttribute(`data-${key}`, value);
      
      // As child element
      const dataElement = document.createElementNS('http://www.w3.org/2000/svg', `data-${key}`);
      dataElement.textContent = value;
      metadataElement.appendChild(dataElement);
    });
  }
  
  // Enhance existing addNewMetadataField function
  function addNewMetadataField() {
    const metadataContainer = document.getElementById('metadataContainer');
    
    // Clear the "No metadata" message if it exists
    const noMetadataMsg = metadataContainer.querySelector('.no-metadata');
    if (noMetadataMsg) {
      metadataContainer.innerHTML = '';
    }
    
    // Create and add new field
    const newField = createMetadataField(metadataContainer, '', '');
    
    // Focus the key input of the new field
    const keyInput = newField.querySelector('.metadata-key-input');
    keyInput.focus();
    
    // Update metadata state
    updateMetadataState();
  }

  // Initialize app with enhanced features
  function init() {
    // Load resources
    loadSvgFiles();
    loadScriptFiles();
    
    // Setup UI components
    setupMetadataTabs();
    setupJsonEditor();
    
    // Rest of initialization...
    // Load resources
    loadSvgFiles();
    loadScriptFiles();
    
    // Setup event listeners
    svgFileInput.addEventListener('change', function() {
      if (this.files.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < this.files.length; i++) {
          formData.append('svg', this.files[i]);
        }
        
        fetch('/upload-svg', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showToast('SVG files uploaded successfully', 'success');
            loadSvgFiles();
          } else {
            showToast('Error uploading SVG: ' + data.error, 'error');
          }
          svgFileInput.value = '';
        })
        .catch(error => {
          showToast('Error uploading SVG', 'error');
          console.error('Error:', error);
          svgFileInput.value = '';
        });
      }
    });

    scriptFileInput.addEventListener('change', function() {
      if (this.files.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < this.files.length; i++) {
          formData.append('script', this.files[i]);
        }
        
        fetch('/upload-script', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            showToast('JavaScript files uploaded successfully', 'success');
            loadScriptFiles();
          } else {
            showToast('Error uploading JavaScript: ' + data.error, 'error');
          }
          scriptFileInput.value = '';
        })
        .catch(error => {
          showToast('Error uploading JavaScript', 'error');
          console.error('Error:', error);
          scriptFileInput.value = '';
        });
      }
    });

    svgUploadBtn.addEventListener('click', () => svgFileInput.click());
    scriptUploadBtn.addEventListener('click', () => scriptFileInput.click());
    
    generateBtn.addEventListener('click', generateHTML);
    
    // Tab switching
    tabBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        switchTab(index);
      });
    });
    
    // Editor save button
    saveEditorBtn.addEventListener('click', saveEditorContent);
    
    // Add metadata button
    addMetadataBtn.addEventListener('click', addNewMetadataField);
    
    // Bind script button
    bindScriptBtn.addEventListener('click', bindScriptToElement);
    
    // Search and filter
    searchInput.addEventListener('input', filterResources);
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      filterResources();
    });
    
    // Setup additional features
    setupKeyboardShortcuts();
    setupDragAndDrop();
    
    // Show initial help toast
    setTimeout(() => {
      showToast('Tip: Drag and drop files to upload, use Ctrl+S to save, Ctrl+G to generate HTML', 'info', 6000);
    }, 1000);
  }

  // Call initialize function
  init();
});
