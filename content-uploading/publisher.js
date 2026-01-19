#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import { chunkFile } from './chunking.js'; 

const program = new Command();

program 
    .name('uploader')
    .description('CLI to upload content to dCDN network')
    .version('1.0.0');

program
    .command('upload <file>')
    .description('Upload a file to the dCDN network and get a CID')
    .action(async (filePath) => {
        try {
            if (!fs.existsSync(filePath)) {
                console.error('File does not exist.');
                process.exit(1);
            }
            const fileMetaData = fs.statSync(filePath);
            if (fileMetaData.size > 10 * 1024 * 1024 * 100) {
                console.error('File size exceeds 1000MB limit.');
                process.exit(1);
            }
            if (!fileMetaData.isFile()) {
                console.error('The specified path is not a file.');
                process.exit(1);
            }
            const chunkResponse = await chunkFile(filePath);
            console.log('File uploaded successfully. CID:', chunkResponse.CID);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    });

program.parse(process.argv);    


