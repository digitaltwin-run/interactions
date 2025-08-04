#!/usr/bin/env node

/**
 * Component Migration Script
 * 
 * This script extracts component interaction logic from the PWA project's export.js
 * and migrates it to separate component-specific JavaScript files in the interactions project.
 * 
 * It specifically looks for:
 * 1. scriptContent blocks in export.js
 * 2. Component initialization functions
 * 3. Interaction event handlers
 * 4. Related metadata management code
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PWA_DIR = path.resolve(__dirname, '../../pwa');
const EXPORT_JS_PATH = path.join(PWA_DIR, 'js/export.js');
const COMPONENTS_PATH = path.join(PWA_DIR, 'components');
const SCRIPTS_OUTPUT_PATH = path.resolve(__dirname, '../resources/scripts');
const SVG_OUTPUT_PATH = path.resolve(__dirname, '../resources/svg');
const DEBUG = process.env.DEBUG_MODE === 'true';

// Components to migrate and their specific patterns
const COMPONENTS = [
  {
    name: 'pump',
    svgFile: 'pump.svg',
    initFunctionName: 'initPump',
    updateFunctionName: 'updatePump',
    // Instead of trying to extract exact functions, we'll create standard component handlers
    createNew: true
  },
  {
    name: 'valve',
    svgFile: 'valve.svg',
    initFunctionName: 'initValve',
    updateFunctionName: 'updateValve',
    createNew: true
  },
  {
    name: 'sensor',
    svgFile: 'sensor.svg',
    initFunctionName: 'initSensor',
    updateFunctionName: 'updateSensor',
    createNew: true
  },
  {
    name: 'tank',
    svgFile: 'tank.svg',
    initFunctionName: 'initTank',
    updateFunctionName: 'updateTank',
    createNew: true
  }
];

// Ensure directories exist
fs.ensureDirSync(SCRIPTS_OUTPUT_PATH);
fs.ensureDirSync(SVG_OUTPUT_PATH);

/**
 * Extract script content from export.js
 */
async function extractScriptContent() {
  console.log('Extracting script content from export.js...');
  
  try {
    const exportJsContent = await fs.readFile(EXPORT_JS_PATH, 'utf8');
    
    // Match the beginning of scriptContent
    const startMatch = exportJsContent.match(/const\s+scriptContent\s*=\s*['"](.*)['"]\s*\+/i);
    if (!startMatch) {
      // Try alternate pattern (direct string)
      const altMatch = exportJsContent.match(/const\s+scriptContent\s*=\s*['"](.*)['"];/i);
      if (altMatch) {
        return altMatch[1];
      }
      console.error('Could not find start of scriptContent in export.js');
      return null;
    }
    
    // Find the script content definition start and end
    const scriptStartIndex = exportJsContent.indexOf('const scriptContent =');
    if (scriptStartIndex === -1) {
      console.error('Could not locate scriptContent definition');
      return null;
    }
    
    // Find the end of the script content definition (usually ends with a semicolon after multiple lines)
    let endIndex = scriptStartIndex;
    let openBraces = 0;
    let inString = false;
    let stringChar = null;
    let foundEnd = false;
    let scriptLines = [];
    
    // Extract lines between the start of scriptContent and the end of its definition
    const lines = exportJsContent.substring(scriptStartIndex).split('\n');
    
    // Reconstruct the script content from concatenated strings
    let scriptContent = '';
    let insideScriptContent = false;
    let currentLine = '';
    
    for (const line of lines) {
      if (!insideScriptContent && line.includes('const scriptContent =')) {
        insideScriptContent = true;
        // Extract the first part of the string after the equals sign
        const firstPart = line.substring(line.indexOf('=') + 1).trim();
        if (firstPart.startsWith('\'') || firstPart.startsWith('"')) {
          // Extract content between quotes
          const quoteChar = firstPart[0];
          const endQuoteIndex = firstPart.indexOf(quoteChar, 1);
          if (endQuoteIndex !== -1) {
            currentLine = firstPart.substring(1, endQuoteIndex);
            scriptContent += currentLine;
          }
        }
      } else if (insideScriptContent) {
        // Check if this line ends the scriptContent definition
        if (line.trim().endsWith(';') && !line.includes('+=') && !line.includes('+= ')) {
          insideScriptContent = false;
          // Extract content between quotes if present
          const quoteStart = line.indexOf('\'') !== -1 ? line.indexOf('\'') : line.indexOf('"');
          const quoteEnd = line.lastIndexOf('\'') !== -1 ? line.lastIndexOf('\'') : line.lastIndexOf('"');
          if (quoteStart !== -1 && quoteEnd !== -1 && quoteStart < quoteEnd) {
            scriptContent += line.substring(quoteStart + 1, quoteEnd);
          }
          break;
        } else {
          // Extract content between quotes if present
          const quoteStart = line.indexOf('\'') !== -1 ? line.indexOf('\'') : line.indexOf('"');
          const quoteEnd = line.lastIndexOf('\'') !== -1 ? line.lastIndexOf('\'') : line.lastIndexOf('"');
          if (quoteStart !== -1 && quoteEnd !== -1 && quoteStart < quoteEnd) {
            scriptContent += line.substring(quoteStart + 1, quoteEnd);
          }
        }
      }
    }
    
    if (scriptContent) {
      console.log('Successfully extracted scriptContent');
      return scriptContent;
    }
    
    console.error('Failed to extract complete scriptContent');
    return null;
  } catch (error) {
    console.error('Error reading export.js:', error);
    return null;
  }
}

/**
 * Extract component-specific code blocks or generate new ones
 */
async function extractComponentCode(component, exportJsContent, scriptContent) {
  console.log(`Processing ${component.name} component code...`);
  
  let utilityFunctions = [];
  
  if (component.createNew) {
    // Generate standardized component code rather than extracting
    console.log(`Creating standardized handler for ${component.name} component...`);
    
    // Extract utility functions that might be needed across components
    utilityFunctions = [
      extractGlobalFunction(exportJsContent, 'setupComponentObserver'),
      extractGlobalFunction(exportJsContent, 'updateComponentMetadata'),
      extractGlobalFunction(exportJsContent, 'getComponentMetadata')
    ].filter(Boolean);
    
    return {
      componentSpecific: [],
      utilityFunctions,
      createNew: true
    };
  } else {
    // Original extraction logic (fallback)
    let codeBlocks = [];
    
    for (const pattern of component.patterns || []) {
      const matches = exportJsContent.match(pattern);
      if (matches) {
        codeBlocks = [...codeBlocks, ...matches];
      }
    }
    
    return {
      componentSpecific: codeBlocks,
      utilityFunctions,
      createNew: false
    };
  }
}

/**
 * Extract a global function by name from the code
 */
function extractGlobalFunction(content, functionName) {
  const regex = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}`, 'g');
  const match = regex.exec(content);
  return match ? match[0] : null;
}

/**
 * Generate component script from extracted code or create new standardized handler
 */
function generateComponentScript(component, extractedCode) {
  const { componentSpecific, utilityFunctions, createNew } = extractedCode;
  
  // Component name with first letter capitalized
  const capitalizedName = component.name.charAt(0).toUpperCase() + component.name.slice(1);
  const initFunctionName = component.initFunctionName || `init${capitalizedName}`;
  const updateFunctionName = component.updateFunctionName || `update${capitalizedName}`;
  
  let componentCode;
  
  if (createNew) {
    // Generate a standardized component handler
    componentCode = `
  // Initialize ${component.name} component
  function ${initFunctionName}(element) {
    if (!element) return;
    console.log('Initializing ${component.name} component:', element.id || 'unnamed');
    
    // Setup state
    let isOn = false;
    let hasAlert = false;
    let speed = 0;
    
    // Get initial state from metadata if available
    const metadataElement = element.querySelector('metadata component parameters');
    if (metadataElement) {
      const isOnElem = metadataElement.querySelector('isOn');
      if (isOnElem) isOn = isOnElem.textContent === 'true';
      
      const alertElem = metadataElement.querySelector('alert');
      if (alertElem) hasAlert = alertElem.textContent === 'true';
      
      const speedElem = metadataElement.querySelector('speed');
      if (speedElem) speed = parseInt(speedElem.textContent) || 0;
    }
    
    // Setup observers for metadata changes
    setupComponentObserver(element);
    
    // Initial visual update
    ${updateFunctionName}(element);
    
    // Add click handler
    element.addEventListener('click', function() {
      // Toggle state
      isOn = !isOn;
      
      // Update metadata
      updateComponentMetadata(element, 'isOn', isOn.toString());
      
      // Update visual representation
      ${updateFunctionName}(element);
    });
  }
  
  // Update ${component.name} visual representation based on metadata
  function ${updateFunctionName}(element) {
    if (!element) return;
    
    const metadata = getComponentMetadata(element);
    const isOn = metadata.isOn === 'true';
    const hasAlert = metadata.alert === 'true';
    
    // Update visual state - find elements by class or ID
    const statusElements = element.querySelectorAll('.status, .indicator');
    statusElements.forEach(statusEl => {
      if (isOn) {
        statusEl.setAttribute('fill', hasAlert ? '#ff5500' : '#00cc00');
      } else {
        statusEl.setAttribute('fill', '#999999');
      }
    });
    
    // Handle animation elements if they exist
    const animatedElements = element.querySelectorAll('.animated, .moving-part');
    animatedElements.forEach(animEl => {
      if (isOn) {
        // Add animation if not already present
        if (!animEl.querySelector('animate')) {
          const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
          animate.setAttribute('attributeName', 'transform');
          animate.setAttribute('type', 'rotate');
          animate.setAttribute('from', '0 50 50');
          animate.setAttribute('to', '360 50 50');
          animate.setAttribute('dur', '2s');
          animate.setAttribute('repeatCount', 'indefinite');
          animEl.appendChild(animate);
        }
      } else {
        // Remove animation
        const animates = animEl.querySelectorAll('animate');
        animates.forEach(a => a.remove());
      }
    });
  }`;
  } else if (componentSpecific && componentSpecific.length > 0) {
    // Use extracted component code
    componentCode = componentSpecific.join('\n\n');
  } else {
    // Fallback to minimal stub
    componentCode = `
  // Initialize ${component.name} component
  function ${initFunctionName}(element) {
    if (!element) return;
    console.log('Initializing ${component.name} component:', element.id || 'unnamed');
  }
  
  // Update ${component.name} visual representation
  function ${updateFunctionName}(element) {
    if (!element) return;
    console.log('Updating ${component.name} component:', element.id || 'unnamed');
  }`;
  }
  
  const script = `/**
 * ${capitalizedName} Component Interactions
 * 
 * This file contains all interactive behaviors for the ${component.name} component
 * Generated for Digital Twin Interactions IDE
 */

(function() {
  'use strict';
  
  // Utility functions
  ${utilityFunctions.join('\n\n') || '// No utility functions required'}
  
  // Component-specific code
  ${componentCode}
  
  // Initialize when document is ready
  document.addEventListener('DOMContentLoaded', function() {
    const ${component.name}Elements = document.querySelectorAll('[data-component="${component.name}"]');
    ${component.name}Elements.forEach(element => {
      ${initFunctionName}(element);
    });
  });
})();`;

  return script;
}

/**
 * Save the generated component script
 */
async function saveComponentScript(component, script) {
  const outputPath = path.join(INTERACTIONS_SCRIPTS_DIR, `${component.name}.js`);
  
  try {
    await fs.writeFile(outputPath, script, 'utf8');
    console.log(`Saved ${component.name} script to ${outputPath}`);
  } catch (error) {
    console.error(`Error saving ${component.name} script:`, error);
  }
}

/**
 * Copy SVG files to interactions project
 */
async function copySvgFiles() {
  const interactionsSvgDir = path.resolve(__dirname, '../resources/svg');
  fs.ensureDirSync(interactionsSvgDir);
  
  for (const component of COMPONENTS) {
    const sourcePath = path.join(COMPONENTS_PATH, component.svgFile);
    const destPath = path.join(interactionsSvgDir, component.svgFile);
    
    try {
      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath);
        console.log(`Copied ${component.svgFile} to interactions project`);
      } else {
        console.warn(`SVG file not found: ${sourcePath}`);
      }
    } catch (error) {
      console.error(`Error copying SVG file ${component.svgFile}:`, error);
    }
  }
}

/**
 * Main migration function
 */
async function migrateComponents() {
  console.log('Starting component migration...');
  
  try {
    // Read export.js content
    const exportJsContent = await fs.readFile(EXPORT_JS_PATH, 'utf8');
    
    // Extract script content template
    const scriptContent = await extractScriptContent();
    
    if (!scriptContent) {
      console.error('Failed to extract script content, aborting migration.');
      return;
    }
    
    // Extract utility functions we'll need across components
    const globalFunctions = {
      setupComponentObserver: extractGlobalFunction(exportJsContent, 'setupComponentObserver') || 
        `function setupComponentObserver(element) {
  if (!element || !window.MutationObserver) return;
  
  const metadataElement = element.querySelector('metadata component parameters');
  if (!metadataElement) return;
  
  const observer = new MutationObserver(function() {
    // Get the component's update function name based on data-component attribute
    const componentType = element.getAttribute('data-component');
    if (!componentType) return;
    
    const updateFnName = 'update' + componentType.charAt(0).toUpperCase() + componentType.slice(1);
    if (typeof window[updateFnName] === 'function') {
      window[updateFnName](element);
    }
  });
  
  observer.observe(metadataElement, { childList: true, subtree: true, characterData: true });
}`,

      updateComponentMetadata: extractGlobalFunction(exportJsContent, 'updateComponentMetadata') || 
        `function updateComponentMetadata(element, paramName, value) {
  if (!element) return;
  
  let metadataElement = element.querySelector('metadata');
  if (!metadataElement) {
    metadataElement = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
    element.appendChild(metadataElement);
  }
  
  let componentElement = metadataElement.querySelector('component');
  if (!componentElement) {
    componentElement = document.createElementNS('http://www.w3.org/2000/svg', 'component');
    metadataElement.appendChild(componentElement);
  }
  
  let parametersElement = componentElement.querySelector('parameters');
  if (!parametersElement) {
    parametersElement = document.createElementNS('http://www.w3.org/2000/svg', 'parameters');
    componentElement.appendChild(parametersElement);
  }
  
  let paramElement = parametersElement.querySelector(paramName);
  if (!paramElement) {
    paramElement = document.createElementNS('http://www.w3.org/2000/svg', paramName);
    parametersElement.appendChild(paramElement);
  }
  
  paramElement.textContent = value;
}`,

      getComponentMetadata: extractGlobalFunction(exportJsContent, 'getComponentMetadata') || 
        `function getComponentMetadata(element) {
  const metadata = {};
  if (!element) return metadata;
  
  const metadataElement = element.querySelector('metadata component parameters');
  if (!metadataElement) return metadata;
  
  // Extract all parameter elements
  Array.from(metadataElement.children).forEach(param => {
    metadata[param.tagName] = param.textContent;
  });
  
  return metadata;
}`
    };
    
    // Process each component
    for (const component of COMPONENTS) {
      // Extract component code or prepare for new code generation
      const extractedCode = await extractComponentCode(component, exportJsContent, scriptContent);
      
      // Add global utility functions
      extractedCode.utilityFunctions = [
        globalFunctions.setupComponentObserver,
        globalFunctions.updateComponentMetadata,
        globalFunctions.getComponentMetadata
      ];
      
      // Generate component script
      const script = generateComponentScript(component, extractedCode);
      
      // Write component script to file
      await fs.writeFile(
        path.join(SCRIPTS_OUTPUT_PATH, `${component.name}.js`), 
        script,
        'utf8'
      );
      
      console.log(`Generated ${component.name}.js script`);
      
      // Copy SVG file if it exists
      try {
        await fs.copyFile(
          path.join(COMPONENTS_PATH, component.svgFile),
          path.join(SVG_OUTPUT_PATH, component.svgFile)
        );
        console.log(`Copied ${component.svgFile} to interactions project`);
      } catch (error) {
        console.log(`SVG file not found: ${path.join(COMPONENTS_PATH, component.svgFile)}`);
      }
    }
    
    console.log('Component migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration
migrateComponents();
