import fs from 'fs';
import path from 'path';

// Function to find all markdown files in directories
function findMarkdownFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Function to check if file has front matter
function hasFrontMatter(content) {
  return content.startsWith('---\n') && content.includes('\n---\n');
}

// Function to parse front matter
function parseFrontMatter(content) {
  if (!hasFrontMatter(content)) {
    return { frontMatter: '', body: content };
  }

  const endIndex = content.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { frontMatter: '', body: content };
  }

  const frontMatter = content.substring(4, endIndex);
  const body = content.substring(endIndex + 5);

  return { frontMatter, body };
}

// Function to add author to front matter
function addAuthor(frontMatter) {
  if (frontMatter.includes('author:')) {
    return frontMatter;
  }

  // Add author after version if exists, otherwise at the beginning
  if (frontMatter.includes('version:')) {
    return frontMatter.replace(/(version:\s*["']?[^"'\n]+["']?)/, `$1\nauthor: "Development Team"`);
  } else {
    return `author: "Development Team"\n${frontMatter}`;
  }
}

// Function to fix version format
function fixVersionFormat(frontMatter) {
  // Fix version patterns like "1.0" -> "1.0.0"
  return frontMatter.replace(/version:\s*["']?(\d+)\.(\d+)["']?/g, 'version: "$1.$2.0"');
}

// Function to update file
function updateFile(filePath, updates) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { frontMatter, body } = parseFrontMatter(content);

  let newFrontMatter = frontMatter;

  if (updates.addAuthor && !frontMatter.includes('author:')) {
    newFrontMatter = addAuthor(frontMatter);
  }

  if (updates.fixVersion) {
    newFrontMatter = fixVersionFormat(newFrontMatter);
  }

  // Reconstruct file
  let newContent;
  if (hasFrontMatter(content)) {
    newContent = `---\n${newFrontMatter}\n---\n${body}`;
  } else {
    // If no front matter, create one with basic metadata
    const fileName = path.basename(filePath, '.md');
    newFrontMatter = `title: "${fileName}"\nauthor: "Development Team"\nversion: "1.0.0"`;
    newContent = `---\n${newFrontMatter}\n---\n${content}`;
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  return true;
}

// Main execution
function main() {
  const directories = ['specs/', 'docs/'];
  const allFiles = [];

  // Find all markdown files
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      allFiles.push(...findMarkdownFiles(dir));
    }
  }

  console.log(`Found ${allFiles.length} markdown files\n`);

  // STEP 1: Find files missing author or front matter
  console.log('=== STEP 1: Finding files missing author or front matter ===');
  const filesMissingAuthor = [];

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const { frontMatter } = parseFrontMatter(content);

    // Include files that either don't have front matter or don't have author
    if (!hasFrontMatter(content) || !frontMatter.includes('author:')) {
      filesMissingAuthor.push(file);
    }
  }

  console.log(`Found ${filesMissingAuthor.length} files missing author or front matter`);

  // Add author to all files missing it
  let updatedCount = 0;
  for (const file of filesMissingAuthor) {
    try {
      updateFile(file, { addAuthor: true });
      console.log(`✓ Added author/front matter to: ${file}`);
      updatedCount++;
    } catch (error) {
      console.log(`✗ Failed to update: ${file} - ${error.message}`);
    }
  }

  console.log(`\nUpdated ${updatedCount} files with author information\n`);

  // STEP 2: Find files with incorrect version format
  console.log('=== STEP 2: Finding files with incorrect version format ===');
  const filesWithWrongVersion = [];

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const { frontMatter } = parseFrontMatter(content);

    if (frontMatter.match(/version:\s*["']?(\d+)\.(\d+)["']?(?!\.\d+)/)) {
      filesWithWrongVersion.push(file);
    }
  }

  console.log(`Found ${filesWithWrongVersion.length} files with incorrect version format`);

  // Fix version format
  updatedCount = 0;
  for (const file of filesWithWrongVersion) {
    try {
      updateFile(file, { fixVersion: true });
      console.log(`✓ Fixed version in: ${file}`);
      updatedCount++;
    } catch (error) {
      console.log(`✗ Failed to update: ${file} - ${error.message}`);
    }
  }

  console.log(`\nFixed version format in ${updatedCount} files\n`);

  // Summary
  console.log('=== SUMMARY ===');
  console.log(`Files missing author: ${filesMissingAuthor.length}`);
  console.log(`Files with wrong version: ${filesWithWrongVersion.length}`);
  console.log('\nQuick fixes completed!');
}

// Run the script
main();
