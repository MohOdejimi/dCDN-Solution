import fs from 'fs';
import crypto from 'crypto'
import merkletree from 'merkletreejs';
const { MerkleTree } = merkletree;

function createdCID(chunks) {
    let currentLevel = chunks
    
    while (currentLevel.length > 1) {
        let nextLevel = []
        for (let i = 0; i < currentLevel.length; i += 2) {
            let leftHash = currentLevel[i]
            let rightHash
            if (currentLevel[i + 1]) {
                rightHash = currentLevel[i + 1]
            } else {
                rightHash = leftHash
            }
            const combinedHash = crypto
                .createHash('sha256')
                .update(leftHash + rightHash)
                .digest('hex')
            nextLevel.push(combinedHash)
        }
        currentLevel = nextLevel
    }
    return currentLevel[0]
}

function createChunkHash(chunk) {
    const hash = crypto
        .createHash('sha256')
        .update(chunk)
        .digest('hex')
    return hash
}

const leaves = []

export function chunkFile(filePath) {
            const fileMetaData = fs.statSync(filePath);
            const fileSize = fileMetaData.size;
            const numberOfChunks = Math.ceil(fileSize / 512 / 1024);

            const readStream = fs.createReadStream(filePath, {encoding: 'utf-8',  highWaterMark: 512 * 1024});
            readStream.on('data', (chunk) => {
                console.log('Read chunk of size:', chunk.length);
                const chunkHash = createChunkHash(chunk);
                console.log('Chunk hash:', chunkHash);
                leaves.push(chunkHash);
                // Here you would typically upload the chunk to the dCDN network
            })
            readStream.on('end', () => {
                console.log(leaves)
                const CID = createdCID(leaves)
                console.log('Generated CID:', CID);
            })
            readStream.on('error', (err) => {
                console.error('Error reading file:', err);
            })
}

