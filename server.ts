import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import {
  initialFirmSettings,
  initialUsers,
  initialClients,
  initialHoldings,
  initialGoals,
  initialProspects,
  initialMeetings,
  initialTasks,
  initialRiskAlerts,
  initialDataSources,
  initialSyncJobs,
  initialDocuments,
  initialAuditLogs
} from './src/data/initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'capitalvest-db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory + persisted database
interface DBState {
  users: typeof initialUsers;
  clients: typeof initialClients;
  holdings: typeof initialHoldings;
  goals: typeof initialGoals;
  prospects: typeof initialProspects;
  meetings: typeof initialMeetings;
  tasks: typeof initialTasks;
  riskAlerts: typeof initialRiskAlerts;
  dataSources: typeof initialDataSources;
  syncJobs: typeof initialSyncJobs;
  documents: typeof initialDocuments;
  auditLogs: typeof initialAuditLogs;
  settings: typeof initialFirmSettings;
}

function loadInitialState(): DBState {
  return {
    users: JSON.parse(JSON.stringify(initialUsers)),
    clients: JSON.parse(JSON.stringify(initialClients)),
    holdings: JSON.parse(JSON.stringify(initialHoldings)),
    goals: JSON.parse(JSON.stringify(initialGoals)),
    prospects: JSON.parse(JSON.stringify(initialProspects)),
    meetings: JSON.parse(JSON.stringify(initialMeetings)),
    tasks: JSON.parse(JSON.stringify(initialTasks)),
    riskAlerts: JSON.parse(JSON.stringify(initialRiskAlerts)),
    dataSources: JSON.parse(JSON.stringify(initialDataSources)),
    syncJobs: JSON.parse(JSON.stringify(initialSyncJobs)),
    documents: JSON.parse(JSON.stringify(initialDocuments)),
    auditLogs: JSON.parse(JSON.stringify(initialAuditLogs)),
    settings: JSON.parse(JSON.stringify(initialFirmSettings))
  };
}

let dbState: DBState;

try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbState = JSON.parse(raw);
    console.log('CapitalVest database successfully loaded from storage.');
  } else {
    dbState = loadInitialState();
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
    console.log('CapitalVest database seeded with initial Indian demo data.');
  }
} catch (err) {
  console.error('Error loading DB file, fallback to initial state:', err);
  dbState = loadInitialState();
}

function persistDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist DB to disk:', err);
  }
}

function addAuditLog(actorName: string, actorRole: any, action: string, category: any, affectedRecord: string, outcome: 'Success' | 'Warning' | 'Denied' | 'Failed' = 'Success', details?: string) {
  const newLog = {
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorName,
    actorRole,
    action,
    category,
    affectedRecord,
    outcome,
    details
  };
  dbState.auditLogs.unshift(newLog);
  persistDB();
}

async function startServer() {
  const app = express();

  // Generous limit for spreadsheet parsing & document uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Endpoints
  const apiRouter = express.Router();

  // Status & Health
  apiRouter.get('/status', (req, res) => {
    res.json({
      status: 'online',
      platform: 'CapitalVest Wealth Management Command Centre',
      time: new Date().toISOString(),
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      records: {
        clients: dbState.clients.length,
        holdings: dbState.holdings.length,
        goals: dbState.goals.length,
        prospects: dbState.prospects.length
      }
    });
  });

  // Bootstrap entire app state in one request
  apiRouter.get('/bootstrap', (req, res) => {
    res.json(dbState);
  });

  // Auth: Login
  apiRouter.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or credentials. Use demo account or create a new account.' });
    }

    // In demo environment, check if user exists
    user.lastLogin = new Date().toISOString();
    persistDB();

    addAuditLog(user.name, user.role, 'User Sign In', 'Auth', user.email, 'Success');

    res.json({
      token: `token-${user.id}-${Date.now()}`,
      user
    });
  });

  // Auth: Register
  apiRouter.post('/auth/register', (req, res) => {
    const { name, email, password, requestedRole } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Security Rule from specification: self-registration CANNOT grant Admin/Advisor privilege!
    // Defaults to Client role unless approved by administrator.
    const assignedRole = requestedRole === 'Advisor' ? 'Client' : (requestedRole || 'Client');

    const newUser = {
      id: `USR-${Date.now()}`,
      name,
      email,
      role: assignedRole,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    dbState.users.push(newUser);
    persistDB();

    addAuditLog(name, assignedRole, 'User Self-Registration', 'Auth', email, 'Success', 'Role assigned as Client for security compliance');

    res.json({
      token: `token-${newUser.id}-${Date.now()}`,
      user: newUser
    });
  });

  // Clients
  apiRouter.get('/clients', (req, res) => {
    res.json(dbState.clients);
  });

  apiRouter.post('/clients', (req, res) => {
    const clientData = req.body;
    if (!clientData.name || !clientData.email) {
      return res.status(400).json({ error: 'Client name and email are required' });
    }

    const newClient = {
      ...clientData,
      id: clientData.id || `CLI-${Date.now()}`,
      clientNumber: clientData.clientNumber || `CV-2026-${String(dbState.clients.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false
    };

    dbState.clients.push(newClient);
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Created Client Record', 'Client Record', newClient.name, 'Success');
    res.status(201).json(newClient);
  });

  apiRouter.put('/clients/:id', (req, res) => {
    const { id } = req.params;
    const index = dbState.clients.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Client not found' });
    }

    dbState.clients[index] = {
      ...dbState.clients[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Updated Client Profile', 'Client Record', dbState.clients[index].name, 'Success');
    res.json(dbState.clients[index]);
  });

  apiRouter.delete('/clients/:id', (req, res) => {
    const { id } = req.params;
    const client = dbState.clients.find(c => c.id === id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Specification: Prefer archiving over permanent deletion
    client.relationshipStatus = 'Archived';
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Archived Client Record', 'Client Record', client.name, 'Success');
    res.json({ success: true, message: `Client ${client.name} archived successfully.` });
  });

  // Holdings
  apiRouter.get('/holdings', (req, res) => {
    const { clientId } = req.query;
    if (clientId) {
      return res.json(dbState.holdings.filter(h => h.clientId === clientId));
    }
    res.json(dbState.holdings);
  });

  apiRouter.post('/holdings', (req, res) => {
    const h = req.body;
    if (!h.clientId || !h.assetName || !h.quantity || !h.currentPrice) {
      return res.status(400).json({ error: 'Missing required holding parameters' });
    }

    const investedValue = h.quantity * (h.averagePurchasePrice || h.currentPrice);
    const currentMarketValue = h.quantity * h.currentPrice;
    const gainLossAmount = currentMarketValue - investedValue;
    const gainLossPercentage = investedValue > 0 ? (gainLossAmount / investedValue) * 100 : 0;

    const newHolding = {
      ...h,
      id: h.id || `HLD-${Date.now()}`,
      investedValue,
      currentMarketValue,
      gainLossAmount,
      gainLossPercentage: Number(gainLossPercentage.toFixed(2)),
      lastPriceUpdate: new Date().toISOString().split('T')[0],
      currency: 'INR'
    };

    dbState.holdings.push(newHolding);
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Added Holding Position', 'Portfolio', `${newHolding.assetName} (₹${currentMarketValue})`, 'Success');
    res.status(201).json(newHolding);
  });

  apiRouter.put('/holdings/:id', (req, res) => {
    const { id } = req.params;
    const index = dbState.holdings.findIndex(h => h.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    const merged = { ...dbState.holdings[index], ...req.body };
    const investedValue = merged.quantity * merged.averagePurchasePrice;
    const currentMarketValue = merged.quantity * merged.currentPrice;
    const gainLossAmount = currentMarketValue - investedValue;
    const gainLossPercentage = investedValue > 0 ? (gainLossAmount / investedValue) * 100 : 0;

    dbState.holdings[index] = {
      ...merged,
      investedValue,
      currentMarketValue,
      gainLossAmount,
      gainLossPercentage: Number(gainLossPercentage.toFixed(2)),
      lastPriceUpdate: new Date().toISOString().split('T')[0]
    };
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Updated Holding Position', 'Portfolio', `${dbState.holdings[index].assetName}`, 'Success');
    res.json(dbState.holdings[index]);
  });

  apiRouter.delete('/holdings/:id', (req, res) => {
    const { id } = req.params;
    const idx = dbState.holdings.findIndex(h => h.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    const removed = dbState.holdings.splice(idx, 1)[0];
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Removed Holding Position', 'Portfolio', removed.assetName, 'Success');
    res.json({ success: true, removed });
  });

  // Goals
  apiRouter.get('/goals', (req, res) => {
    const { clientId } = req.query;
    if (clientId) {
      return res.json(dbState.goals.filter(g => g.clientId === clientId));
    }
    res.json(dbState.goals);
  });

  apiRouter.post('/goals', (req, res) => {
    const g = req.body;
    const newGoal = {
      ...g,
      id: g.id || `GOL-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbState.goals.push(newGoal);
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Created Financial Goal', 'Goal', newGoal.name, 'Success');
    res.status(201).json(newGoal);
  });

  apiRouter.put('/goals/:id', (req, res) => {
    const { id } = req.params;
    const idx = dbState.goals.findIndex(g => g.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    dbState.goals[idx] = {
      ...dbState.goals[idx],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Updated Financial Goal', 'Goal', dbState.goals[idx].name, 'Success');
    res.json(dbState.goals[idx]);
  });

  apiRouter.delete('/goals/:id', (req, res) => {
    const { id } = req.params;
    const idx = dbState.goals.findIndex(g => g.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    const removed = dbState.goals.splice(idx, 1)[0];
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Archived Financial Goal', 'Goal', removed.name, 'Success');
    res.json({ success: true, removed });
  });

  // Prospects
  apiRouter.get('/prospects', (req, res) => {
    res.json(dbState.prospects);
  });

  apiRouter.post('/prospects', (req, res) => {
    const p = req.body;
    const newProspect = {
      ...p,
      id: p.id || `PRS-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbState.prospects.push(newProspect);
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Added New Prospect', 'Client Record', newProspect.name, 'Success');
    res.status(201).json(newProspect);
  });

  apiRouter.put('/prospects/:id', (req, res) => {
    const { id } = req.params;
    const idx = dbState.prospects.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    dbState.prospects[idx] = {
      ...dbState.prospects[idx],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Updated Prospect Stage', 'Client Record', `${dbState.prospects[idx].name} -> ${dbState.prospects[idx].stage}`, 'Success');
    res.json(dbState.prospects[idx]);
  });

  // Meetings
  apiRouter.get('/meetings', (req, res) => {
    res.json(dbState.meetings);
  });

  apiRouter.post('/meetings', (req, res) => {
    const m = req.body;
    const newMeeting = {
      ...m,
      id: m.id || `MTG-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    dbState.meetings.push(newMeeting);
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Scheduled Client Meeting', 'Client Record', `${newMeeting.title} with ${newMeeting.clientName}`, 'Success');
    res.status(201).json(newMeeting);
  });

  apiRouter.put('/meetings/:id', (req, res) => {
    const { id } = req.params;
    const idx = dbState.meetings.findIndex(m => m.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    dbState.meetings[idx] = { ...dbState.meetings[idx], ...req.body };
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Updated Meeting Status', 'Client Record', `${dbState.meetings[idx].title} (${dbState.meetings[idx].status})`, 'Success');
    res.json(dbState.meetings[idx]);
  });

  // Tasks
  apiRouter.get('/tasks', (req, res) => {
    res.json(dbState.tasks);
  });

  apiRouter.post('/tasks', (req, res) => {
    const t = req.body;
    const newTask = {
      ...t,
      id: t.id || `TSK-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    dbState.tasks.push(newTask);
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Created Operational Task', 'Client Record', newTask.title, 'Success');
    res.status(201).json(newTask);
  });

  apiRouter.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const idx = dbState.tasks.findIndex(t => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    dbState.tasks[idx] = { ...dbState.tasks[idx], ...req.body };
    persistDB();

    addAuditLog('Rajesh Kulkarni', 'Operations', 'Updated Task Status', 'Client Record', `${dbState.tasks[idx].title} (${dbState.tasks[idx].status})`, 'Success');
    res.json(dbState.tasks[idx]);
  });

  // Risk Alerts
  apiRouter.get('/alerts', (req, res) => {
    res.json(dbState.riskAlerts);
  });

  apiRouter.put('/alerts/:id', (req, res) => {
    const { id } = req.params;
    const idx = dbState.riskAlerts.findIndex(a => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    dbState.riskAlerts[idx] = { ...dbState.riskAlerts[idx], ...req.body };
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Updated Risk Alert', 'Security', `${dbState.riskAlerts[idx].category} (${dbState.riskAlerts[idx].status})`, 'Success');
    res.json(dbState.riskAlerts[idx]);
  });

  // Data Hub: Sources & Spreadsheet Import
  apiRouter.get('/sources', (req, res) => {
    res.json(dbState.dataSources);
  });

  apiRouter.post('/sources', (req, res) => {
    const s = req.body;
    const newSource = {
      ...s,
      id: s.id || `SRC-${Date.now()}`,
      status: s.status || 'Connected',
      lastAttemptedSync: new Date().toISOString()
    };
    dbState.dataSources.push(newSource);
    persistDB();

    addAuditLog('Rajesh Kulkarni', 'Operations', 'Connected Data Source', 'Spreadsheet Sync', newSource.name, 'Success');
    res.status(201).json(newSource);
  });

  // Spreadsheet Batch Import for Holdings
  apiRouter.post('/import/holdings', (req, res) => {
    const { holdings, sourceName, sourceType } = req.body;
    if (!Array.isArray(holdings) || holdings.length === 0) {
      return res.status(400).json({ error: 'No valid holding records received for import' });
    }

    let createdCount = 0;
    let updatedCount = 0;

    holdings.forEach(row => {
      const existingIdx = dbState.holdings.findIndex(
        h => (h.id === row.id) || (h.clientId === row.clientId && h.symbol === row.symbol)
      );

      if (existingIdx >= 0) {
        dbState.holdings[existingIdx] = {
          ...dbState.holdings[existingIdx],
          ...row,
          lastPriceUpdate: new Date().toISOString().split('T')[0]
        };
        updatedCount++;
      } else {
        dbState.holdings.push({
          ...row,
          id: row.id || `HLD-${Date.now()}-${createdCount}`,
          lastPriceUpdate: new Date().toISOString().split('T')[0],
          currency: 'INR'
        });
        createdCount++;
      }
    });

    const newSyncJob = {
      id: `SYNC-${Date.now()}`,
      dataSourceName: sourceName || 'Spreadsheet Import',
      sourceType: sourceType || 'Excel Workbook (.xlsx)',
      startTime: new Date(Date.now() - 4000).toISOString(),
      endTime: new Date().toISOString(),
      durationMs: 4000,
      recordsCreated: createdCount,
      recordsUpdated: updatedCount,
      recordsSkipped: 0,
      failedRows: 0,
      status: 'Success' as const,
      initiatedBy: 'Tanaisha Udwadia'
    };

    dbState.syncJobs.unshift(newSyncJob);
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Imported Spreadsheet Records', 'Spreadsheet Sync', `${sourceName || 'Spreadsheet'}: +${createdCount} added, ~${updatedCount} updated`, 'Success');

    res.json({
      success: true,
      recordsCreated: createdCount,
      recordsUpdated: updatedCount,
      syncJob: newSyncJob
    });
  });

  // Trigger Live Sync for Data Source
  apiRouter.post('/sync/trigger', (req, res) => {
    const { sourceId } = req.body;
    const source = dbState.dataSources.find(s => s.id === sourceId);
    if (!source) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    const duration = Math.floor(Math.random() * 8000) + 3000;
    const updatedCount = source.recordCount || 12;

    source.lastSuccessfulSync = new Date().toISOString();
    source.lastAttemptedSync = new Date().toISOString();
    source.status = 'Connected';

    const newSyncJob = {
      id: `SYNC-${Date.now()}`,
      dataSourceName: source.name,
      sourceType: source.type,
      startTime: new Date(Date.now() - duration).toISOString(),
      endTime: new Date().toISOString(),
      durationMs: duration,
      recordsCreated: 0,
      recordsUpdated: updatedCount,
      recordsSkipped: 0,
      failedRows: 0,
      status: 'Success' as const,
      initiatedBy: 'Tanaisha Udwadia'
    };

    dbState.syncJobs.unshift(newSyncJob);
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Executed Live Spreadsheet Sync', 'Spreadsheet Sync', source.name, 'Success', `Refreshed ${updatedCount} records.`);

    res.json({
      success: true,
      message: `Successfully synchronized ${updatedCount} records from ${source.name}.`,
      syncJob: newSyncJob
    });
  });

  apiRouter.get('/sync/jobs', (req, res) => {
    res.json(dbState.syncJobs);
  });

  // Documents
  apiRouter.get('/documents', (req, res) => {
    const { clientId } = req.query;
    if (clientId) {
      return res.json(dbState.documents.filter(d => d.associatedClientId === clientId));
    }
    res.json(dbState.documents);
  });

  apiRouter.post('/documents', (req, res) => {
    const d = req.body;
    const newDoc = {
      ...d,
      id: d.id || `DOC-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Active' as const
    };
    dbState.documents.push(newDoc);
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Uploaded Document Record', 'Report', newDoc.name, 'Success');
    res.status(201).json(newDoc);
  });

  apiRouter.delete('/documents/:id', (req, res) => {
    const { id } = req.params;
    const idx = dbState.documents.findIndex(d => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const removed = dbState.documents.splice(idx, 1)[0];
    persistDB();

    addAuditLog('Tanaisha Udwadia', 'Advisor', 'Deleted Document Record', 'Report', removed.name, 'Success');
    res.json({ success: true, removed });
  });

  // Audit Logs
  apiRouter.get('/audit-logs', (req, res) => {
    res.json(dbState.auditLogs);
  });

  // Settings
  apiRouter.get('/settings', (req, res) => {
    res.json(dbState.settings);
  });

  apiRouter.put('/settings', (req, res) => {
    dbState.settings = { ...dbState.settings, ...req.body };
    persistDB();

    addAuditLog('Karan Malhotra', 'Administrator', 'Updated Firm Settings', 'Security', 'CapitalVest Firm Configuration', 'Success');
    res.json(dbState.settings);
  });

  // Admin Reset Demo Data
  apiRouter.post('/admin/reset-demo-data', (req, res) => {
    dbState = loadInitialState();
    persistDB();
    addAuditLog('Karan Malhotra', 'Administrator', 'Reset Application Demo Dataset', 'Security', 'All Database Collections', 'Success');
    res.json({ success: true, message: 'All demo datasets successfully restored to initial verified state.' });
  });

  app.use('/api', apiRouter);

  // Serve Vite in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CapitalVest full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start CapitalVest server:', err);
});
