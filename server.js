const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const configPath = path.join(__dirname, 'config.json');
const metricsPath = path.join(__dirname, 'metrics.json');

let config = { RAG: { enabled: false }, otherParam: '' };
if (fs.existsSync(configPath)) {
    try {
        config = JSON.parse(fs.readFileSync(configPath));
    } catch (err) {
        console.error('Could not read config.json');
    }
}

let metrics = { messages: 0, history: [] };
if (fs.existsSync(metricsPath)) {
    try {
        metrics = JSON.parse(fs.readFileSync(metricsPath));
    } catch (err) {
        console.error('Could not read metrics.json');
    }
}

function saveConfig() {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function saveMetrics() {
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
}

let consoleClients = [];
let metricClients = [];

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    consoleClients.push(res);
    req.on('close', () => {
        consoleClients = consoleClients.filter(c => c !== res);
    });
});

app.get('/metrics/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    metricClients.push(res);
    req.on('close', () => {
        metricClients = metricClients.filter(c => c !== res);
    });
});

app.get('/', (req, res) => {
    res.render('index', { titulo: 'Chatbot', otraSession: false, clientReady: true });
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/config', (req, res) => {
    res.json(config);
});

app.post('/admin/update', (req, res) => {
    const ragEnabled = req.body.rag === 'on' || req.body.rag === true || req.body.rag === 'true';
    config.RAG.enabled = !!ragEnabled;
    config.otherParam = req.body.otherParam || '';
    saveConfig();
    res.json({ ok: true });
});

app.get('/metrics/history', (req, res) => {
    res.json(metrics);
});

app.post('/metrics/increment', (req, res) => {
    metrics.messages += 1;
    metrics.history.push({ at: Date.now(), messages: metrics.messages });
    saveMetrics();
    metricClients.forEach(c => c.write(`data: ${JSON.stringify(metrics)}\n\n`));
    res.sendStatus(200);
});

app.post('/console', (req, res) => {
    const msg = req.body.message || '';
    consoleClients.forEach(c => c.write(`data: ${msg}\n\n`));
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
