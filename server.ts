import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { PRESET_TARGETS, WORKBENCH_ANALYZERS } from './src/lib/reaCatalog';
import {
  getReaCommands,
  getReaDoctor,
  getReaVersion,
  runReaAnalysis,
  runReaOnCodeSnippet,
  runReaOnUploadedBuffer,
} from './server/reaService';
import {
  buildAndroidApkKitTarGz,
  buildLinuxInstallerSh,
  buildWindowsLauncherCmd,
} from './server/appPackager';

const PORT = 3000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/rea/info', async (_req, res) => {
    try {
      const [version, commands] = await Promise.all([getReaVersion(), getReaCommands()]);
      res.json({
        packageName: 'rea-agents',
        repository: 'https://github.com/morluto/rea',
        version,
        nodeVersion: process.versions.node,
        platform: process.platform,
        arch: process.arch,
        cliCommandCount: commands.length,
        analyzers: WORKBENCH_ANALYZERS,
        presets: PRESET_TARGETS,
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load REA metadata' });
    }
  });

  app.get('/api/rea/commands', async (_req, res) => {
    try {
      const commands = await getReaCommands();
      res.json({ commands, total: commands.length });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list REA commands' });
    }
  });

  app.get('/api/rea/doctor', async (req, res) => {
    try {
      const refresh = req.query.refresh === '1';
      const report = await getReaDoctor(refresh);
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to run REA doctor' });
    }
  });

  app.post('/api/rea/analyze', async (req, res) => {
    try {
      const { command, targetPath, targetLabel } = req.body as {
        command?: string;
        targetPath?: string;
        targetLabel?: string;
      };
      if (!command || typeof command !== 'string') {
        res.status(400).json({ error: 'An analyzer command is required.' });
        return;
      }
      if (!targetPath || typeof targetPath !== 'string' || !targetPath.trim()) {
        res.status(400).json({ error: 'A target file or directory path is required.' });
        return;
      }
      const result = await runReaAnalysis(command, targetPath, targetLabel);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      res.status(400).json({ error: msg });
    }
  });

  app.post('/api/rea/analyze-snippet', async (req, res) => {
    try {
      const { command, filename, code } = req.body as {
        command?: string;
        filename?: string;
        code?: string;
      };
      if (!command || typeof command !== 'string') {
        res.status(400).json({ error: 'An analyzer command is required.' });
        return;
      }
      if (!code || typeof code !== 'string' || !code.trim()) {
        res.status(400).json({ error: 'Please paste source code or text content to analyze.' });
        return;
      }
      const result = await runReaOnCodeSnippet(command, filename || 'snippet.js', code);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Snippet analysis failed' });
    }
  });

  app.post('/api/rea/analyze-upload', upload.single('file'), async (req, res) => {
    try {
      const command = typeof req.body?.command === 'string' ? req.body.command : '';
      const file = req.file;
      if (!command) {
        res.status(400).json({ error: 'An analyzer command is required.' });
        return;
      }
      if (!file) {
        res.status(400).json({ error: 'Please attach a file to analyze.' });
        return;
      }
      const result = await runReaOnUploadedBuffer(command, file.originalname, file.buffer);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Upload analysis failed' });
    }
  });

  // Cross-platform TradingView India Desktop & Android APK Kit downloads
  app.get('/api/download/windows-launcher', (req, res) => {
    const origin = typeof req.query.origin === 'string' ? req.query.origin : undefined;
    const content = buildWindowsLauncherCmd(origin);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="TradingView-India-Launcher.cmd"');
    res.send(content);
  });

  app.get('/api/download/linux-installer', (req, res) => {
    const origin = typeof req.query.origin === 'string' ? req.query.origin : undefined;
    const content = buildLinuxInstallerSh(origin);
    res.setHeader('Content-Type', 'text/x-shellscript; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="install-tradingview-linux.sh"');
    res.send(content);
  });

  app.get('/api/download/android-apk-kit', (req, res) => {
    const origin = typeof req.query.origin === 'string' ? req.query.origin : undefined;
    const archive = buildAndroidApkKitTarGz(origin);
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', 'attachment; filename="tradingview-india-android-apk-kit.tar.gz"');
    res.send(archive);
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Ensure non-API fallback works cleanly in dev mode
    app.get('/{*splat}', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) return next();
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REA Workbench listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start REA Workbench server:', err);
  process.exit(1);
});
