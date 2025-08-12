// simple-test.js - Test connection to default SQL Server instance
const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'master',
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    encrypt: false,
    trustServerCertificate: true
  }
};

async function testConnection() {
  console.log('Testing connection to SQL Server default instance...');
  console.log('Server: localhost (MSSQLSERVER)');
  console.log('Database: master');
  console.log('Authentication: Windows Authentication\n');
  
  try {
    const pool = await sql.connect(config);
    console.log('✅ SUCCESS: Connected to SQL Server!');
    
    // Test a simple query
    const result = await pool.request().query('SELECT @@SERVERNAME as ServerName, @@VERSION as Version');
    console.log(`Server Name: ${result.recordset[0].ServerName}`);
    console.log(`Version: ${result.recordset[0].Version.split('\n')[0]}`);
    
    await pool.close();
    console.log('\n🎉 Connection test successful! You can now run your main application.');
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    console.log('\n🔧 If this fails, you may need to:');
    console.log('1. Enable TCP/IP in SQL Server Configuration Manager');
    console.log('2. Restart SQL Server service');
    console.log('3. Check Windows Firewall');
  }
}

testConnection();