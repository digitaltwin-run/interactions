/**
 * Digital Twin Component Library
 * 
 * A standardized library of reusable components for digital twin visualizations
 * with consistent interfaces for API integration and event handling.
 */

// Component Registry
const DigitalTwinComponents = {};

/**
 * Base Component Class
 * Provides common functionality for all digital twin components
 */
class BaseComponent {
  constructor(svg, elementId, config = {}) {
    this.svg = svg;
    this.element = svg.getElementById(elementId);
    this.config = {
      apiEndpoint: '/api/data',
      updateInterval: 2000,
      autoUpdate: false,
      ...config
    };
    
    this.state = {};
    this.metadata = {};
    this.updateTimer = null;
    
    // Initialize if element exists
    if (this.element) {
      this.init();
    } else {
      console.error(`Element with ID ${elementId} not found in SVG`);
    }
  }
  
  /**
   * Initialize component
   */
  init() {
    this.loadMetadata();
    this.setupEventHandlers();
    
    if (this.config.autoUpdate) {
      this.startAutoUpdate();
    }
  }
  
  /**
   * Load metadata from SVG
   */
  loadMetadata() {
    // Get metadata from element or parent SVG
    let metadataEl = this.element.querySelector('metadata');
    if (!metadataEl) {
      metadataEl = this.svg.querySelector('metadata');
    }
    
    if (metadataEl) {
      // Extract data from metadata element
      Array.from(metadataEl.children).forEach(child => {
        if (child.tagName.startsWith('data-')) {
          const key = child.tagName.replace('data-', '');
          this.metadata[key] = child.textContent;
        }
      });
      
      // Also check for attributes
      Array.from(metadataEl.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .forEach(attr => {
          const key = attr.name.replace('data-', '');
          this.metadata[key] = attr.value;
        });
    }
    
    // Initialize state from metadata
    this.state = { ...this.metadata };
  }
  
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Add click handler by default
    this.element.addEventListener('click', (event) => {
      this.handleEvent('click', event);
    });
    
    // Add custom event handlers from data-event attributes
    const eventTypes = this.element.getAttribute('data-events');
    if (eventTypes) {
      eventTypes.split(' ').forEach(eventType => {
        if (eventType !== 'click') { // Already added click handler
          this.element.addEventListener(eventType, (event) => {
            this.handleEvent(eventType, event);
          });
        }
      });
    }
  }
  
  /**
   * Handle DOM events
   */
  handleEvent(eventType, event) {
    console.log(`${this.constructor.name}: ${eventType} event on ${this.element.id}`);
    // Override in subclasses
  }
  
  /**
   * Update component from data
   */
  update(data) {
    if (!data) return;
    
    // Update state
    this.state = {
      ...this.state,
      ...data
    };
    
    // Update visual representation
    this.render();
  }
  
  /**
   * Render component based on current state
   */
  render() {
    // Override in subclasses
    console.log(`${this.constructor.name}: render called with state`, this.state);
  }
  
  /**
   * Fetch data from API
   */
  async fetchData() {
    try {
      const endpoint = `${this.config.apiEndpoint}/${this.config.apiComponent || this.element.id}`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      this.update(data);
      return data;
    } catch (error) {
      console.error(`Error fetching data for ${this.element.id}:`, error);
      return null;
    }
  }
  
  /**
   * Send control command to API
   */
  async sendCommand(command) {
    try {
      const endpoint = `/api/control/${this.config.apiComponent || this.element.id}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(command)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      this.update(data);
      return data;
    } catch (error) {
      console.error(`Error sending command for ${this.element.id}:`, error);
      return null;
    }
  }
  
  /**
   * Start automatic updates
   */
  startAutoUpdate() {
    if (this.updateTimer) clearInterval(this.updateTimer);
    
    this.updateTimer = setInterval(() => {
      this.fetchData();
    }, this.config.updateInterval);
  }
  
  /**
   * Stop automatic updates
   */
  stopAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
}

/**
 * Tank Component
 */
class TankComponent extends BaseComponent {
  constructor(svg, elementId, config = {}) {
    super(svg, elementId, {
      apiComponent: 'tank1',
      levelElement: 'tank-level',
      minLevel: 0,
      maxLevel: 100,
      ...config
    });
  }
  
  init() {
    super.init();
    
    // Find level element
    this.levelEl = this.svg.getElementById(this.config.levelElement);
    
    // Get tank dimensions
    const tankRect = this.element.getBoundingClientRect();
    this.tankHeight = this.element.height.baseVal.value;
    
    // Initial render
    this.render();
  }
  
  handleEvent(eventType, event) {
    super.handleEvent(eventType, event);
    
    if (eventType === 'click') {
      // Toggle tank status on click
      const newStatus = this.state.status === 'active' ? 'standby' : 'active';
      this.sendCommand({ status: newStatus });
    }
  }
  
  render() {
    // Update tank level visualization
    if (this.levelEl && 'level' in this.state) {
      const level = parseFloat(this.state.level);
      const tankRect = this.element.getBBox();
      const maxHeight = tankRect.height;
      
      // Calculate new height and y position
      const newHeight = (level / 100) * maxHeight;
      const newY = tankRect.y + maxHeight - newHeight;
      
      // Apply changes
      this.levelEl.setAttribute('height', newHeight);
      this.levelEl.setAttribute('y', newY);
      
      // Update level color based on value
      let fillColor = '#2196F3'; // Default blue
      
      if (level < 20) {
        fillColor = '#F44336'; // Red for low level
      } else if (level > 80) {
        fillColor = '#2196F3'; // Blue for high level
      }
      
      this.levelEl.setAttribute('fill', fillColor);
    }
    
    // Update tank body based on status
    if ('status' in this.state) {
      const fillColor = this.state.status === 'active' ? '#B0BEC5' : '#E0E0E0';
      this.element.setAttribute('fill', fillColor);
      
      // Update title if exists
      const titleEl = this.svg.getElementById('tank-title');
      if (titleEl) {
        titleEl.textContent = `Storage Tank (${this.state.status.toUpperCase()})`;
      }
    }
    
    // Update metadata
    this.updateMetadata();
  }
  
  updateMetadata() {
    // Find metadata element
    let metadataEl = this.element.querySelector('metadata');
    if (!metadataEl) {
      metadataEl = this.svg.querySelector('metadata');
    }
    
    if (metadataEl) {
      // Update each data element
      Object.entries(this.state).forEach(([key, value]) => {
        // Update as child element
        let dataEl = metadataEl.querySelector(`data-${key}`);
        if (dataEl) {
          dataEl.textContent = value;
        } else {
          dataEl = document.createElementNS('http://www.w3.org/2000/svg', `data-${key}`);
          dataEl.textContent = value;
          metadataEl.appendChild(dataEl);
        }
        
        // Also update as attribute
        metadataEl.setAttribute(`data-${key}`, value);
      });
    }
  }
}

/**
 * Valve Component
 */
class ValveComponent extends BaseComponent {
  constructor(svg, elementId, config = {}) {
    super(svg, elementId, {
      apiComponent: elementId.includes('input') ? 'valve1' : 'valve2',
      ...config
    });
  }
  
  init() {
    super.init();
    
    // Find label if exists
    const valveId = this.element.id.split('-')[1];
    this.labelEl = null;
    
    // Look for adjacent text element
    const nextEl = this.element.nextElementSibling;
    if (nextEl && nextEl.tagName === 'text') {
      this.labelEl = nextEl;
    }
    
    // Initial render
    this.render();
  }
  
  handleEvent(eventType, event) {
    super.handleEvent(eventType, event);
    
    if (eventType === 'click') {
      // Toggle valve position
      const newPosition = this.state.position === 'open' ? 'closed' : 'open';
      this.sendCommand({ position: newPosition });
    }
  }
  
  render() {
    // Update valve appearance based on position
    if ('position' in this.state) {
      const fillColor = this.state.position === 'open' ? '#4CAF50' : '#9E9E9E';
      const strokeColor = this.state.position === 'open' ? '#2E7D32' : '#333';
      
      this.element.setAttribute('fill', fillColor);
      this.element.setAttribute('stroke', strokeColor);
      
      // Update label if exists
      if (this.labelEl) {
        const valveId = this.element.id.split('-')[1];
        this.labelEl.textContent = `${valveId.charAt(0).toUpperCase() + valveId.slice(1)} Valve: ${this.state.position.toUpperCase()}`;
      }
    }
    
    // Update flow visualization if available
    this.updateFlowVisualization();
    
    // Update metadata
    this.updateMetadata();
  }
  
  updateFlowVisualization() {
    // If there's flow, show animation
    if (this.state.position === 'open' && parseFloat(this.state.flow) > 0) {
      this.createFlowParticles();
    } else {
      this.removeFlowParticles();
    }
  }
  
  createFlowParticles() {
    // Remove existing flow particles
    this.removeFlowParticles();
    
    // Create flow group
    const flowGroupId = `flow-${this.element.id}`;
    let flowGroup = this.svg.getElementById(flowGroupId);
    
    if (!flowGroup) {
      flowGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      flowGroup.id = flowGroupId;
      this.svg.appendChild(flowGroup);
    }
    
    // Position flow based on valve type
    const isInput = this.element.id.includes('input');
    const valveRect = this.element.getBBox();
    
    // Starting position for flow particles
    const startX = valveRect.x + valveRect.width / 2;
    const startY = isInput ? valveRect.y + valveRect.height + 5 : valveRect.y - 5;
    
    // Create flow particles
    for (let i = 0; i < 5; i++) {
      const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      particle.setAttribute("cx", startX);
      particle.setAttribute("cy", startY + (isInput ? i * 10 : -i * 10));
      particle.setAttribute("r", "3");
      particle.setAttribute("fill", "#2196F3");
      particle.setAttribute("opacity", "0.7");
      
      flowGroup.appendChild(particle);
    }
    
    // Animate particles
    this.animateFlow(flowGroup, isInput, startX, startY);
  }
  
  animateFlow(flowGroup, isInput, startX, startY) {
    // Stop existing animation
    if (this.flowAnimation) {
      clearInterval(this.flowAnimation);
    }
    
    let position = 0;
    this.flowAnimation = setInterval(() => {
      position += isInput ? 5 : -5;
      
      // Move each particle
      const particles = flowGroup.querySelectorAll("circle");
      particles.forEach((particle, index) => {
        const offset = index * 10;
        const currentY = isInput ? startY + position + offset : startY + position - offset;
        
        // Reset particle position for continuous flow if out of bounds
        if ((isInput && currentY > startY + 200) || (!isInput && currentY < startY - 200)) {
          particle.setAttribute("cy", isInput ? startY + (index * 10) : startY - (index * 10));
        } else {
          particle.setAttribute("cy", currentY);
        }
      });
      
      // Stop animation if valve is closed
      if (this.state.position === 'closed') {
        this.removeFlowParticles();
      }
    }, 50);
  }
  
  removeFlowParticles() {
    if (this.flowAnimation) {
      clearInterval(this.flowAnimation);
      this.flowAnimation = null;
    }
    
    const flowGroupId = `flow-${this.element.id}`;
    const flowGroup = this.svg.getElementById(flowGroupId);
    if (flowGroup) {
      flowGroup.remove();
    }
  }
  
  updateMetadata() {
    // Find metadata element
    let metadataEl = this.svg.querySelector('metadata');
    if (!metadataEl) return;
    
    // Update position data
    const positionData = metadataEl.querySelector(`data-valve-${this.element.id.split('-')[1]}`);
    if (positionData) {
      positionData.textContent = this.state.position;
    } else if (metadataEl) {
      const newData = document.createElementNS('http://www.w3.org/2000/svg', `data-valve-${this.element.id.split('-')[1]}`);
      newData.textContent = this.state.position;
      metadataEl.appendChild(newData);
    }
  }
}

/**
 * Pump Component
 */
class PumpComponent extends BaseComponent {
  constructor(svg, elementId, config = {}) {
    super(svg, elementId, {
      apiComponent: 'pump1',
      motorElement: 'pump-motor',
      bladesElement: 'pump-blades',
      statusElement: 'pump-status',
      ...config
    });
  }
  
  init() {
    super.init();
    
    // Get pump elements
    this.motorEl = this.svg.getElementById(this.config.motorElement);
    this.bladesEl = this.svg.getElementById(this.config.bladesElement);
    this.statusEl = this.svg.getElementById(this.config.statusElement);
    
    // Find control buttons
    this.startBtn = this.svg.getElementById('pump-start');
    this.stopBtn = this.svg.getElementById('pump-stop');
    
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.startPump());
    }
    
    if (this.stopBtn) {
      this.stopBtn.addEventListener('click', () => this.stopPump());
    }
    
    // Initialize animation
    this.rotationAngle = 0;
    this.rotationInterval = null;
    
    // Initial render
    this.render();
  }
  
  handleEvent(eventType, event) {
    super.handleEvent(eventType, event);
    
    if (eventType === 'click') {
      if (this.element.id === this.config.motorElement || this.element.id === this.config.elementId) {
        if (this.state.status === 'on') {
          this.cyclePower();
        }
      }
    }
  }
  
  render() {
    // Update pump motor visualization
    if (this.motorEl && 'status' in this.state) {
      const fillColor = this.state.status === 'on' ? '#4CAF50' : '#9E9E9E';
      this.motorEl.setAttribute('fill', fillColor);
    }
    
    // Update pump body
    const strokeWidth = this.state.status === 'on' ? 
      1 + (parseFloat(this.state.power) / 50) : 2;
    this.element.setAttribute('stroke-width', strokeWidth);
    
    // Update status text
    if (this.statusEl) {
      let statusText = `Status: ${this.state.status.toUpperCase()}`;
      if (this.state.status === 'on') {
        statusText += ` (${this.state.power}%)`;
      }
      this.statusEl.textContent = statusText;
    }
    
    // Handle rotation animation
    if (this.bladesEl) {
      if (this.state.status === 'on' && parseFloat(this.state.rpm) > 0) {
        this.startRotation();
      } else {
        this.stopRotation();
      }
    }
    
    // Update metadata
    this.updateMetadata();
  }
  
  startPump() {
    this.sendCommand({
      status: 'on',
      power: 50
    });
  }
  
  stopPump() {
    this.sendCommand({
      status: 'off',
      power: 0
    });
  }
  
  cyclePower() {
    // Cycle through power levels: 25% -> 50% -> 75% -> 100% -> 25%
    const powerLevels = [25, 50, 75, 100];
    const currentPower = parseFloat(this.state.power);
    const currentIndex = powerLevels.findIndex(p => Math.abs(p - currentPower) < 1);
    const nextIndex = (currentIndex + 1) % powerLevels.length;
    const newPower = powerLevels[nextIndex];
    
    this.sendCommand({ power: newPower });
  }
  
  startRotation() {
    if (this.rotationInterval) return; // Already running
    
    const speed = parseFloat(this.state.rpm) / 30; // Adjust for visual effect
    
    this.rotationInterval = setInterval(() => {
      this.rotationAngle = (this.rotationAngle + speed) % 360;
      this.bladesEl.setAttribute('transform', `rotate(${this.rotationAngle} 150 150)`);
    }, 50);
  }
  
  stopRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }
  
  updateMetadata() {
    // Find metadata element
    let metadataEl = this.svg.querySelector('metadata');
    if (!metadataEl) return;
    
    // Update each data element
    Object.entries(this.state).forEach(([key, value]) => {
      let dataEl = metadataEl.querySelector(`data-${key}`);
      if (dataEl) {
        dataEl.textContent = value;
      } else {
        const newData = document.createElementNS('http://www.w3.org/2000/svg', `data-${key}`);
        newData.textContent = value;
        metadataEl.appendChild(newData);
      }
    });
  }
}

/**
 * Sensor Component
 */
class SensorComponent extends BaseComponent {
  constructor(svg, elementId, config = {}) {
    super(svg, elementId, {
      apiComponent: 'tank1', // Sensors typically read from the tank
      sensorType: elementId.split('-')[1], // top, middle, bottom
      ...config
    });
  }
  
  init() {
    super.init();
    
    // Determine what this sensor monitors
    switch (this.config.sensorType) {
      case 'top':
        this.monitorProperty = 'temperature';
        this.warningThreshold = 30;
        this.baseColor = '#FF5722';
        break;
      case 'middle':
        this.monitorProperty = 'pressure';
        this.warningThreshold = 1100;
        this.baseColor = '#4CAF50';
        break;
      case 'bottom':
        this.monitorProperty = 'level';
        this.warningThreshold = 25;
        this.warningDirection = 'below'; // Warning if below threshold
        this.baseColor = '#2196F3';
        break;
      default:
        this.monitorProperty = 'status';
        this.warningThreshold = null;
        this.baseColor = '#9E9E9E';
    }
    
    // Set initial color
    this.element.setAttribute('fill', this.baseColor);
    
    // Add hover effects
    this.element.addEventListener('mouseenter', () => {
      this.element.setAttribute('r', parseFloat(this.element.getAttribute('r')) * 1.2);
    });
    
    this.element.addEventListener('mouseleave', () => {
      this.element.setAttribute('r', parseFloat(this.element.getAttribute('r')) / 1.2);
    });
    
    // Initial render
    this.render();
  }
  
  handleEvent(eventType, event) {
    super.handleEvent(eventType, event);
    
    if (eventType === 'click') {
      // Show sensor reading
      if (this.monitorProperty in this.state) {
        const value = this.state[this.monitorProperty];
        const isWarning = this.checkWarningCondition(value);
        
        let unit = '';
        switch (this.monitorProperty) {
          case 'temperature': unit = '°C'; break;
          case 'pressure': unit = 'hPa'; break;
          case 'level': unit = '%'; break;
        }
        
        const message = `${this.monitorProperty.toUpperCase()} Sensor\n` +
          `Current Reading: ${value}${unit}\n` +
          `Status: ${isWarning ? 'WARNING' : 'Normal'}`;
        
        alert(message);
      }
    }
  }
  
  checkWarningCondition(value) {
    if (this.warningThreshold === null) return false;
    
    const numValue = parseFloat(value);
    
    if (this.warningDirection === 'below') {
      return numValue < this.warningThreshold;
    } else {
      return numValue > this.warningThreshold;
    }
  }
  
  render() {
    if (!(this.monitorProperty in this.state)) return;
    
    const value = this.state[this.monitorProperty];
    const isWarning = this.checkWarningCondition(value);
    
    // Update visual state
    if (isWarning) {
      this.activateSensor();
    } else {
      this.deactivateSensor();
    }
  }
  
  activateSensor() {
    // Set active state
    this.element.setAttribute('data-active', 'true');
    this.element.setAttribute('stroke-width', '2');
    
    // Add pulsing animation if not already added
    if (!this.element.querySelector('animate')) {
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'opacity');
      animate.setAttribute('values', '1;0.3;1');
      animate.setAttribute('dur', '2s');
      animate.setAttribute('repeatCount', 'indefinite');
      this.element.appendChild(animate);
    }
  }
  
  deactivateSensor() {
    // Set inactive state
    this.element.setAttribute('data-active', 'false');
    this.element.setAttribute('stroke-width', '1');
    
    // Remove animation
    const animate = this.element.querySelector('animate');
    if (animate) {
      this.element.removeChild(animate);
    }
  }
}

/**
 * System Controller
 * Manages component interactions and API connections
 */
class SystemController {
  constructor(svgIds, config = {}) {
    this.config = {
      apiBaseUrl: 'http://localhost:5011/api',
      updateInterval: 2000,
      ...config
    };
    
    this.svgs = {};
    this.components = {};
    this.running = false;
    this.updateInterval = null;
    
    // Initialize SVGs and components
    this.initializeSvgs(svgIds);
  }
  
  /**
   * Initialize all SVGs
   */
  initializeSvgs(svgIds) {
    Object.entries(svgIds).forEach(([key, id]) => {
      const svgElement = document.getElementById(id);
      if (svgElement) {
        this.svgs[key] = svgElement;
        this.initializeComponents(key, svgElement);
      } else {
        console.error(`SVG with ID ${id} not found`);
      }
    });
  }
  
  /**
   * Initialize components in an SVG
   */
  initializeComponents(svgKey, svg) {
    // Find all elements with data-script attribute
    const elements = svg.querySelectorAll('[data-script]');
    
    elements.forEach(element => {
      const scriptType = element.getAttribute('data-script');
      const elementId = element.id;
      
      // Create component based on script type
      let component;
      switch (scriptType) {
        case 'tank':
          component = new TankComponent(svg, elementId, {
            apiBaseUrl: this.config.apiBaseUrl
          });
          break;
        case 'valve':
          component = new ValveComponent(svg, elementId, {
            apiBaseUrl: this.config.apiBaseUrl
          });
          break;
        case 'pump':
          component = new PumpComponent(svg, elementId, {
            apiBaseUrl: this.config.apiBaseUrl
          });
          break;
        case 'sensor':
          component = new SensorComponent(svg, elementId, {
            apiBaseUrl: this.config.apiBaseUrl
          });
          break;
        default:
          console.warn(`Unknown script type: ${scriptType} for element ${elementId}`);
          return;
      }
      
      // Store component
      if (component) {
        const componentKey = `${svgKey}-${elementId}`;
        this.components[componentKey] = component;
      }
    });
  }
  
  /**
   * Start system updates
   */
  start() {
    if (this.running) return;
    
    this.running = true;
    
    // Update status indicators
    const statusEl = document.getElementById('simulationStatus');
    if (statusEl) {
      statusEl.textContent = 'Status: Running';
      statusEl.classList.add('active');
    }
    
    // Clear existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Fetch initial data
    this.updateAllComponents();
    
    // Set update interval
    this.updateInterval = setInterval(() => {
      this.updateAllComponents();
    }, this.config.updateInterval);
  }
  
  /**
   * Stop system updates
   */
  stop() {
    if (!this.running) return;
    
    this.running = false;
    
    // Update status indicators
    const statusEl = document.getElementById('simulationStatus');
    if (statusEl) {
      statusEl.textContent = 'Status: Stopped';
      statusEl.classList.remove('active');
    }
    
    // Clear interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * Update all components with latest data
   */
  async updateAllComponents() {
    try {
      // Fetch all data in one request
      const response = await fetch(`${this.config.apiBaseUrl}/data`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update each component with appropriate data
      Object.values(this.components).forEach(component => {
        const apiComponent = component.config.apiComponent;
        if (data[apiComponent]) {
          component.update(data[apiComponent]);
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error updating components:', error);
      return null;
    }
  }
  
  /**
   * Get a specific component by its key
   */
  getComponent(key) {
    return this.components[key];
  }
}

/**
 * Register components in the global namespace
 */
DigitalTwinComponents.BaseComponent = BaseComponent;
DigitalTwinComponents.TankComponent = TankComponent;
DigitalTwinComponents.ValveComponent = ValveComponent;
DigitalTwinComponents.PumpComponent = PumpComponent;
DigitalTwinComponents.SensorComponent = SensorComponent;
DigitalTwinComponents.SystemController = SystemController;

// Make components globally available
window.DigitalTwinComponents = DigitalTwinComponents;
