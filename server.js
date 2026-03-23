const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET_KEY = "fabric_secret_key";

const users = [
    { username: 'admin', password: '123', role: 'ADMIN' },
    { username: 'staff', password: '123', role: 'EMPLOYEE' }
];

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for Admin Routes
const isAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send("No Token Provided");
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'ADMIN') return res.status(401).send("Unauthorized");
        next();
    } catch (err) { res.status(401).send("Invalid Token"); }
};

// Fabric Connection Helper
async function getContract() {
    const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const wallet = await Wallets.newFileSystemWallet(path.join(__dirname, 'wallet'));
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork('mychannel');
    return { contract: network.getContract('certcc'), gateway };
}

// --- API ROUTES ---

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY);
        res.json({ token, role: user.role });
    } else { res.status(401).send("Invalid Credentials"); }
});

app.post('/issue', isAdmin, async (req, res) => {
    try {
        const { id, name, course, issuer, date } = req.body;
        const { contract, gateway } = await getContract();
        await contract.submitTransaction('issueCertificate', id, name, course, issuer, date);
        await gateway.disconnect();
        res.json({ message: "Success" });
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/revoke', isAdmin, async (req, res) => {
    try {
        const { id } = req.body;
        const { contract, gateway } = await getContract();
        await contract.submitTransaction('revokeCertificate', id);
        await gateway.disconnect();
        res.json({ message: "Revoked" });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/verify/:id', async (req, res) => {
    try {
        const { contract, gateway } = await getContract();
        const result = await contract.evaluateTransaction('verifyCertificate', req.params.id);
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (e) { res.status(404).send("Not Found"); }
});

// NEW: History Route
app.get('/history/:id', async (req, res) => {
    try {
        const { contract, gateway } = await getContract();
        const result = await contract.evaluateTransaction('getHistory', req.params.id);
        await gateway.disconnect();
        res.json(JSON.parse(result.toString()));
    } catch (e) { res.status(404).send("History Not Found"); }
});

app.listen(3000, () => console.log('API running on http://localhost:3000'));
