const fs = require('fs');
const path = require('path');

const esmDir = path.join(__dirname, '../dist/esm');
const distDir = path.join(__dirname, '../dist');

// Process all .js files and convert them to .mjs with proper imports
function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');

      // Fix relative imports to add .mjs extension
      content = content.replace(
        /from ['"](\.\/.+?)['"];/g,
        (match, importPath) => {
          // Don't add extension if it already has one
          if (importPath.endsWith('.mjs') || importPath.endsWith('.js')) {
            return `from '${importPath.replace('.js', '.mjs')}';`;
          }
          return `from '${importPath}.mjs';`;
        }
      );

      // Fix export from statements
      content = content.replace(
        /export \{([^}]+)\} from ['"](\.\/.+?)['"];/g,
        (match, exports, importPath) => {
          if (importPath.endsWith('.mjs') || importPath.endsWith('.js')) {
            return `export {${exports}} from '${importPath.replace('.js', '.mjs')}';`;
          }
          return `export {${exports}} from '${importPath}.mjs';`;
        }
      );

      // Rename to .mjs
      const mjsPath = filePath.replace(/\.js$/, '.mjs');
      fs.writeFileSync(mjsPath, content, 'utf8');
      fs.unlinkSync(filePath);
    }
  });
}

// Recursively move directory contents
function moveDirectory(sourceDir, destDir) {
  const files = fs.readdirSync(sourceDir);

  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      // Create the directory in dest if it doesn't exist
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      // Recursively move contents
      moveDirectory(sourcePath, destPath);
    } else {
      // Move file
      fs.renameSync(sourcePath, destPath);
    }
  });
}

// Process the esm directory
processDirectory(esmDir);

// Move everything from esm to dist
moveDirectory(esmDir, distDir);

// Remove empty esm directory
fs.rmSync(esmDir, { recursive: true, force: true });

console.log('ESM build fixed: added .mjs extensions and moved files to dist/');
