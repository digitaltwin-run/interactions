/**
 * Pump Component Interaction Logic
 * 
 * This script provides interactive functionality for pump SVG components.
 * It handles state changes, click events, and visual updates.
 */

// Initialize a pump component when loaded
function initPump(pumpElement) {
  if (!pumpElement) return;
  
  console.log('Initializing pump component:', pumpElement.id || 'unnamed');
  
  // Find the main pump parts by their IDs or classes
  const pumpBody = pumpElement.querySelector('.pump-body, #pumpBody');
  const impeller = pumpElement.querySelector('.impeller, #impeller');
  const statusLight = pumpElement.querySelector('.status-light, #statusLight');
  
  // Initialize metadata if not present
  const metadata = pumpElement.querySelector('metadata') || 
                   createMetadata(pumpElement, {
                     state: 'off',
                     flowRate: '0',
                     pressure: '0',
                     temperature: '25',
                     alerts: ''
                   });
  
  // Set initial visual state
  updatePumpVisualState(pumpElement);
  
  // Add click event listener
  pumpElement.addEventListener('click', function(e) {
    // Toggle pump state on click
    const currentState = getMetadataValue(pumpElement, 'state');
    const newState = currentState === 'on' ? 'off' : 'on';
    
    // Update metadata
    setMetadataValue(pumpElement, 'state', newState);
    
    // Visual update will be handled by the MutationObserver in the main HTML
    console.log(`Pump ${pumpElement.id || 'unnamed'} state changed to: ${newState}`);
  });
  
  // Setup animation if pump is already on
  if (getMetadataValue(pumpElement, 'state') === 'on') {
    startPumpAnimation(impeller);
  }
}

// Update the pump's visual state based on metadata
function updatePump(pumpElement) {
  if (!pumpElement) return;
  
  updatePumpVisualState(pumpElement);
  console.log(`Pump ${pumpElement.id || 'unnamed'} updated`);
}

// Helper function to update the visual state
function updatePumpVisualState(pumpElement) {
  const state = getMetadataValue(pumpElement, 'state') || 'off';
  const alerts = getMetadataValue(pumpElement, 'alerts') || '';
  
  const impeller = pumpElement.querySelector('.impeller, #impeller');
  const statusLight = pumpElement.querySelector('.status-light, #statusLight');
  const pumpBody = pumpElement.querySelector('.pump-body, #pumpBody');
  
  // Update status light color
  if (statusLight) {
    if (alerts) {
      // Red for alerts
      statusLight.setAttribute('fill', '#ff0000');
    } else if (state === 'on') {
      // Green for running
      statusLight.setAttribute('fill', '#00ff00');
    } else {
      // Gray for off
      statusLight.setAttribute('fill', '#888888');
    }
  }
  
  // Start or stop animation based on state
  if (state === 'on') {
    startPumpAnimation(impeller);
  } else {
    stopPumpAnimation(impeller);
  }
}

// Helper function to start impeller animation
function startPumpAnimation(impeller) {
  if (!impeller) return;
  
  // Create animation if it doesn't exist
  if (!impeller.querySelector('animateTransform')) {
    const animateTransform = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    animateTransform.setAttribute('attributeName', 'transform');
    animateTransform.setAttribute('type', 'rotate');
    animateTransform.setAttribute('dur', '1s');
    animateTransform.setAttribute('repeatCount', 'indefinite');
    
    // Get center coordinates for rotation
    const bbox = impeller.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    
    animateTransform.setAttribute('from', `0 ${centerX} ${centerY}`);
    animateTransform.setAttribute('to', `360 ${centerX} ${centerY}`);
    
    impeller.appendChild(animateTransform);
  }
}

// Helper function to stop impeller animation
function stopPumpAnimation(impeller) {
  if (!impeller) return;
  
  // Remove any animation elements
  const animation = impeller.querySelector('animateTransform');
  if (animation) {
    animation.remove();
  }
}

// Helper function to create metadata element if it doesn't exist
function createMetadata(element, initialData = {}) {
  if (!element) return null;
  
  // Create the metadata element
  const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
  
  // Add initial data
  for (const [key, value] of Object.entries(initialData)) {
    const dataElement = document.createElementNS('http://www.w3.org/2000/svg', 'data');
    dataElement.setAttribute('key', key);
    dataElement.textContent = value;
    metadata.appendChild(dataElement);
  }
  
  // Add to the SVG element
  element.appendChild(metadata);
  return metadata;
}

// Helper function to get a value from metadata
function getMetadataValue(element, key) {
  if (!element) return null;
  
  const metadata = element.querySelector('metadata');
  if (!metadata) return null;
  
  const dataElement = metadata.querySelector(`data[key="${key}"]`);
  return dataElement ? dataElement.textContent : null;
}

// Helper function to set a value in metadata
function setMetadataValue(element, key, value) {
  if (!element) return;
  
  let metadata = element.querySelector('metadata');
  
  // Create metadata if it doesn't exist
  if (!metadata) {
    metadata = createMetadata(element);
  }
  
  // Look for existing data element with this key
  let dataElement = metadata.querySelector(`data[key="${key}"]`);
  
  // Create it if it doesn't exist
  if (!dataElement) {
    dataElement = document.createElementNS('http://www.w3.org/2000/svg', 'data');
    dataElement.setAttribute('key', key);
    metadata.appendChild(dataElement);
  }
  
  // Set the value
  dataElement.textContent = value;
}
