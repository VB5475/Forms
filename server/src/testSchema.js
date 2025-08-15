// test-schema.js
// Run this script to test your database schema setup
const sql = require('msnodesqlv8');
const { initDatabase, verifySchema } = require('./schema.js');
require('dotenv').config();

const connectionString = `Server=VB5475\\SQLEXPRESS;Database=${process.env.SQL_DATABASE || 'master'};Trusted_Connection=yes;Driver={SQL Server};Encrypt=false;TrustServerCertificate=true;`;

async function testConnection() {
    console.log('🔌 Testing database connection...');

    return new Promise((resolve, reject) => {
        sql.query(connectionString, 'SELECT @@VERSION as version, DB_NAME() as database_name', (err, rows) => {
            if (err) {
                console.error('❌ Connection failed:', err.message);
                reject(err);
            } else {
                console.log('✅ Connection successful!');
                console.log('   Version:', rows[0].version.split('\n')[0]);
                console.log('   Database:', rows[0].database_name);
                resolve(rows);
            }
        });
    });
}

async function testStoredProcedure() {
    console.log('🧪 Testing stored procedure...');

    return new Promise((resolve, reject) => {
        const testQuery = `
      EXEC upsert_form_submission 
      @assessment_id = NULL, 
      @form_type = 'test_form', 
      @action_type = 'test_action', 
      @form_data = '{"test": "data", "timestamp": "2024-01-01T00:00:00Z"}'
    `;

        sql.query(connectionString, testQuery, (err, rows) => {
            if (err) {
                console.error('❌ Stored procedure test failed:', err.message);
                reject(err);
            } else {
                console.log('✅ Stored procedure test successful!');
                if (rows && rows[0]) {
                    console.log('   Assessment ID:', rows[0].assessment_id);
                    console.log('   Submission ID:', rows[0].submission_id);
                }
                resolve(rows);
            }
        });
    });
}

async function runTests() {
    console.log('=== BRIDGE FORMS DATABASE SCHEMA TEST ===\n');

    try {
        // Test 1: Connection
        await testConnection();
        console.log('');

        // Test 2: Initialize/Update Schema
        console.log('🏗️  Initializing database schema...');
        await initDatabase(sql, connectionString);
        console.log('');

        // Test 3: Test stored procedure
        await testStoredProcedure();
        console.log('');

        // Test 4: Clean up test data
        console.log('🧹 Cleaning up test data...');
        await new Promise((resolve, reject) => {
            sql.query(connectionString, "DELETE FROM [dbo].[assessment] WHERE assessment_id IN (SELECT assessment_id FROM [dbo].[form_submission] WHERE form_type = 'test_form')", (err, rows) => {
                if (err) {
                    console.warn('⚠️  Cleanup warning:', err.message);
                } else {
                    console.log('✅ Test data cleaned up');
                }
                resolve();
            });
        });

        console.log('\n🎉 ALL TESTS PASSED! Your database is ready to use.');
        console.log('\nYou can now start your server with: npm run dev');

    } catch (error) {
        console.error('\n💥 TEST FAILED:', error.message);
        console.error('\nPlease fix the above error before starting your server.');
        process.exit(1);
    }
}

// Run the tests
runTests();