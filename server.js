import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Paths
const DATA_DIR = join(__dirname, '..', 'FAQs');
const PROGRESS_FILE = join(__dirname, 'progress.json');

// Helper: Load progress
function loadProgress() {
    if (existsSync(PROGRESS_FILE)) {
        try {
            return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
        } catch (e) {
            console.error('Error loading progress:', e);
        }
    }
    return {};
}

// Helper: Save progress
function saveProgress(data) {
    writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper: Normalize column names
function normalizeColumnName(name) {
    const normalized = name.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

    const mapping = {
        'n': 'numero', 'numero': 'numero', 'nro': 'numero', 'num': 'numero',
        'seccion': 'seccion',
        'tema': 'tema',
        'pregunta': 'pregunta',
        'respuestasupercorta': 'respuesta_super_corta',
        'respuestacorta': 'respuesta_corta',
        'respuestanormal': 'respuesta_normal',
    };

    return mapping[normalized] || name;
}

// Helper: Parse Excel file
function parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    // Normalize column names
    const data = rawData.map((row, index) => {
        const normalized = {};
        for (const [key, value] of Object.entries(row)) {
            const normalizedKey = normalizeColumnName(key);
            normalized[normalizedKey] = value;
        }
        // Ensure numero exists
        if (!normalized.numero) {
            normalized.numero = index + 1;
        }
        return normalized;
    });

    return data;
}

// API: Get available Excel files
app.get('/api/files', (req, res) => {
    try {
        const files = readdirSync(DATA_DIR)
            .filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'))
            .map(f => ({
                name: f,
                path: join(DATA_DIR, f)
            }));
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Get questions from a file
app.get('/api/questions/:filename', (req, res) => {
    try {
        const filePath = join(DATA_DIR, req.params.filename);
        if (!existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        const questions = parseExcel(filePath);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Get all progress
app.get('/api/progress', (req, res) => {
    try {
        const progress = loadProgress();
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Get progress for a specific file
app.get('/api/progress/:filename', (req, res) => {
    try {
        const progress = loadProgress();
        const fileProgress = progress[req.params.filename] || {};
        res.json(fileProgress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Update progress for a question
app.post('/api/progress/:filename/:questionId', (req, res) => {
    try {
        const { filename, questionId } = req.params;
        const { confidence, marked } = req.body;

        const progress = loadProgress();

        if (!progress[filename]) {
            progress[filename] = {};
        }

        const existing = progress[filename][questionId] || {
            veces_mostrada: 0,
            ultima_confianza: null,
            confianza_sum: 0,
            confianza_count: 0,
            confianza_promedio: null,
            ultima_fecha_vista: null,
            marcada_para_repaso: false
        };

        if (confidence !== undefined) {
            existing.veces_mostrada += 1;
            existing.ultima_confianza = confidence;
            existing.confianza_sum += confidence;
            existing.confianza_count += 1;
            existing.confianza_promedio = Math.round((existing.confianza_sum / existing.confianza_count) * 100) / 100;
        }

        if (marked !== undefined) {
            existing.marcada_para_repaso = marked;
        }

        existing.ultima_fecha_vista = new Date().toISOString();

        progress[filename][questionId] = existing;
        saveProgress(progress);

        res.json(existing);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Reset progress for a file
app.delete('/api/progress/:filename', (req, res) => {
    try {
        const progress = loadProgress();
        delete progress[req.params.filename];
        saveProgress(progress);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Export progress
app.get('/api/export', (req, res) => {
    try {
        const progress = loadProgress();
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
});
