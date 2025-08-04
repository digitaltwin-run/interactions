// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

// Environment variables with fallbacks
const PORT = process.env.PORT || 6000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = process.env.APP_NAME || 'Digital Twin Interactions IDE';
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let destFolder;
    if (file.mimetype.includes('svg')) {
      destFolder = 'resources/svg';
    } else if (file.mimetype.includes('javascript')) {
      destFolder = 'resources/scripts';
    } else {
      destFolder = 'resources';
    }
    cb(null, destFolder);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Routes
// Homepage - IDE interface
app.get('/', (req, res) => {
  const svgFiles = fs.readdirSync(path.join(__dirname, 'resources/svg'))
    .filter(file => file.endsWith('.svg'));
  
  const scriptFiles = fs.readdirSync(path.join(__dirname, 'resources/scripts'))
    .filter(file => file.endsWith('.js'));
    
  // Get example files
  const exampleSvgFiles = fs.existsSync(path.join(__dirname, 'resources/examples')) 
    ? fs.readdirSync(path.join(__dirname, 'resources/examples'))
      .filter(file => file.endsWith('.svg'))
    : [];
    
  const exampleJsFiles = fs.existsSync(path.join(__dirname, 'resources/examples')) 
    ? fs.readdirSync(path.join(__dirname, 'resources/examples'))
      .filter(file => file.endsWith('.js'))
    : [];
    
  const exampleHtmlFiles = fs.existsSync(path.join(__dirname, 'resources/examples')) 
    ? fs.readdirSync(path.join(__dirname, 'resources/examples'))
      .filter(file => file.endsWith('.html'))
    : [];
  
  res.render('index', { 
    svgFiles,
    jsFiles: scriptFiles,
    exampleSvgFiles,
    exampleJsFiles,
    exampleHtmlFiles
  });
});

// Upload resource files (SVG or JS)
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  
  res.json({
    success: true,
    file: req.file.originalname,
    type: req.file.mimetype.includes('svg') ? 'svg' : 'script'
  });
});

// Get resource file content
app.get('/resource/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  let folder;
  
  if (type === 'svg') {
    folder = 'resources/svg';
  } else if (type === 'script') {
    folder = 'resources/scripts';
  } else {
    return res.status(400).send('Invalid resource type');
  }
  
  const filePath = path.join(__dirname, folder, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  res.send(content);
});

// Generate interactive HTML with selected resources
app.post('/generate', (req, res) => {
  const { svgFiles, scriptFiles, title, bindings } = req.body;
  
  if (!svgFiles || !svgFiles.length) {
    return res.status(400).send('No SVG files selected');
  }
  
  // Generate a unique filename for the HTML output
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFilename = `interactive-${timestamp}.html`;
  const outputPath = path.join(__dirname, 'public', outputFilename);
  
  // Generate HTML content
  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Interactive SVG'}</title>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
    .canvas-container { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
    .svg-canvas { border: 1px solid #ccc; margin: 10px; padding: 10px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
    .svg-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333; }
    .controls { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    .data-display { margin-top: 20px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; }
    button { padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #1565c0; }
  </style>
</head>
<body>
  <h1>${title || 'Interactive SVG Dashboard'}</h1>
  
  <div class="controls">
    <h2>Control Panel</h2>
    <button id="refreshData">Refresh Data</button>
    <button id="toggleSimulation">Start Simulation</button>
    <div id="status">Status: Idle</div>
  </div>

  <div class="canvas-container">
`;

  // Add each SVG file content with proper binding setup
  for (const svgFile of svgFiles) {
    const svgPath = path.join(__dirname, 'resources/svg', svgFile);
    if (fs.existsSync(svgPath)) {
      let svgContent = fs.readFileSync(svgPath, 'utf8');
      
      // Create a unique ID for this SVG canvas
      const canvasId = `canvas-${svgFile.replace('.svg', '').replace(/\s+/g, '-')}`;
      
      // Wrap each SVG in a div for styling
      htmlContent += `    <div class="svg-canvas" id="${canvasId}">\n`;
      htmlContent += `      <div class="svg-title">${svgFile}</div>\n`;
      htmlContent += `      ${svgContent}\n`;
      htmlContent += `    </div>\n`;
    }
  }

  htmlContent += `  </div>\n\n`;
  
  // Add data display section
  htmlContent += `
  <div class="data-display">
    <h2>Data Monitor</h2>
    <div id="dataMonitor">No data available</div>
  </div>\n\n`;
  
  // Add script tags for each JS file
  if (scriptFiles && scriptFiles.length) {
    htmlContent += `  <!-- JavaScript Resources -->\n`;
    
    for (const scriptFile of scriptFiles) {
      const scriptPath = path.join(__dirname, 'resources/scripts', scriptFile);
      if (fs.existsSync(scriptPath)) {
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        htmlContent += `  <script>\n// ${scriptFile}\n${scriptContent}\n  </script>\n\n`;
      }
    }
  }
  
  // Add interactive coordinator script with binding support
  htmlContent += `
  <script>
    // Real-time interaction coordinator
    document.addEventListener('DOMContentLoaded', function() {
      // Global state for the simulation
      const appState = {
        isSimulationRunning: false,
        updateInterval: null,
        data: {}
      };

      // Find all SVG elements with metadata
      const svgElements = document.querySelectorAll('svg');
      const dataMonitor = document.getElementById('dataMonitor');
      const statusElement = document.getElementById('status');
      const toggleSimulation = document.getElementById('toggleSimulation');
      const refreshData = document.getElementById('refreshData');
      
      // Setup element bindings for each SVG
      setupElementBindings();

      // Set up metadata observer to detect changes
      setupMetadataObservers();
      
      // Initialize components
      initializeComponents();

      // Set up global controls
      setupGlobalControls();

      // Simulate fetching data from API
      function fetchDataFromApi() {
        return new Promise((resolve) => {
          // Simulate API delay
          setTimeout(() => {
            // Generate some random data
            const data = {
              timestamp: new Date().toLocaleTimeString(),
              temperature: Math.round((Math.random() * 30 + 10) * 10) / 10,
              pressure: Math.round(Math.random() * 100 + 900),
              flowRate: Math.round(Math.random() * 50) / 10,
              valvePosition: Math.random() > 0.5 ? 'Open' : 'Closed',
              tankLevel: Math.round(Math.random() * 100)
            };
            
            resolve(data);
          }, 500);
        });
      }

      // Update the data display
      function updateDataDisplay(data) {
        let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">';
        html += '<tr><th>Property</th><th>Value</th></tr>';
        
        for (const [key, value] of Object.entries(data)) {
          html += \`<tr><td>\${key}</td><td>\${value}</td></tr>\`;
        }
        
        html += '</table>';
        dataMonitor.innerHTML = html;
      }

      // Update all SVG components with new data
      function updateComponents(data) {
        appState.data = data;
        
        // Find metadata elements and update them
        svgElements.forEach(svg => {
          const metadata = svg.querySelector('metadata');
          if (metadata) {
            // Update metadata with the new data
            if (data.temperature) metadata.dataset.temperature = data.temperature;
            if (data.pressure) metadata.dataset.pressure = data.pressure;
            if (data.flowRate) metadata.dataset.flowRate = data.flowRate;
            if (data.valvePosition) metadata.dataset.valvePosition = data.valvePosition;
            if (data.tankLevel) metadata.dataset.tankLevel = data.tankLevel;
            if (data.timestamp) metadata.dataset.lastUpdated = data.timestamp;
          }
        });
        
        // Update data display
        updateDataDisplay(data);
      }

      // Setup element bindings based on data attributes
      function setupElementBindings() {
        // Process binding information for elements with data-script and data-event
        svgElements.forEach(svg => {
          const boundElements = svg.querySelectorAll('[data-script]');
          
          boundElements.forEach(element => {
            const scriptFile = element.dataset.script;
            const eventType = element.dataset.event || 'click';
            
            // Create event handler using the specified script
            element.addEventListener(eventType, function(e) {
              // Try to call the corresponding function from the script
              const fnName = scriptFile.replace('.js', '');
              if (typeof window[fnName] === 'function') {
                window[fnName](element, e, appState.data);
              } else if (typeof window[fnName + 'Handler'] === 'function') {
                window[fnName + 'Handler'](element, e, appState.data);
              }
            });
            
            // Add visual indicator for interactive elements
            element.style.cursor = 'pointer';
          });
        });
      }

      // Setup metadata observers
      function setupMetadataObservers() {
        svgElements.forEach(svg => {
          // Setup metadata observer to detect changes
          const metadataObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              // When metadata changes, trigger the component's update function
              if (mutation.target.closest('metadata')) {
                const componentElement = svg.closest('.svg-canvas') || svg;
                const componentId = componentElement.id;
                
                // Find and call any update functions
                try {
                  // Try component-specific update function first
                  if (componentId && window['update' + componentId]) {
                    window['update' + componentId](componentElement, appState.data);
                  } 
                  // Then try generic update
                  else if (typeof window.updateComponent === 'function') {
                    window.updateComponent(componentElement, appState.data);
                  }
                } catch (error) {
                  console.error('Error updating component:', error);
                }
              }
            });
          });
          
          // Observe all changes to the DOM inside the SVG
          metadataObserver.observe(svg, { 
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true
          });
        });
      }

      // Initialize all components
      function initializeComponents() {
        svgElements.forEach(svg => {
          const componentId = svg.closest('.svg-canvas')?.id || '';
          try {
            // Try component-specific init function
            if (componentId && window['init' + componentId]) {
              window['init' + componentId](svg, {});
            }
            // Try generic init function
            else if (typeof window.initComponent === 'function') {
              window.initComponent(svg, {});
            }
          } catch (error) {
            console.error('Error initializing component:', error);
          }
        });
      }

      // Setup global control functions
      function setupGlobalControls() {
        // Toggle simulation button
        toggleSimulation.addEventListener('click', function() {
          if (appState.isSimulationRunning) {
            // Stop simulation
            clearInterval(appState.updateInterval);
            appState.isSimulationRunning = false;
            toggleSimulation.textContent = 'Start Simulation';
            statusElement.textContent = 'Status: Idle';
          } else {
            // Start simulation
            appState.isSimulationRunning = true;
            toggleSimulation.textContent = 'Stop Simulation';
            statusElement.textContent = 'Status: Running';
            
            // Fetch initial data
            fetchDataFromApi().then(data => {
              updateComponents(data);
            });
            
            // Set interval for continuous updates
            appState.updateInterval = setInterval(() => {
              fetchDataFromApi().then(data => {
                updateComponents(data);
              });
            }, 3000);
          }
        });

        // Refresh data button
        refreshData.addEventListener('click', function() {
          statusElement.textContent = 'Status: Refreshing...';
          
          fetchDataFromApi().then(data => {
            updateComponents(data);
            statusElement.textContent = appState.isSimulationRunning ? 'Status: Running' : 'Status: Idle';
          });
        });
      }

      // Initial data fetch
      fetchDataFromApi().then(data => {
        updateComponents(data);
      });
    });
  </script>
</body>
</html>`;

  // Write the HTML file
  fs.writeFileSync(outputPath, htmlContent);
  
  // Return the URL to download the file
  res.json({
    success: true,
    file: outputFilename,
    downloadUrl: `/download/${outputFilename}`
  });
});

// Save resource content (for code editor)
app.post('/save-resource', (req, res) => {
  const { type, fileName, content } = req.body;
  
  if (!type || !fileName || content === undefined) {
    return res.status(400).send('Missing required parameters');
  }
  
  let folder;
  if (type === 'svg') {
    folder = 'resources/svg';
  } else if (type === 'script') {
    folder = 'resources/scripts';
  } else {
    return res.status(400).send('Invalid resource type');
  }
  
  const filePath = path.join(__dirname, folder, fileName);
  
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    res.json({
      success: true,
      message: `${type.toUpperCase()} file saved successfully`
    });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).send('Error saving file');
  }
});

// Download generated HTML file
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public', req.params.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  
  res.download(filePath);
});

// Serve example files
app.get('/examples/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'resources/examples', req.params.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  
  res.download(filePath);
});

// Start server
app.listen(PORT, HOST === 'localhost' ? null : HOST, () => {
  console.log(`${APP_NAME} server running on http://${HOST}:${PORT}`);
  if (DEBUG_MODE) {
    console.log(`Debug mode: enabled`);
    console.log(`Environment: ${NODE_ENV}`);
  }
});
