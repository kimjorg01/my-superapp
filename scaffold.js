// scaffold.js
const fs = require('fs');
const path = require('path');

const modules = ['notes', 'pokemon', 'ai-chat'];
const baseDir = path.join(__dirname, 'src/renderer/src');

// 1. Define the directory structure
const structure = {
  'modules': {}, // Will hold our feature folders
  'components': {}, // Shared UI components
};

// 2. Add subfolders for each module
modules.forEach(mod => {
  structure.modules[mod] = {
    'components': {},
    'services': {}
  };
});

// Helper to create directories recursively
function createStructure(base, struct) {
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });

  Object.keys(struct).forEach(key => {
    const newPath = path.join(base, key);
    fs.mkdirSync(newPath, { recursive: true });
    createStructure(newPath, struct[key]);
  });
}

// Helper to create a placeholder React component
function createComponent(name) {
  return `export default function ${name}() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">${name} Module</h2>
      <p className="text-gray-600">This is the placeholder for the ${name} feature.</p>
    </div>
  );
}`;
}

// 3. Execute scaffolding
console.log("🌱 Growing your Digital Garden...");
createStructure(baseDir, structure);

// 4. Generate placeholder files for each module
modules.forEach(mod => {
  const componentName = mod.charAt(0).toUpperCase() + mod.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase()); // e.g. ai-chat -> AiChat
  const filePath = path.join(baseDir, 'modules', mod, `${componentName}Page.tsx`);
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, createComponent(componentName));
    console.log(`✅ Created ${componentName}Page.tsx`);
  }
});

console.log("\nDone! Your modular architecture is ready.");