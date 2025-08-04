// app.js - Main application file integrating all modules
document.addEventListener('DOMContentLoaded', function() {
  // Import modules
  import('./modules/state.js').then(({ getState }) => {
    const state = getState();
    
    // Import all other modules
    Promise.all([
      import('./modules/ui-utils.js'),
      import('./modules/file-handlers.js'),
      import('./modules/canvas-handlers.js'),
      import('./modules/metadata-editor.js'),
      import('./modules/code-editor.js'),
      import('./modules/examples-handler.js')
    ]).then(([
      { createNotificationContainer, showToast, switchTab, filterResources, escapeHtml },
      { setupDragAndDrop, uploadFiles, uploadResource, addResourceToList, addFileToEditorSelector, 
        addFileToScriptSelector, handleResourceAction, removeResource },
      { previewResource, addResourceToCanvas, addSvgToCanvas, addSvgInteractivity, 
        selectElement, showElementProperties, addMetadataField, updateScriptBindingSelectors, applyScriptBinding },
      { updateElementProperties, setupMetadataTabs, updateJsonFromMetadata, updateMetadataFromJson,
        createMetadataField, setupJsonEditor, updateMetadataState, applyMetadataToElement, addNewMetadataField },
      { loadFileToEditor, saveEditorContent, initializeEditorSelector },
      { handleExampleAction, viewExampleFile, copyExampleFile, openExampleFile }
    ]) => {
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
      const fileSelector = document.getElementById('fileSelector');
      const codeEditor = document.getElementById('codeEditor');
      const saveCodeBtn = document.getElementById('saveCodeBtn');
      const metadataFields = document.getElementById('metadataFields');
      const scriptSelector = document.getElementById('scriptSelector');
      const eventSelector = document.getElementById('eventSelector');
      const bindScriptBtn = document.getElementById('bindScriptBtn');
      const clearSearchBtn = document.getElementById('clearSearchBtn');
      const searchInput = document.getElementById('searchInput');
      const notificationContainer = document.getElementById('notificationContainer') || createNotificationContainer();
      const addMetadataFieldBtn = document.getElementById('addMetadataField');
      
      // Create notification container if it doesn't exist
      if (!notificationContainer) {
        createNotificationContainer();
      }

      // Setup keyboard shortcuts
      function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
          // Ctrl+S to save current file
          if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (!saveCodeBtn.disabled) {
              saveEditorContent();
            }
          }
          
          // Ctrl+G to generate HTML
          if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            generateInteractiveHTML();
          }
          
          // Ctrl+1 to switch to canvas tab
          if (e.ctrlKey && e.key === '1') {
            e.preventDefault();
            switchTab(0);
          }
          
          // Ctrl+2 to switch to code tab
          if (e.ctrlKey && e.key === '2') {
            e.preventDefault();
            switchTab(1);
          }
        });
      }

      // Generate interactive HTML with SVG and scripts
      function generateInteractiveHTML() {
        if (state.selectedSvgFiles.length === 0) {
          showToast('No SVG files selected', 'error');
          return;
        }
        
        // Create form data for generation
        const formData = new FormData();
        formData.append('svgFiles', JSON.stringify(state.selectedSvgFiles));
        formData.append('scriptFiles', JSON.stringify(state.selectedScriptFiles));
        formData.append('scriptBindings', JSON.stringify(state.scriptBindings));
        formData.append('metadata', JSON.stringify(state.metadataFields));
        
        // Generate HTML
        fetch('/generate', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Open generated HTML in new tab
            window.open(`/generated/${data.filename}`, '_blank');
            showToast('HTML generated successfully', 'success');
          } else {
            showToast('Error generating HTML', 'error');
          }
        })
        .catch(error => {
          console.error('Error generating HTML:', error);
          showToast('Error generating HTML', 'error');
        });
      }

      // Initialize app with all event listeners
      function init() {
        // Add event listeners for tab switching
        tabBtns.forEach((btn, index) => {
          btn.addEventListener('click', function() {
            switchTab(index);
          });
        });
        
        // Center tab functionality
        const centerTabButtons = document.querySelectorAll('.center-tab-btn');
        const centerTabContents = document.querySelectorAll('.center-tab-content');
        
        centerTabButtons.forEach((button, index) => {
          button.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            centerTabButtons.forEach(btn => btn.classList.remove('active'));
            centerTabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            centerTabContents[index].classList.add('active');
          });
        });
        
        // Set up resource actions
        document.querySelectorAll('#svgList, #scriptList').forEach(list => {
          list.addEventListener('click', handleResourceAction);
        });
        
        // Set up file input handlers
        svgUploadBtn.addEventListener('click', () => svgFileInput.click());
        scriptUploadBtn.addEventListener('click', () => scriptFileInput.click());
        
        // Set up file upload handlers
        svgFileInput.addEventListener('change', () => {
          if (svgFileInput.files.length > 0) {
            uploadFiles(svgFileInput.files, 'svg');
            svgFileInput.value = '';
          }
        });
        
        scriptFileInput.addEventListener('change', () => {
          if (scriptFileInput.files.length > 0) {
            uploadFiles(scriptFileInput.files, 'script');
            scriptFileInput.value = '';
          }
        });
        
        // Set up form submission handlers
        document.getElementById('uploadSvgForm').addEventListener('submit', uploadResource);
        document.getElementById('uploadJsForm').addEventListener('submit', uploadResource);
        
        // Set up search functionality
        searchInput.addEventListener('input', filterResources);
        clearSearchBtn.addEventListener('click', function() {
          searchInput.value = '';
          filterResources();
        });
        
        // Set up generate button
        generateBtn.addEventListener('click', generateInteractiveHTML);
        
        // Setup drag and drop
        setupDragAndDrop();
        
        // Set up file selector
        fileSelector.addEventListener('change', function() {
          loadFileToEditor(this.value);
        });
        
        // Set up save button
        saveCodeBtn.addEventListener('click', function() {
          saveEditorContent();
        });
        
        // Element properties functionality
        addMetadataFieldBtn.addEventListener('click', function() {
          document.getElementById('metadataModal').style.display = 'block';
        });
        
        document.getElementById('addMetadataFieldBtn').addEventListener('click', function() {
          addNewMetadataField();
        });
        
        document.getElementById('cancelMetadataBtn').addEventListener('click', function() {
          document.getElementById('metadataModal').style.display = 'none';
        });
        
        // Set up script binding
        bindScriptBtn.addEventListener('click', applyScriptBinding);
        
        // Set up metadata modal close on click outside
        window.addEventListener('click', function(e) {
          if (e.target === document.getElementById('metadataModal')) {
            document.getElementById('metadataModal').style.display = 'none';
          }
        });
        
        // Set up metadata tabs
        setupMetadataTabs();
        
        // Set up JSON editor
        setupJsonEditor();
        
        // Set up keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Initialize editor selector
        initializeEditorSelector();
        
        // Add event listeners for example files
        document.addEventListener('click', function(e) {
          if (e.target.closest('[data-action="view-example"], [data-action="copy-example"], [data-action="open-example"]')) {
            handleExampleAction(e);
          }
        });
        
        // Setup mobile menu toggle
        document.getElementById('mobileMenuToggle').addEventListener('click', function() {
          document.body.classList.toggle('resources-open');
        });
        
        document.getElementById('mobilePropertiesToggle').addEventListener('click', function() {
          document.body.classList.toggle('properties-open');
        });
        
        // Show welcome message
        showToast('Welcome to Digital Twin Interactions IDE', 'info', 5000);
      }
      
      // Call initialize function
      init();
    }).catch(error => {
      console.error('Error loading modules:', error);
    });
  }).catch(error => {
    console.error('Error loading state module:', error);
  });
});
