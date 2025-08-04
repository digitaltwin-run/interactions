// state.js - Manages application state
export const state = {
  selectedSvgFiles: [],
  selectedScriptFiles: [],
  selectedElementId: null,
  canvasContents: {},
  scriptContents: {},
  editorCurrentFile: null,
  editorCurrentType: null,
  selectedElement: null,
  filterText: '',
  metadataFields: {},
  scriptBindings: {},
  lastToast: null,
  selectedJsFiles: [],
  editorContent: {
    svg: {},
    script: {}
  }
};

// Get current state
export const getState = () => state;

// Update state with new values
export const updateState = (newValues) => {
  Object.assign(state, newValues);
};
