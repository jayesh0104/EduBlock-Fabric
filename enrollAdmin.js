const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const fabricSamplesPath = '/home/jayesh/fabric-samples';
        const orgPath = path.join(fabricSamplesPath, 'test-network/organizations/peerOrganizations/org1.example.com');
        
        // 1. Path to the Certificate
        const certPath = path.join(orgPath, 'users/Admin@org1.example.com/msp/signcerts/cert.pem');
        const certificate = fs.readFileSync(certPath).toString();

        // 2. Path to the Private Key (The filename is a long hash, so we read the directory)
        const keyDirPath = path.join(orgPath, 'users/Admin@org1.example.com/msp/keystore');
        const keyFiles = fs.readdirSync(keyDirPath);
        const keyPath = path.join(keyDirPath, keyFiles[0]);
        const privateKey = fs.readFileSync(keyPath).toString();

        const identity = {
            credentials: {
                certificate,
                privateKey,
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('appUser', identity);
        console.log('Successfully imported "appUser" into the wallet.');

    } catch (error) {
        console.error(`Failed to import identity: ${error}`);
    }
}

main();
