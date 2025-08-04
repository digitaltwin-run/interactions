document.addEventListener('DOMContentLoaded', function() {
  // State management for selected resources
  const state = {
    selectedSvgFiles: [],
    selectedJsFiles: []
  };

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
  const downloadLink = document.getElementById('downloadLink');
  const previewHtmlBtn = document.getElementById('previewHtmlBtn');
  const previewContent = document.getElementById('previewContent');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

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

  // Window click to close modal
  window.addEventListener('click', (event) => {
    if (event.target === resultModal) {
      resultModal.style.display = 'none';
    }
    if (event.target === previewModal) {
      previewModal.style.display = 'none';
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
        } else {
          addResourceToList(jsList, result.file, 'script');
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
      } else {
        // For JS, show the code
        previewContent.innerHTML = `<pre><code>${escapeHtml(content)}</code></pre>`;
        
        // Update the code preview in the right panel
        jsCode.textContent = content;
        
        // Switch to JS tab
        document.querySelector('.tab-btn[data-tab="jsPreview"]').click();
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
    
    // Add to the canvas container
    canvasContainer.appendChild(wrapper);
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

  async function generateInteractiveHTML() {
    if (state.selectedSvgFiles.length === 0) {
      alert('Please add at least one SVG file first');
      return;
    }
    
    try {
      const response = await fetch('/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          svgFiles: state.selectedSvgFiles,
          scriptFiles: state.selectedJsFiles,
          title: projectTitle.value || 'Interactive SVG'
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
});
