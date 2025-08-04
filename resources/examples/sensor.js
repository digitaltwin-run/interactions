/**
 * Sensor component JavaScript handlers
 * Provides interactive functionality for sensor SVG elements
 */

// Initialize sensor components
function initSensor(svg, data) {
  console.log('Initializing sensor components');
  
  // Find all sensor elements
  const sensors = svg.querySelectorAll('[id^="sensor-"]');
  
  // Initialize each sensor
  sensors.forEach(sensor => {
    // Set initial state
    sensor.setAttribute('data-active', 'false');
    
    // Add hover effects
    sensor.addEventListener('mouseenter', function() {
      this.setAttribute('r', '10'); // Enlarge on hover
      this.style.filter = 'brightness(1.2)';
    });
    
    sensor.addEventListener('mouseleave', function() {
      this.setAttribute('r', '8'); // Restore original size
      this.style.filter = '';
    });
  });
}

// Update sensor components when data changes
function updateSensor(svg, data) {
  console.log('Updating sensor components with new data');
  
  if (!data) return;
  
  // Get metadata from the SVG
  const metadata = svg.querySelector('metadata');
  if (!metadata) return;
  
  // Find all sensor elements
  const sensors = svg.querySelectorAll('[id^="sensor-"]');
  
  // Update sensors based on data
  sensors.forEach(sensor => {
    const sensorId = sensor.id;
    const sensorPosition = sensorId.split('-')[1]; // top, middle, bottom
    
    // Different logic based on sensor position
    if (sensorPosition === 'top') {
      // Top sensor monitors temperature
      const temperature = parseFloat(metadata.querySelector('data-temperature').textContent);
      
      if (temperature > 30) {
        activateSensor(sensor, '#FF5722', 'High temperature detected!');
      } else {
        deactivateSensor(sensor, '#FF5722');
      }
    }
    else if (sensorPosition === 'middle') {
      // Middle sensor monitors pressure
      const pressure = parseFloat(metadata.querySelector('data-pressure').textContent);
      
      if (pressure > 1100) {
        activateSensor(sensor, '#4CAF50', 'High pressure detected!');
      } else {
        deactivateSensor(sensor, '#4CAF50');
      }
    }
    else if (sensorPosition === 'bottom') {
      // Bottom sensor monitors level
      const level = parseFloat(metadata.querySelector('data-level').textContent);
      
      if (level < 25) {
        activateSensor(sensor, '#2196F3', 'Low level detected!');
      } else {
        deactivateSensor(sensor, '#2196F3');
      }
    }
  });
}

// Handler for sensor clicks
function sensor(element, event, data) {
  console.log('Sensor clicked', element.id);
  
  // Get sensor position from ID
  const sensorId = element.id;
  const sensorPosition = sensorId.split('-')[1]; // top, middle, bottom
  
  // Get SVG and metadata
  const svg = element.closest('svg');
  const metadata = svg.querySelector('metadata');
  
  // Show relevant data based on sensor type
  let message = '';
  
  if (sensorPosition === 'top') {
    const temperature = parseFloat(metadata.querySelector('data-temperature').textContent);
    message = `Temperature Sensor\nCurrent Reading: ${temperature}°C\nStatus: ${temperature > 30 ? 'WARNING - High Temperature' : 'Normal'}`;
    
    // Simulate a temperature change for demo
    const newTemp = Math.random() > 0.5 ? 32.5 : 25.5;
    metadata.querySelector('data-temperature').textContent = newTemp;
  }
  else if (sensorPosition === 'middle') {
    const pressure = parseFloat(metadata.querySelector('data-pressure').textContent);
    message = `Pressure Sensor\nCurrent Reading: ${pressure} hPa\nStatus: ${pressure > 1100 ? 'WARNING - High Pressure' : 'Normal'}`;
    
    // Simulate a pressure change for demo
    const newPressure = Math.random() > 0.5 ? 1150 : 1013;
    metadata.querySelector('data-pressure').textContent = newPressure;
  }
  else if (sensorPosition === 'bottom') {
    const level = parseFloat(metadata.querySelector('data-level').textContent);
    message = `Level Sensor\nCurrent Reading: ${level}%\nStatus: ${level < 25 ? 'WARNING - Low Level' : 'Normal'}`;
    
    // Simulate a level change for demo
    const newLevel = Math.random() > 0.5 ? 15 : 75;
    metadata.querySelector('data-level').textContent = newLevel;
  }
  
  // Show alert with sensor information
  alert(message);
  
  // Update sensor and tank display
  updateSensor(svg);
  
  // If tank.js is loaded, also update the tank
  if (typeof updateTank === 'function') {
    updateTank(svg);
  }
}

// Helper function to activate a sensor (alert state)
function activateSensor(sensor, baseColor, message) {
  // Set active state
  sensor.setAttribute('data-active', 'true');
  
  // Visual indication
  sensor.setAttribute('fill', baseColor);
  sensor.setAttribute('stroke-width', '2');
  
  // Add pulsing animation if not already added
  if (!sensor.querySelector('animate')) {
    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttribute('attributeName', 'opacity');
    animate.setAttribute('values', '1;0.3;1');
    animate.setAttribute('dur', '2s');
    animate.setAttribute('repeatCount', 'indefinite');
    sensor.appendChild(animate);
  }
  
  // Show message if provided
  if (message) {
    const svg = sensor.closest('svg');
    const tankTitle = svg.querySelector('#tank-title');
    
    if (tankTitle) {
      const originalText = tankTitle.textContent;
      tankTitle.textContent = message;
      tankTitle.setAttribute('fill', 'red');
      
      setTimeout(() => {
        tankTitle.textContent = originalText;
        tankTitle.setAttribute('fill', 'black');
      }, 3000);
    }
  }
}

// Helper function to deactivate a sensor (normal state)
function deactivateSensor(sensor, baseColor) {
  // Set inactive state
  sensor.setAttribute('data-active', 'false');
  
  // Visual reset
  sensor.setAttribute('fill', baseColor);
  sensor.setAttribute('stroke-width', '1');
  
  // Remove any animations
  const animate = sensor.querySelector('animate');
  if (animate) {
    sensor.removeChild(animate);
  }
}
