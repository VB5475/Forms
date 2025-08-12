// test-connection.js - Run this to test different connection methods
const sql = require('mssql');

// Different connection configurations to try
const connections = [
  {
    name: "localhost\\CIPL24",
    config: {
      server: 'localhost\\CIPL24',
      database: 'master',
      options: {
        trustedConnection: true,
        enableArithAbort: true,
        encrypt: false,
        trustServerCertificate: true,
        instanceName: 'CIPL24'
      }
    }
  },
  {
    name: "127.0.0.1\\CIPL24", 
    config: {
      server: '127.0.0.1\\CIPL24',
      database: 'master',
      options: {
        trustedConnection: true,
        enableArithAbort: true,
        encrypt: false,
        trustServerCertificate: true,
        instanceName: 'CIPL24'
      }
    }
  },
  {
    name: "localhost with port",
    config: {
      server: 'localhost',
      port: 1433,
      database: 'master',
      options: {
        trustedConnection: true,
        enableArithAbort: true,
        encrypt: false,
        trustServerCertificate: true,
        instanceName: 'CIPL24'
      }
    }
  },
  {
    name: ".\\CIPL24",
    config: {
      server: '.\\CIPL24',
      database: 'master',
      options: {
        trustedConnection: true,
        enableArithAbort: true,
        encrypt: false,
        trustServerCertificate: true,
        instanceName: 'CIPL24'
      }
    }
  }
];

async function testConnections() {
  for (const conn of connections) {
    console.log(`\nTesting connection: ${conn.name}`);
    try {
      const pool = await sql.connect(conn.config);
      console.log(`✅ SUCCESS: Connected to ${conn.name}`);
      await pool.close();
      return conn.config; // Return the working config
    } catch (error) {
      console.log(`❌ FAILED: ${conn.name} - ${error.message}`);
    }
  }
  console.log('\n❌ All connection attempts failed');
  return null;
}

testConnections().then(workingConfig => {
  if (workingConfig) {
    console.log('\n🎉 Use this configuration in your index.js:');
    console.log(JSON.stringify(workingConfig, null, 2));
  }
});