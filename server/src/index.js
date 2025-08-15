const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const sql = require('msnodesqlv8');
const { initDatabase } = require('./schema.js');
// Fix: Import uuid correctly
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
app.use(cors());

// Configure multer for FormData parsing (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    fieldSize: 5 * 1024 * 1024,  // 5MB per field
    fields: 200 // Maximum number of fields (increased for bridge forms)
  }
});

// Keep JSON parsing for backwards compatibility
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SQL Server configuration
const connectionString = `Server=VB5475\\SQLEXPRESS;Database=${process.env.SQL_DATABASE || 'BridgeAssessmentDB'};Trusted_Connection=yes;Driver={SQL Server};Encrypt=false;TrustServerCertificate=true;`;

console.log('Using connection string:', connectionString.replace(/pwd=.*?;/gi, 'pwd=***;'));

// Connection management
let connectionPool = [];
const MAX_CONNECTIONS = 10;

// Create a new connection
const createConnection = () => {
  return new Promise((resolve, reject) => {
    console.log('Creating new SQL connection...');
    sql.open(connectionString, (err, conn) => {
      if (err) {
        console.error('SQL Connection Error:', err);
        reject(err);
      } else {
        console.log('SQL Connection created successfully');
        resolve(conn);
      }
    });
  });
};

// Get a connection from the pool
const getConnection = async () => {
  if (connectionPool.length > 0) {
    return connectionPool.pop();
  }
  if (connectionPool.length < MAX_CONNECTIONS) {
    return await createConnection();
  }
  throw new Error('No available connections');
};

// Release a connection back to the pool
const releaseConnection = (conn) => {
  if (connectionPool.length < MAX_CONNECTIONS) {
    connectionPool.push(conn);
  } else {
    conn.close();
  }
};

// Initialize database
const initializeDatabase = async () => {
  console.log('Starting database initialization...');
  try {
    const testConn = await createConnection();

    // Test connection
    await new Promise((resolve, reject) => {
      testConn.query('SELECT 1 as test', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection test successful');
          resolve(rows);
        }
      });
    });

    connectionPool.push(testConn);
    console.log('Connected to SQL Server: VB5475\\SQLEXPRESS');

    // Initialize schema
    await initDatabase(sql, connectionString);
    console.log('Database schema initialized successfully');

  } catch (e) {
    console.error('=== DATABASE INITIALIZATION FAILED ===');
    console.error('Error:', e.message);
    console.error('Make sure SQL Server is running and accessible');
    setTimeout(() => process.exit(1), 1000);
  }
};

// Helper function to execute queries
const executeQuery = async (query, params = []) => {
  let conn;
  try {
    conn = await getConnection();
    return new Promise((resolve, reject) => {
      conn.query(query, params, (err, rows) => {
        if (err) {
          console.error('Query execution error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  } finally {
    if (conn) {
      releaseConnection(conn);
    }
  }
};

// Enhanced FormData parser for bridge assessment forms
const parseFormDataToObject = (req) => {
  const formData = {};
  const metadata = {};

  console.log('=== PARSING FORM DATA ===');
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Files count:', req.files ? req.files.length : 0);

  // Process form fields from req.body (parsed by multer)
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      let value = req.body[key];

      console.log(`Processing field: ${key} = ${typeof value === 'string' ? value.substring(0, 100) + '...' : value}`);

      // Handle metadata fields
      if (['assessment_id', 'form_type', 'action_type', 'timestamp', 'sheet_name'].includes(key)) {
        metadata[key] = value;
        return;
      }

      // Try to parse JSON strings back to objects/arrays
      if (typeof value === 'string') {
        // Handle span configuration and other JSON fields
        if ((value.startsWith('{') && value.endsWith('}')) ||
          (value.startsWith('[') && value.endsWith(']'))) {
          try {
            value = JSON.parse(value);
            console.log(`  -> Parsed JSON for ${key}`);
          } catch (e) {
            // Keep as string if JSON parsing fails
            console.log(`  -> Keeping ${key} as string (JSON parse failed)`);
          }
        }

        // Handle empty strings
        if (value === '') {
          value = null;
        }
      }

      formData[key] = value;
    });
  }

  // Handle files if any
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      formData[file.fieldname] = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer
      };
      console.log(`Added file: ${file.fieldname} (${file.originalname})`);
    });
  }

  console.log(`Parsed form data keys: [${Object.keys(formData).join(', ')}]`);
  console.log(`Metadata: [${Object.keys(metadata).join(', ')}]`);
  console.log('=== END PARSING ===');

  return { formData, metadata };
};

// Start database initialization
initializeDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    server: 'Bridge Assessment Backend',
    database: 'VB5475\\SQLEXPRESS',
    connections: connectionPool.length,
    maxConnections: MAX_CONNECTIONS,
    timestamp: new Date().toISOString()
  });
});

// Test database connectivity
app.get('/test-db', async (req, res) => {
  try {
    const result = await executeQuery('SELECT @@VERSION as version, DB_NAME() as current_db, GETDATE() as current_time');
    res.json({
      success: true,
      data: result[0],
      connectionPool: connectionPool.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Main form submission endpoint - handles FormData from bridge assessment forms
app.post('/api/forms', upload.any(), async (req, res) => {
  try {
    console.log('\n🌉 === BRIDGE FORM SUBMISSION ===');
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Time:', new Date().toISOString());

    // Parse FormData
    const { formData, metadata } = parseFormDataToObject(req);
    console.log('Form metadata:', metadata);
    console.log('Form data preview:', JSON.stringify(formData, null, 2).substring(0, 500) + '...');

    // Extract metadata
    const { assessment_id, form_type, action_type, timestamp } = metadata;

    // Validate required metadata
    if (!form_type || !action_type) {
      console.log('❌ Missing required metadata');
      return res.status(400).json({
        error: 'form_type and action_type are required',
        received: { form_type, action_type }
      });
    }

    // Add timestamp to form data if provided
    if (timestamp) {
      formData.submission_timestamp = timestamp;
    }

    // Add system timestamp
    formData.server_timestamp = new Date().toISOString();

    console.log('📝 STORING FORM DATA IN DATABASE...');
    console.log('Assessment ID:', assessment_id || 'NEW');
    console.log('Form Type:', form_type);
    console.log('Action:', action_type);

    let result;
    let newAssessmentId = assessment_id;

    // Generate new assessment ID if not provided
    if (!newAssessmentId) {
      newAssessmentId = uuidv4();
      console.log('Generated new assessment ID:', newAssessmentId);
    }

    // Execute appropriate stored procedure based on form type
    switch (form_type) {
      case 'form1':
        result = await executeQuery('EXEC upsert_bridge_details @assessment_id = ?, @form_data = ?',
          [newAssessmentId, JSON.stringify(formData)]);
        break;
      case 'form2':
        result = await executeQuery('EXEC upsert_survey_assessment @assessment_id = ?, @form_data = ?',
          [newAssessmentId, JSON.stringify(formData)]);
        break;
      case 'form3':
        result = await executeQuery('EXEC upsert_evaluation_remarks @assessment_id = ?, @form_data = ?',
          [newAssessmentId, JSON.stringify(formData)]);
        break;
      default:
        throw new Error(`Unknown form type: ${form_type}`);
    }

    // Log what was actually stored
    console.log('✅ FORM DATA STORED SUCCESSFULLY!');
    console.log('Database Response:', {
      assessment_id: newAssessmentId,
      form_type: form_type,
      action_type: action_type
    });

    // Show sample of stored data for verification
    if (form_type === 'form1') {
      console.log('🌉 Bridge Details stored:');
      console.log('  River:', formData.riverName);
      console.log('  Road:', formData.roadName);
      console.log('  Chainage:', formData.chainage);
      console.log('  Construction Year:', formData.constructionYear);
    } else if (form_type === 'form2') {
      console.log('📋 Survey Assessment stored:');
      console.log('  Structural Condition:', formData.structural_condition);
      console.log('  Deck Condition:', formData.deck_condition);
    } else if (form_type === 'form3') {
      console.log('📝 Evaluation & Remarks stored:');
      console.log('  Condition State:', formData.conditionState);
      console.log('  Remarks Length:', formData.remarks ? formData.remarks.length : 0);
    }

    return res.json({
      status: 'success',
      assessment_id: newAssessmentId,
      form_type: form_type,
      action_type: action_type,
      message: `${form_type} data saved successfully`,
      timestamp: new Date().toISOString(),
      data_stored: true,
      data_preview: {
        keys_stored: Object.keys(formData),
        record_count: Object.keys(formData).length
      }
    });

  } catch (error) {
    console.error('❌ Form submission error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all stored form data
app.get('/api/forms/stored-data', async (req, res) => {
  try {
    const query = `
      SELECT 
        bd.assessment_id,
        bd.river_name,
        bd.road_name,
        bd.chainage,
        bd.construction_year,
        bd.created_at as bridge_details_created,
        sa.structural_condition,
        sa.deck_condition,
        sa.created_at as survey_created,
        er.condition_state,
        er.remarks,
        er.created_at as evaluation_created
      FROM bridge_details bd
      LEFT JOIN survey_assessment sa ON bd.assessment_id = sa.assessment_id
      LEFT JOIN evaluation_remarks er ON bd.assessment_id = er.assessment_id
      ORDER BY bd.created_at DESC
    `;

    const result = await executeQuery(query);

    return res.json({
      success: true,
      message: 'Retrieved all stored form data',
      data: result,
      total_assessments: result.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error retrieving stored form data:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific assessment data
app.get('/api/forms/stored-data/:assessmentId', async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const queries = {
      bridge_details: 'SELECT * FROM bridge_details WHERE assessment_id = ?',
      survey_assessment: 'SELECT * FROM survey_assessment WHERE assessment_id = ?',
      evaluation_remarks: 'SELECT * FROM evaluation_remarks WHERE assessment_id = ?'
    };

    const results = {};

    for (const [tableName, query] of Object.entries(queries)) {
      const result = await executeQuery(query, [assessmentId]);
      results[tableName] = result.length > 0 ? result[0] : null;
    }

    if (!results.bridge_details && !results.survey_assessment && !results.evaluation_remarks) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found',
        assessment_id: assessmentId
      });
    }

    return res.json({
      success: true,
      data: {
        assessment_id: assessmentId,
        forms: results
      },
      message: `Retrieved data for assessment ${assessmentId}`
    });

  } catch (error) {
    console.error('Error retrieving assessment:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      assessment_id: assessmentId
    });
  }
});

// Get form responses in readable format
app.get('/api/forms/responses/:assessmentId', async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const queries = {
      form1: 'SELECT * FROM bridge_details WHERE assessment_id = ?',
      form2: 'SELECT * FROM survey_assessment WHERE assessment_id = ?',
      form3: 'SELECT * FROM evaluation_remarks WHERE assessment_id = ?'
    };

    const responses = {};
    let foundAny = false;

    for (const [formType, query] of Object.entries(queries)) {
      const result = await executeQuery(query, [assessmentId]);
      if (result.length > 0) {
        responses[formType] = {
          form_name: formType === 'form1' ? 'Bridge Details' :
            formType === 'form2' ? 'Survey Assessment' : 'Evaluation & Remarks',
          responses: result[0],
          last_updated: result[0].updated_at || result[0].created_at
        };
        foundAny = true;
      }
    }

    if (!foundAny) {
      return res.status(404).json({
        success: false,
        error: 'No form responses found for this assessment',
        assessment_id: assessmentId
      });
    }

    return res.json({
      success: true,
      assessment_id: assessmentId,
      form_responses: responses,
      total_forms: Object.keys(responses).length,
      message: 'Form responses retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving form responses:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      assessment_id: assessmentId
    });
  }
});

// List all assessments
app.get('/api/assessments', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        COALESCE(bd.assessment_id, sa.assessment_id, er.assessment_id) as assessment_id,
        bd.river_name,
        bd.road_name,
        bd.chainage,
        bd.construction_year,
        CASE 
          WHEN bd.assessment_id IS NOT NULL AND sa.assessment_id IS NOT NULL AND er.assessment_id IS NOT NULL THEN 'complete'
          WHEN bd.assessment_id IS NOT NULL OR sa.assessment_id IS NOT NULL OR er.assessment_id IS NOT NULL THEN 'in_progress'
          ELSE 'draft'
        END as status,
        COALESCE(bd.created_at, sa.created_at, er.created_at) as created_at,
        GREATEST(
          COALESCE(bd.updated_at, bd.created_at, '1900-01-01'),
          COALESCE(sa.updated_at, sa.created_at, '1900-01-01'),
          COALESCE(er.updated_at, er.created_at, '1900-01-01')
        ) as updated_at
      FROM bridge_details bd
      FULL OUTER JOIN survey_assessment sa ON bd.assessment_id = sa.assessment_id
      FULL OUTER JOIN evaluation_remarks er ON COALESCE(bd.assessment_id, sa.assessment_id) = er.assessment_id
      ORDER BY updated_at DESC
    `;

    const result = await executeQuery(query);

    return res.json({
      success: true,
      data: result,
      count: result.length
    });

  } catch (error) {
    console.error('Error listing assessments:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test FormData parsing endpoint
app.post('/test-formdata', upload.any(), (req, res) => {
  console.log('\n=== TESTING FORMDATA PARSING ===');
  console.log('Content-Type:', req.get('Content-Type'));

  const { formData, metadata } = parseFormDataToObject(req);

  res.json({
    success: true,
    message: 'FormData parsing test for bridge assessment',
    received: {
      contentType: req.get('Content-Type'),
      bodyKeys: Object.keys(req.body || {}),
      filesCount: req.files ? req.files.length : 0,
      metadata: metadata,
      formDataKeys: Object.keys(formData),
      sampleFormData: Object.keys(formData).slice(0, 10).reduce((obj, key) => {
        obj[key] = formData[key];
        return obj;
      }, {})
    }
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('\n🌉 === BRIDGE ASSESSMENT BACKEND SERVER ===');
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Database: VB5475\\SQLEXPRESS`);
  console.log(`📝 Database Structure: 3 Separate Tables`);
  console.log(`   - bridge_details (Form 1)`);
  console.log(`   - survey_assessment (Form 2)`);
  console.log(`   - evaluation_remarks (Form 3)`);
  console.log(`🔗 Main Endpoints:`);
  console.log(`   POST /api/forms - Submit bridge assessment forms`);
  console.log(`   GET  /api/forms/stored-data - View all stored form data`);
  console.log(`   GET  /api/forms/stored-data/:id - View specific assessment data`);
  console.log(`   GET  /api/forms/responses/:id - View form responses in readable format`);
  console.log(`   GET  /api/assessments - List all assessments`);
  console.log(`🔍 Debug Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /test-db - Database connectivity test`);
  console.log(`   POST /test-formdata - Test FormData parsing`);
  console.log(`=========================================\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');

  // Close all connections in the pool
  for (const conn of connectionPool) {
    try {
      conn.close();
    } catch (e) {
      console.warn('Warning: Error closing connection:', e.message);
    }
  }
  connectionPool = [];

  console.log('✅ All connections closed');
  process.exit(0);
});

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});