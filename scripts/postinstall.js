import { mkdir, copyFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function copyRules() {
    try {
        // Get the package root directory (two levels up from this script)
        const packageRoot = join(__dirname, '..');
        const targetDir = join(process.cwd(), '.cursor', 'rules');
        const sourceFile = join(packageRoot, '.cursorrules');
        const targetFile = join(targetDir, 'aitomics.rules');

        console.log('Installing Cursor rules for aitomics...');
        console.log(`Source: ${sourceFile}`);
        console.log(`Target: ${targetFile}`);

        // Create the target directory
        await mkdir(targetDir, { recursive: true });
        
        // Copy the rules file
        await copyFile(sourceFile, targetFile);
        
        console.log('Successfully installed Cursor rules for aitomics');
    } catch (error) {
        console.error('Error installing Cursor rules:', error);
        process.exit(1);
    }
}

copyRules(); 