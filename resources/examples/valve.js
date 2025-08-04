/**
 * Valve component JavaScript handlers
 * Provides interactive functionality for valve SVG elements
 */

// Initialize valve components
function initValve(svg, data) {
  console.log('Initializing valve components');
  
  // Find all valve elements
  const valves = svg.querySelectorAll('[id^="valve-"]');
  
  // Initialize each valve
  valves.forEach(valve => {
    // Set initial state if not already set
    if (!valve.hasAttribute('data-state')) {
      valve.setAttribute('data-state', 'closed');
      updateValveAppearance(valve);
    }
    
    // Add hover effects
    valve.addEventListener('mouseenter', function() {
      if (this.getAttribute('data-state') === 'open') {
        this.setAttribute('fill', '#4CAF50'); // Brighter green for open
      } else {
        this.setAttribute('fill', '#757575'); // Brighter gray for closed
      }
    });
    
    valve.addEventListener('mouseleave', function() {
      updateValveAppearance(this);
    });
  });
}

// Update valve components when data changes
function updateValve(svg, data) {
  console.log('Updating valve components with new data');
  
  if (!data || !data.valvePosition) return;
  
  // Find all valve elements
  const valves = svg.querySelectorAll('[id^="valve-"]');
  
  // Update valve states based on data
  valves.forEach(valve => {
    const valveId = valve.id.split('-')[1]; // Extract valve identifier (e.g., "input", "output")
    
    // Check if we have data for this specific valve
    if (data.valvePosition && data.valvePosition[valveId]) {
      const newState = data.valvePosition[valveId] === 'Open' ? 'open' : 'closed';
      valve.setAttribute('data-state', newState);
      updateValveAppearance(valve);
    }
  });
}

// Handler for valve clicks
function valve(element, event, data) {
  console.log('Valve clicked', element.id);
  
  // Toggle valve state
  const currentState = element.getAttribute('data-state') || 'closed';
  const newState = currentState === 'closed' ? 'open' : 'closed';
  
  // Update valve state
  element.setAttribute('data-state', newState);
  updateValveAppearance(element);
  
  // Update the associated text label
  const valveText = element.nextElementSibling;
  if (valveText && valveText.tagName === 'text') {
    const valveId = element.id.split('-')[1].toUpperCase();
    valveText.textContent = `${valveId}: ${newState.toUpperCase()}`;
  }
  
  // For demo: Show notification
  const svg = element.closest('svg');
  const tankTitle = svg.querySelector('#tank-title');
  if (tankTitle) {
    const originalText = tankTitle.textContent;
    tankTitle.textContent = `Valve ${newState.toUpperCase()}`;
    
    setTimeout(() => {
      tankTitle.textContent = originalText;
    }, 2000);
  }
  
  // Simulate flow effect when valve is open
  if (newState === 'open') {
    simulateFlow(element);
  }
}

// Helper function to update valve appearance based on state
function updateValveAppearance(valve) {
  const state = valve.getAttribute('data-state') || 'closed';
  
  if (state === 'open') {
    valve.setAttribute('fill', '#4CAF50'); // Green for open
    valve.setAttribute('stroke', '#2E7D32'); // Darker green border
  } else {
    valve.setAttribute('fill', '#9E9E9E'); // Gray for closed
    valve.setAttribute('stroke', '#333'); // Dark border
  }
}

// Simulate fluid flow animation
function simulateFlow(valve) {
  const svg = valve.closest('svg');
  const valveId = valve.id;
  
  // Create flow particles
  const flowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  flowGroup.id = "flow-" + valveId;
  
  // Position flow based on valve type
  const isInput = valveId.includes('input');
  const valveRect = valve.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  
  // Starting position for flow particles
  const startX = 125; // Center of valve
  const startY = isInput ? 30 : 270; // Just below input valve or above output valve
  
  // Create 5 flow particles
  for (let i = 0; i < 5; i++) {
    const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    particle.setAttribute("cx", startX);
    particle.setAttribute("cy", startY + (isInput ? i * 10 : -i * 10));
    particle.setAttribute("r", "3");
    particle.setAttribute("fill", "#2196F3");
    particle.setAttribute("opacity", "0.7");
    
    flowGroup.appendChild(particle);
  }
  
  svg.appendChild(flowGroup);
  
  // Animate particles
  let position = 0;
  const animateFlow = setInterval(() => {
    position += isInput ? 5 : -5;
    
    // Move each particle
    const particles = flowGroup.querySelectorAll("circle");
    particles.forEach((particle, index) => {
      const offset = index * 10;
      const currentY = isInput ? startY + position + offset : startY + position - offset;
      
      // Check if particle is out of bounds
      if (isInput && currentY > 250 || !isInput && currentY < 50) {
        // Reset particle position for continuous flow
        particle.setAttribute("cy", isInput ? startY : startY);
      } else {
        particle.setAttribute("cy", currentY);
      }
    });
    
    // Stop animation after 3 seconds or if valve is closed
    if (valve.getAttribute('data-state') === 'closed') {
      clearInterval(animateFlow);
      svg.removeChild(flowGroup);
    }
  }, 50);
  
  // Safety cleanup after 3 seconds
  setTimeout(() => {
    clearInterval(animateFlow);
    if (document.getElementById(flowGroup.id)) {
      svg.removeChild(flowGroup);
    }
  }, 3000);
}
