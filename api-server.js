const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 5011;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data storage (in a real system, this would be a database)
const sensorData = {
  tank1: {
    temperature: 25,
    pressure: 1013,
    level: 50,
    status: 'standby',
    lastUpdated: new Date().toISOString()
  },
  pump1: {
    rpm: 0,
    power: 0,
    flow: 0,
    status: 'off',
    lastUpdated: new Date().toISOString()
  },
  valve1: {
    position: 'closed',
    flow: 0,
    status: 'ok',
    lastUpdated: new Date().toISOString()
  },
  valve2: {
    position: 'closed',
    flow: 0, 
    status: 'ok',
    lastUpdated: new Date().toISOString()
  },
  system: {
    status: 'normal',
    alarms: [],
    notifications: [],
    lastUpdated: new Date().toISOString()
  }
};

// Utility function to generate realistic fluctuations in sensor data
function updateSensorData() {
  // Update tank data with small random fluctuations
  sensorData.tank1.temperature += (Math.random() - 0.5) * 0.2;
  sensorData.tank1.temperature = parseFloat(sensorData.tank1.temperature.toFixed(1));
  
  sensorData.tank1.pressure += (Math.random() - 0.5) * 2;
  sensorData.tank1.pressure = parseFloat(sensorData.tank1.pressure.toFixed(0));
  
  // Level changes more slowly and depends on valve positions
  if (sensorData.valve1.position === 'open' && sensorData.valve2.position === 'closed') {
    sensorData.tank1.level += 0.1;
  } else if (sensorData.valve1.position === 'closed' && sensorData.valve2.position === 'open') {
    sensorData.tank1.level -= 0.1;
  }
  
  // Keep level within bounds
  sensorData.tank1.level = Math.max(0, Math.min(100, sensorData.tank1.level));
  sensorData.tank1.level = parseFloat(sensorData.tank1.level.toFixed(1));
  
  // Update pump data
  if (sensorData.pump1.status === 'on') {
    const pumpPower = sensorData.pump1.power / 100;
    
    // Flow depends on pump power and valve positions
    let flow = pumpPower * 100;
    
    if (sensorData.valve1.position === 'closed' && sensorData.valve2.position === 'closed') {
      flow = 0;
    } else if (sensorData.valve1.position === 'closed' || sensorData.valve2.position === 'closed') {
      flow *= 0.5;
    }
    
    sensorData.pump1.flow = parseFloat(flow.toFixed(1));
    
    // Update valve flow based on pump
    sensorData.valve1.flow = sensorData.valve1.position === 'open' ? sensorData.pump1.flow : 0;
    sensorData.valve2.flow = sensorData.valve2.position === 'open' ? sensorData.pump1.flow : 0;
  } else {
    sensorData.pump1.flow = 0;
    sensorData.valve1.flow = 0;
    sensorData.valve2.flow = 0;
  }
  
  // Update timestamps
  const now = new Date().toISOString();
  sensorData.tank1.lastUpdated = now;
  sensorData.pump1.lastUpdated = now;
  sensorData.valve1.lastUpdated = now;
  sensorData.valve2.lastUpdated = now;
  sensorData.system.lastUpdated = now;
}

// API Routes

// Get all sensor data
app.get('/api/data', (req, res) => {
  updateSensorData();
  res.json(sensorData);
});

// Get specific component data
app.get('/api/data/:component', (req, res) => {
  const { component } = req.params;
  
  if (sensorData[component]) {
    updateSensorData();
    res.json(sensorData[component]);
  } else {
    res.status(404).json({ error: `Component ${component} not found` });
  }
});

// Update component data (for control operations)
app.post('/api/control/:component', (req, res) => {
  const { component } = req.params;
  const updateData = req.body;
  
  if (sensorData[component]) {
    // Apply only valid updates
    for (const [key, value] of Object.entries(updateData)) {
      if (key in sensorData[component] && key !== 'lastUpdated') {
        sensorData[component][key] = value;
      }
    }
    
    // Update timestamp
    sensorData[component].lastUpdated = new Date().toISOString();
    
    // Special handling for certain controls
    if (component === 'pump1' && 'status' in updateData) {
      if (updateData.status === 'off') {
        sensorData.pump1.rpm = 0;
        sensorData.pump1.flow = 0;
      }
    }
    
    res.json(sensorData[component]);
  } else {
    res.status(404).json({ error: `Component ${component} not found` });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /api/data - Get all sensor data');
  console.log('  GET /api/data/:component - Get specific component data');
  console.log('  POST /api/control/:component - Update component state');
});
