import fs from 'fs';
import crypto from 'crypto'


const DESCRIPTOR_VERSION = 1;
const CID_VERSION = 1;
const HASH_ALGORITHM = 'sha256';
const CHUNKING_ALGORITHM = 'fixed-size';
const CHUNK_SIZE = 512 * 1024;

function createHash(data) {
    const hash = crypto
        .createHash(HASH_ALGORITHM)
        .update(data)
        .digest('hex')
    return hash
}

function createMerkleRoot(chunks) {
    let currentLevel = chunks.slice()
    
    while (currentLevel.length > 1) {
        let nextLevel = []
        for (let i = 0; i < currentLevel.length; i += 2) {
            let leftHash = currentLevel[i]
            let rightHash = (currentLevel[i + 1]) ? currentLevel[i + 1] : leftHash
            const combinedHash = createHash(leftHash + rightHash)
            nextLevel.push(combinedHash)
        }
        currentLevel = nextLevel
    }
    return currentLevel[0]
}

function canonicalizeDescriptor(descriptor) {
    return JSON.stringify({
        descriptorVersion: descriptor.descriptorVersion,
        cidVersion: descriptor.cidVersion,
        hashAlgorithm: descriptor.hashAlgorithm,
        chunkingAlgorithm: descriptor.chunkingAlgorithm,
        chunkSize: descriptor.chunkSize,
        contentSize: descriptor.contentSize,
        chunkCount: descriptor.chunkCount,
        chunkHashes: descriptor.chunkHashes,
        merkleRoot: descriptor.merkleRoot
    });
}

export function chunkFile(filePath) {
    return new Promise((resolve, reject) => {
        try {
            const chunkHashes = [];
            const stats = fs.statSync(filePath);
            const contentSize = stats.size;

            const readStream = fs.createReadStream(filePath, {encoding: 'utf-8',  highWaterMark: CHUNK_SIZE});
            readStream.on('data', (chunk) => {
                const chunkHash = createHash(chunk);
                chunkHashes.push(chunkHash);     
            })
            readStream.on('end', () => {
                const merkleRoot = createMerkleRoot(chunkHashes);
                const chunkCount = chunkHashes.length;

                const descriptor = {
                    descriptorVersion: DESCRIPTOR_VERSION,
                    cidVersion: CID_VERSION,
                    hashAlgorithm: HASH_ALGORITHM,
                    chunkingAlgorithm: CHUNKING_ALGORITHM,
                    chunkSize: CHUNK_SIZE,
                    contentSize,
                    chunkCount,
                    chunkHashes,
                    merkleRoot
                };

                const canonicalDescriptor = canonicalizeDescriptor(descriptor);
                const descriptorHash = createHash(canonicalDescriptor); 
                const CID = merkleRoot

                resolve ({
                    CID,
                    canonicalDescriptor,
                    descriptorHash
                })
            })
            readStream.on('error', (err) => {
                console.error('Error reading file:', err);
                reject(err);
            })
        } catch (err) {
            reject(err);
        }
    });
}

