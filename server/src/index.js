// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sql = require('mssql');
const { initDatabase } = require('./schema.js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// SQL Server configuration for default instance
const config = {
  server: 'localhost', // Default instance, no instance name needed
  database: process.env.SQL_DATABASE || 'master', // Use master as fallback
  
  // Windows Authentication (using your current Windows login)
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    encrypt: false, // Set to false for local development
    trustServerCertificate: true, // Trust self-signed certificates
    requestTimeout: 30000,
    connectionTimeout: 30000
  }
};

let pool;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    pool = await sql.connect(config);
    console.log('Connected to SQL Server default instance (MSSQLSERVER)');
    
    // Initialize database schema
    await initDatabase(pool);
    console.log('Database initialized');
  } catch (e) {
    console.error('DB connection/init error:', e);
    console.error('Make sure SQL Server is running and database exists');
    process.exit(1);
  }
};

// Start database initialization
initializeDatabase();

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, server: 'localhost (MSSQLSERVER)' });
});

// Upsert form submission
app.post('/api/forms', async (req, res) => {
  const { assessment_id, form_type, action_type, ...rest } = req.body || {};
  
  if (!form_type || !action_type) {
    return res.status(400).json({ error: 'form_type and action_type are required' });
  }
  
  try {
    const request = pool.request();
    request.input('assessment_id', sql.UniqueIdentifier, assessment_id || null);
    request.input('form_type', sql.VarChar, form_type);
    request.input('action_type', sql.VarChar, action_type);
    request.input('form_data', sql.NVarChar, JSON.stringify(rest));
    
    const result = await request.execute('upsert_form_submission');
    const row = result.recordset[0];
    
    return res.json({ 
      status: 'success', 
      assessment_id: row.assessment_id, 
      submission_id: row.submission_id 
    });
  } catch (e) {
    console.error('Form submission error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Finalize assessment
app.post('/api/assessments/:assessmentId/finalize', async (req, res) => {
  const { assessmentId } = req.params;
  
  try {
    const request = pool.request();
    request.input('assessment_id', sql.UniqueIdentifier, assessmentId);
    await request.execute('finalize_assessment');
    
    return res.json({ status: 'success' });
  } catch (e) {
    console.error('Finalize assessment error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`Connected to SQL Server: localhost (default instance)`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
    await sql.close();
  } catch (e) {
    console.error('Error closing SQL connection:', e);
  }
  process.exit(0);
});