# Digital Twin Interactions IDE

A dedicated Node.js application for real-time interaction logic with SVG components. This project provides an interactive HTML IDE that combines SVG and JavaScript resources to enable real-time actions on SVG canvases.

## Purpose

This project is part of a refactoring effort to separate concerns in the Digital Twin PWA:

- **PWA Project**: Focuses solely on SVG canvas design and static component placement
- **Interactions Project**: Handles all real-time SVG interactions, component behavior, and dynamic functionality

## Features

- HTML IDE interface for managing SVG and JavaScript resources
- Import and upload SVG components and JavaScript interaction code
- Preview SVG components and JavaScript code in the browser
- Combine multiple SVG canvases and JS scripts into a single interactive HTML export
- Enable real-time actions (click, cut, etc.) on SVGs via JavaScript
- Update metadata and component states in real-time
- Export fully interactive HTML files ready for deployment

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

```bash
# Install dependencies
npm install

# Install development dependencies (optional)
npm install --save-dev nodemon
```

### Running the Application

```bash
# Start the server
npm start

# Start in development mode (with auto-restart)
npm run dev
```

The application will be available at http://localhost:3000

## Project Structure

```
/interactions
├── public/              # Public assets
│   ├── css/            # Stylesheets
│   └── js/             # Client-side JavaScript
├── resources/          # Uploaded resources
│   ├── svg/            # SVG components
│   └── scripts/        # JavaScript interaction scripts
├── views/              # EJS templates
│   └── index.ejs       # Main IDE interface
├── server.js           # Express server and main application logic
├── package.json        # Project dependencies and scripts
└── README.md           # Project documentation
```

## Usage

1. Start the server and access the IDE interface
2. Upload SVG components (exported from the PWA project)
3. Upload or create JavaScript interaction scripts
4. Preview and test components and interactions
5. Add desired components and scripts to the canvas
6. Generate the interactive HTML export
7. Download and use the HTML file for your project

## Interaction Model

The interaction system uses JavaScript to manipulate SVG DOM elements and their metadata:

1. SVG components are loaded into the DOM
2. JavaScript code attaches event listeners to SVG elements
3. User actions (click, hover, etc.) trigger JavaScript functions
4. JavaScript updates SVG element properties and metadata
5. MutationObserver watches for metadata changes and triggers updates
6. Component state changes are reflected visually in real-time

## Migration from PWA

This project is designed to host the interaction logic previously embedded in the PWA's SVG export process. To migrate interaction code:

1. Extract JavaScript from PWA's scriptContent in export.js
2. Create component-specific JS files in the resources/scripts directory
3. Remove interaction logic from PWA's export process
4. Use this IDE to combine SVG and interaction code

## License

ISC