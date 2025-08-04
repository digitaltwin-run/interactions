/**
 * Tank component JavaScript handlers
 * Provides interactive functionality for the tank SVG component
 */

// Initialize tank component
function initTank(svg, data) {
  console.log('Initializing tank component');
  
  // Get metadata values
  const metadata = svg.querySelector('metadata');
  if (!metadata) return;
  
  // Update the tank display based on initial metadata
  updateTankDisplay(svg);
  
  // Add event listeners for interactive elements
  const tankBody = svg.querySelector('#tank-body');
  if (tankBody) {
    tankBody.style.cursor = 'pointer';
    
    // Add hover effect
    tankBody.addEventListener('mouseenter', function() {
      this.setAttribute('fill', '#e0e0e0');
    });
    
    tankBody.addEventListener('mouseleave', function() {
      this.setAttribute('fill', '#f0f0f0');
    });
  }
}

// Update tank component when data changes
function updateTank(svg, data) {
  console.log('Updating tank component with new data');
  
  // Get metadata element
  const metadata = svg.querySelector('metadata');
  if (!metadata) return;
  
  // Update metadata if needed based on data object
  if (data) {
    if (data.temperature !== undefined) {
      metadata.querySelector('data-temperature').textContent = data.temperature;
    }
    
    if (data.pressure !== undefined) {
      metadata.querySelector('data-pressure').textContent = data.pressure;
    }
    
    if (data.tankLevel !== undefined) {
      metadata.querySelector('data-level').textContent = data.tankLevel;
    }
    
    if (data.status !== undefined) {
      metadata.querySelector('data-status').textContent = data.status;
    }
  }
  
  // Update visual display based on metadata
  updateTankDisplay(svg);
}

// Handler for tank clicks
function tank(element, event, data) {
  console.log('Tank clicked', element.id);
  
  const svg = element.closest('svg');
  const metadata = svg.querySelector('metadata');
  
  // Show tank information
  const level = metadata.querySelector('data-level').textContent;
  const temp = metadata.querySelector('data-temperature').textContent;
  const pressure = metadata.querySelector('data-pressure').textContent;
  
  alert(`Tank Status:
Level: ${level}%
Temperature: ${temp}°C
Pressure: ${pressure} hPa`);
  
  // Toggle status between normal and warning for demo
  const currentStatus = metadata.querySelector('data-status').textContent;
  const newStatus = currentStatus === 'normal' ? 'warning' : 'normal';
  metadata.querySelector('data-status').textContent = newStatus;
  
  // Update the display
  updateTankDisplay(svg);
}

// Helper function to update tank visual display based on metadata
function updateTankDisplay(svg) {
  const metadata = svg.querySelector('metadata');
  if (!metadata) return;
  
  // Get values from metadata
  const level = parseFloat(metadata.querySelector('data-level').textContent);
  const temp = parseFloat(metadata.querySelector('data-temperature').textContent);
  const pressure = parseFloat(metadata.querySelector('data-pressure').textContent);
  const status = metadata.querySelector('data-status').textContent;
  
  // Update tank level visualization
  const tankLevel = svg.querySelector('#tank-level');
  if (tankLevel) {
    const maxHeight = 200; // Total height of tank
    const height = maxHeight * (level / 100);
    const y = 250 - height; // 250 is the bottom of tank
    
    tankLevel.setAttribute('height', height);
    tankLevel.setAttribute('y', y);
    
    // Change color based on level
    if (level < 25) {
      tankLevel.setAttribute('fill', '#F44336'); // Red for low level
    } else if (level < 50) {
      tankLevel.setAttribute('fill', '#FF9800'); // Orange for medium-low
    } else {
      tankLevel.setAttribute('fill', '#2196F3'); // Blue for normal
    }
  }
  
  // Update temperature and pressure text
  const tempText = svg.querySelector('#tank-temp');
  if (tempText) {
    tempText.textContent = `Temperature: ${temp.toFixed(1)}°C`;
    
    // Highlight if temperature is too high
    if (temp > 30) {
      tempText.setAttribute('fill', '#F44336');
    } else {
      tempText.setAttribute('fill', '#000000');
    }
  }
  
  const pressText = svg.querySelector('#tank-press');
  if (pressText) {
    pressText.textContent = `Pressure: ${pressure.toFixed(0)} hPa`;
    
    // Highlight if pressure is too high
    if (pressure > 1100) {
      pressText.setAttribute('fill', '#F44336');
    } else {
      pressText.setAttribute('fill', '#000000');
    }
  }
  
  // Update status visualization
  const tankBody = svg.querySelector('#tank-body');
  if (tankBody && status === 'warning') {
    // Add warning border
    tankBody.setAttribute('stroke', '#F44336');
    tankBody.setAttribute('stroke-width', '3');
  } else if (tankBody) {
    // Normal border
    tankBody.setAttribute('stroke', '#333');
    tankBody.setAttribute('stroke-width', '2');
  }
}

// Handle mouse hover on tank level
function tankHover(element, event) {
  const svg = element.closest('svg');
  const metadata = svg.querySelector('metadata');
  const level = metadata.querySelector('data-level').textContent;
  
  // Show tooltip or visual indication
  const tankTitle = svg.querySelector('#tank-title');
  if (tankTitle) {
    tankTitle.textContent = `Storage Tank - ${level}% Full`;
    
    // Restore original title after 2 seconds
    setTimeout(() => {
      tankTitle.textContent = 'Storage Tank';
    }, 2000);
  }
}
