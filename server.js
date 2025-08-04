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
  
  res.render('index', { 
    svgFiles,
    scriptFiles
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
  const { svgFiles, scriptFiles, title } = req.body;
  
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
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .canvas-container { display: flex; flex-wrap: wrap; }
    .svg-canvas { border: 1px solid #ccc; margin: 10px; }
  </style>
</head>
<body>
  <div class="canvas-container">
`;

  // Add each SVG file content
  for (const svgFile of svgFiles) {
    const svgPath = path.join(__dirname, 'resources/svg', svgFile);
    if (fs.existsSync(svgPath)) {
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      // Wrap each SVG in a div for styling
      htmlContent += `    <div class="svg-canvas" id="canvas-${svgFile.replace('.svg', '')}">\n`;
      htmlContent += `      ${svgContent}\n`;
      htmlContent += `    </div>\n`;
    }
  }

  htmlContent += `  </div>\n\n`;
  
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
  
  // Add interactive coordinator script
  htmlContent += `
  <script>
    // Real-time interaction coordinator
    document.addEventListener('DOMContentLoaded', function() {
      // Find all SVG elements with metadata
      const svgElements = document.querySelectorAll('svg');
      
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
                  window['update' + componentId](componentElement);
                } 
                // Then try generic update
                else if (typeof window.updateComponent === 'function') {
                  window.updateComponent(componentElement);
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
        
        // Initialize any components that have init functions
        const componentId = svg.closest('.svg-canvas')?.id || '';
        try {
          // Try component-specific init function
          if (componentId && window['init' + componentId]) {
            window['init' + componentId](svg);
          }
          // Try generic init function
          else if (typeof window.initComponent === 'function') {
            window.initComponent(svg);
          }
        } catch (error) {
          console.error('Error initializing component:', error);
        }
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

// Download generated HTML file
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public', req.params.filename);
  
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
