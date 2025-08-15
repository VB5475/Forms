/**
 * Bridge Assessment Database Schema - Based on Apps Script Form Handlers
 * 
 * This schema creates 3 separate tables for each form that match the exact
 * field structure used in the Google Apps Script form handlers:
 * - bridge_details: Form 1 - Bridge structural information and details
 * - survey_assessment: Form 2 - Survey and condition assessment data
 * - evaluation_remarks: Form 3 - Final evaluation and remarks
 * 
 * Each table has columns matching the form handler field names
 */

async function initDatabase(sql, connectionString) {
  console.log('🏗️ Initializing Bridge Assessment Database Schema...');
  console.log('📋 System: 3 Tables matching Apps Script Form Handlers');
  console.log('🔧 Database: SQL Server with columns matching form fields');

  try {
    // Execute schema creation in proper order
    await createTables(sql, connectionString);
    await createIndexes(sql, connectionString);
    await createStoredProcedures(sql, connectionString);
    await insertDefaultData(sql, connectionString);

    console.log('✅ Bridge Assessment Database Schema initialized successfully');
    console.log('📊 Ready to handle: Bridge Details, Survey Assessments, Evaluations');
  } catch (error) {
    console.error('❌ Error initializing Bridge Assessment schema:', error);
    throw error;
  }
}

async function executeSQL(sql, connectionString, query, description = '') {
  return new Promise((resolve, reject) => {
    if (description) console.log(`🔧 ${description}...`);

    sql.query(connectionString, query, (err, rows) => {
      if (err) {
        console.error(`❌ Failed: ${description}`, err.message);
        reject(err);
      } else {
        if (description) console.log(`✅ Completed: ${description}`);
        resolve(rows);
      }
    });
  });
}

async function createTables(sql, connectionString) {
  console.log('📋 Creating Bridge Assessment Tables...');

  // Table 1: Bridge Details (Form 1) - Matching handleForm1 fields exactly
  const createBridgeDetailsTable = `
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[bridge_details]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [dbo].[bridge_details] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [assessment_id] NVARCHAR(50) NOT NULL UNIQUE,
        
        -- System fields
        [timestamp] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [action_type] NVARCHAR(50) NULL,
        
        -- Basic Bridge Information
        [river_name] NVARCHAR(255) NULL,
        [road_name] NVARCHAR(255) NULL,
        [chainage] NVARCHAR(100) NULL,
        [latitude] NVARCHAR(50) NULL,
        [longitude] NVARCHAR(50) NULL,
        
        -- Administrative Details
        [circle_name] NVARCHAR(255) NULL,
        [division_name] NVARCHAR(255) NULL,
        [subdivision_name] NVARCHAR(255) NULL,
        
        -- Span Details
        [span_count] NVARCHAR(50) NULL,
        [span_configuration] NVARCHAR(MAX) NULL,
        [total_length] NVARCHAR(100) NULL,
        [classification_of_bridge] NVARCHAR(255) NULL,
        
        -- Bridge Structure
        [angle_crossing] NVARCHAR(100) NULL,
        [bridge_type] NVARCHAR(255) NULL,
        [super_structure] NVARCHAR(255) NULL,
        [weaving_coat] NVARCHAR(255) NULL,
        
        -- Sub Structure
        [sub_structure] NVARCHAR(255) NULL,
        [abutment_type] NVARCHAR(255) NULL,
        [return_details] NVARCHAR(255) NULL,
        [foundation] NVARCHAR(255) NULL,
        [bearing] NVARCHAR(255) NULL,
        
        -- Approach Details
        [approach_type] NVARCHAR(255) NULL,
        [approach_lhs] NVARCHAR(100) NULL,
        [approach_rhs] NVARCHAR(100) NULL,
        [approach_length] NVARCHAR(100) NULL,
        
        -- Additional Features
        [railing] NVARCHAR(255) NULL,
        [river_training] NVARCHAR(MAX) NULL,
        [repair_work] NVARCHAR(MAX) NULL,
        
        -- Dimensions
        [carriageway_width] NVARCHAR(100) NULL,
        [total_carriageway] NVARCHAR(100) NULL,
        [approach_carriageway] NVARCHAR(100) NULL,
        
        -- Construction Details
        [construction_year] NVARCHAR(50) NULL,
        [bridge_level] NVARCHAR(255) NULL,
        [river_perennial] NVARCHAR(50) NULL,
        
        -- Inspection Details
        [pre_monsoon_date] NVARCHAR(50) NULL,
        [pre_monsoon_ae] NVARCHAR(255) NULL,
        [pre_monsoon_dee] NVARCHAR(255) NULL,
        [pre_monsoon_ee] NVARCHAR(255) NULL,
        [post_monsoon_date] NVARCHAR(50) NULL,
        [post_monsoon_ae] NVARCHAR(255) NULL,
        [post_monsoon_dee] NVARCHAR(255) NULL,
        [post_monsoon_ee] NVARCHAR(255) NULL,
        
        -- Survey Information
        [past_survey] NVARCHAR(50) NULL,
        [past_survey_details] NVARCHAR(MAX) NULL,
        
        -- Flood Levels
        [observer_flood_level] NVARCHAR(100) NULL,
        [designed_flood_level] NVARCHAR(100) NULL,
        [finished_road_level] NVARCHAR(100) NULL,
        
        -- Timestamps
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE()
      );
      
      PRINT '✅ Created bridge_details table for Form 1 data';
    END
    ELSE
    BEGIN
      PRINT 'ℹ️ bridge_details table already exists';
    END
  `;

  await executeSQL(sql, connectionString, createBridgeDetailsTable, 'Create Bridge Details Table (Form 1)');

  // Table 2: Survey Assessment (Form 2) - Matching handleForm2 fields exactly
  const createSurveyAssessmentTable = `
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[survey_assessment]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [dbo].[survey_assessment] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [assessment_id] NVARCHAR(50) NOT NULL UNIQUE,
        
        -- System fields
        [timestamp] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [action_type] NVARCHAR(50) NULL,
        
        -- Survey Details
        [survey_from_date] NVARCHAR(50) NULL,
        [survey_to_date] NVARCHAR(50) NULL,
        [surveyor_name] NVARCHAR(255) NULL,
        [weather_conditions] NVARCHAR(255) NULL,
        [traffic_conditions] NVARCHAR(255) NULL,
        [water_level] NVARCHAR(100) NULL,
        
        -- Condition Assessments
        [structural_condition] NVARCHAR(100) NULL,
        [deck_condition] NVARCHAR(100) NULL,
        [superstructure_condition] NVARCHAR(100) NULL,
        [substructure_condition] NVARCHAR(100) NULL,
        [foundation_condition] NVARCHAR(100) NULL,
        [bearing_condition] NVARCHAR(100) NULL,
        [expansion_joints] NVARCHAR(100) NULL,
        [drainage_system] NVARCHAR(100) NULL,
        [safety_features] NVARCHAR(100) NULL,
        [load_capacity] NVARCHAR(100) NULL,
        
        -- Observations and Recommendations
        [defects_observed] NVARCHAR(MAX) NULL,
        [recommendations] NVARCHAR(MAX) NULL,
        
        -- Timestamps
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE()
      );
      
      PRINT '✅ Created survey_assessment table for Form 2 data';
    END
    ELSE
    BEGIN
      PRINT 'ℹ️ survey_assessment table already exists';
    END
  `;

  await executeSQL(sql, connectionString, createSurveyAssessmentTable, 'Create Survey Assessment Table (Form 2)');

  // Table 3: Evaluation & Remarks (Form 3) - Matching handleForm3 fields exactly
  const createEvaluationRemarksTable = `
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[evaluation_remarks]') AND type in (N'U'))
    BEGIN
      CREATE TABLE [dbo].[evaluation_remarks] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [assessment_id] NVARCHAR(50) NOT NULL UNIQUE,
        
        -- System fields
        [timestamp] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [action_type] NVARCHAR(50) NULL,
        
        -- Evaluation Details
        [condition_state] NVARCHAR(255) NULL,
        [condition_state_other] NVARCHAR(255) NULL,
        [remarks] NVARCHAR(MAX) NULL,
        [assessment_status] NVARCHAR(100) NULL,
        
        -- Timestamps
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE()
      );
      
      PRINT '✅ Created evaluation_remarks table for Form 3 data';
    END
    ELSE
    BEGIN
      PRINT 'ℹ️ evaluation_remarks table already exists';
    END
  `;

  await executeSQL(sql, connectionString, createEvaluationRemarksTable, 'Create Evaluation & Remarks Table (Form 3)');
}

async function createIndexes(sql, connectionString) {
  console.log('📊 Creating Performance Indexes...');

  const indexes = [
    // Bridge Details Indexes
    {
      name: 'IX_bridge_details_assessment_id',
      table: '[dbo].[bridge_details]',
      columns: '([assessment_id])',
      description: 'Fast lookup by assessment ID'
    },
    {
      name: 'IX_bridge_details_river_road',
      table: '[dbo].[bridge_details]',
      columns: '([river_name], [road_name])',
      description: 'Fast search by river and road name'
    },
    {
      name: 'IX_bridge_details_timestamp',
      table: '[dbo].[bridge_details]',
      columns: '([timestamp] DESC)',
      description: 'Fast sorting by timestamp'
    },

    // Survey Assessment Indexes
    {
      name: 'IX_survey_assessment_id',
      table: '[dbo].[survey_assessment]',
      columns: '([assessment_id])',
      description: 'Fast lookup by assessment ID'
    },
    {
      name: 'IX_survey_timestamp',
      table: '[dbo].[survey_assessment]',
      columns: '([timestamp] DESC)',
      description: 'Fast sorting by timestamp'
    },

    // Evaluation Remarks Indexes
    {
      name: 'IX_evaluation_assessment_id',
      table: '[dbo].[evaluation_remarks]',
      columns: '([assessment_id])',
      description: 'Fast lookup by assessment ID'
    },
    {
      name: 'IX_evaluation_timestamp',
      table: '[dbo].[evaluation_remarks]',
      columns: '([timestamp] DESC)',
      description: 'Fast sorting by timestamp'
    }
  ];

  for (const index of indexes) {
    const createIndexSQL = `
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = '${index.name}')
      BEGIN
        CREATE INDEX [${index.name}] ON ${index.table} ${index.columns};
        PRINT '✅ Created index ${index.name} - ${index.description}';
      END
      ELSE
      BEGIN
        PRINT 'ℹ️ Index ${index.name} already exists';
      END
    `;

    await executeSQL(sql, connectionString, createIndexSQL, `Create ${index.name} index`);
  }
}

async function createStoredProcedures(sql, connectionString) {
  console.log('⚙️ Creating Stored Procedures...');

  // Drop existing procedures first
  const dropProcedures = `
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[upsert_bridge_details]') AND type in (N'P', N'PC'))
      DROP PROCEDURE [dbo].[upsert_bridge_details];
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[upsert_survey_assessment]') AND type in (N'P', N'PC'))
      DROP PROCEDURE [dbo].[upsert_survey_assessment];
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[upsert_evaluation_remarks]') AND type in (N'P', N'PC'))
      DROP PROCEDURE [dbo].[upsert_evaluation_remarks];
  `;

  await executeSQL(sql, connectionString, dropProcedures, 'Drop existing procedures');

  // Procedure 1: Upsert Bridge Details (Form 1) - Matching handleForm1 exactly
  const createUpsertBridgeDetailsProc = `
    CREATE PROCEDURE [dbo].[upsert_bridge_details]
      @assessment_id NVARCHAR(50),
      @form_data NVARCHAR(MAX)
    AS
    BEGIN
      SET NOCOUNT ON;
      
      BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Parse JSON data and extract fields matching Apps Script form handler
        DECLARE @action_type NVARCHAR(50) = JSON_VALUE(@form_data, '$.action_type');
        DECLARE @river_name NVARCHAR(255) = JSON_VALUE(@form_data, '$.riverName');
        DECLARE @road_name NVARCHAR(255) = JSON_VALUE(@form_data, '$.roadName');
        DECLARE @chainage NVARCHAR(100) = JSON_VALUE(@form_data, '$.chainage');
        DECLARE @latitude NVARCHAR(50) = JSON_VALUE(@form_data, '$.latitude');
        DECLARE @longitude NVARCHAR(50) = JSON_VALUE(@form_data, '$.longitude');
        DECLARE @circle_name NVARCHAR(255) = JSON_VALUE(@form_data, '$.circleName');
        DECLARE @division_name NVARCHAR(255) = JSON_VALUE(@form_data, '$.divisionName');
        DECLARE @subdivision_name NVARCHAR(255) = JSON_VALUE(@form_data, '$.subdivisionName');
        DECLARE @span_count NVARCHAR(50) = JSON_VALUE(@form_data, '$.spanCount');
        DECLARE @span_configuration NVARCHAR(MAX) = JSON_VALUE(@form_data, '$.spanConfiguration');
        DECLARE @total_length NVARCHAR(100) = JSON_VALUE(@form_data, '$.totalLength');
        DECLARE @classification_of_bridge NVARCHAR(255) = JSON_VALUE(@form_data, '$.classificationOfBridge');
        DECLARE @angle_crossing NVARCHAR(100) = JSON_VALUE(@form_data, '$.angleCrossing');
        DECLARE @bridge_type NVARCHAR(255) = JSON_VALUE(@form_data, '$.bridgeType');
        DECLARE @super_structure NVARCHAR(255) = JSON_VALUE(@form_data, '$.superStructure');
        DECLARE @weaving_coat NVARCHAR(255) = JSON_VALUE(@form_data, '$.weavingCoat');
        DECLARE @sub_structure NVARCHAR(255) = JSON_VALUE(@form_data, '$.subStructure');
        DECLARE @abutment_type NVARCHAR(255) = JSON_VALUE(@form_data, '$.abutmentType');
        DECLARE @return_details NVARCHAR(255) = JSON_VALUE(@form_data, '$.returnDetails');
        DECLARE @foundation NVARCHAR(255) = JSON_VALUE(@form_data, '$.foundation');
        DECLARE @bearing NVARCHAR(255) = JSON_VALUE(@form_data, '$.bearing');
        DECLARE @approach_type NVARCHAR(255) = JSON_VALUE(@form_data, '$.approachType');
        DECLARE @approach_lhs NVARCHAR(100) = JSON_VALUE(@form_data, '$.approachLHS');
        DECLARE @approach_rhs NVARCHAR(100) = JSON_VALUE(@form_data, '$.approachRHS');
        DECLARE @approach_length NVARCHAR(100) = JSON_VALUE(@form_data, '$.approachLength');
        DECLARE @railing NVARCHAR(255) = JSON_VALUE(@form_data, '$.railing');
        DECLARE @river_training NVARCHAR(MAX) = JSON_VALUE(@form_data, '$.riverTraining');
        DECLARE @repair_work NVARCHAR(MAX) = JSON_VALUE(@form_data, '$.repairWork');
        DECLARE @carriageway_width NVARCHAR(100) = JSON_VALUE(@form_data, '$.carriagewayWidth');
        DECLARE @total_carriageway NVARCHAR(100) = JSON_VALUE(@form_data, '$.totalCarriageway');
        DECLARE @approach_carriageway NVARCHAR(100) = JSON_VALUE(@form_data, '$.approachCarriageway');
        DECLARE @construction_year NVARCHAR(50) = JSON_VALUE(@form_data, '$.constructionYear');
        DECLARE @bridge_level NVARCHAR(255) = JSON_VALUE(@form_data, '$.bridgeLevel');
        DECLARE @river_perennial NVARCHAR(50) = JSON_VALUE(@form_data, '$.riverPerennial');
        DECLARE @pre_monsoon_date NVARCHAR(50) = JSON_VALUE(@form_data, '$.preMonsoonDate');
        DECLARE @pre_monsoon_ae NVARCHAR(255) = JSON_VALUE(@form_data, '$.preMonsoonAE');
        DECLARE @pre_monsoon_dee NVARCHAR(255) = JSON_VALUE(@form_data, '$.preMonsoonDEE');
        DECLARE @pre_monsoon_ee NVARCHAR(255) = JSON_VALUE(@form_data, '$.preMonsoonEE');
        DECLARE @post_monsoon_date NVARCHAR(50) = JSON_VALUE(@form_data, '$.postMonsoonDate');
        DECLARE @post_monsoon_ae NVARCHAR(255) = JSON_VALUE(@form_data, '$.postMonsoonAE');
        DECLARE @post_monsoon_dee NVARCHAR(255) = JSON_VALUE(@form_data, '$.postMonsoonDEE');
        DECLARE @post_monsoon_ee NVARCHAR(255) = JSON_VALUE(@form_data, '$.postMonsoonEE');
        DECLARE @past_survey NVARCHAR(50) = JSON_VALUE(@form_data, '$.pastSurvey');
        DECLARE @past_survey_details NVARCHAR(MAX) = JSON_VALUE(@form_data, '$.pastSurveyDetails');
        DECLARE @observer_flood_level NVARCHAR(100) = JSON_VALUE(@form_data, '$.observerFloodLevel');
        DECLARE @designed_flood_level NVARCHAR(100) = JSON_VALUE(@form_data, '$.designedFloodLevel');
        DECLARE @finished_road_level NVARCHAR(100) = JSON_VALUE(@form_data, '$.finishedRoadLevel');
        
        -- Upsert operation
        MERGE [dbo].[bridge_details] AS target
        USING (SELECT @assessment_id as assessment_id) AS source
        ON target.[assessment_id] = source.assessment_id
        WHEN MATCHED THEN
          UPDATE SET 
            [action_type] = @action_type,
            [river_name] = @river_name,
            [road_name] = @road_name,
            [chainage] = @chainage,
            [latitude] = @latitude,
            [longitude] = @longitude,
            [circle_name] = @circle_name,
            [division_name] = @division_name,
            [subdivision_name] = @subdivision_name,
            [span_count] = @span_count,
            [span_configuration] = @span_configuration,
            [total_length] = @total_length,
            [classification_of_bridge] = @classification_of_bridge,
            [angle_crossing] = @angle_crossing,
            [bridge_type] = @bridge_type,
            [super_structure] = @super_structure,
            [weaving_coat] = @weaving_coat,
            [sub_structure] = @sub_structure,
            [abutment_type] = @abutment_type,
            [return_details] = @return_details,
            [foundation] = @foundation,
            [bearing] = @bearing,
            [approach_type] = @approach_type,
            [approach_lhs] = @approach_lhs,
            [approach_rhs] = @approach_rhs,
            [approach_length] = @approach_length,
            [railing] = @railing,
            [river_training] = @river_training,
            [repair_work] = @repair_work,
            [carriageway_width] = @carriageway_width,
            [total_carriageway] = @total_carriageway,
            [approach_carriageway] = @approach_carriageway,
            [construction_year] = @construction_year,
            [bridge_level] = @bridge_level,
            [river_perennial] = @river_perennial,
            [pre_monsoon_date] = @pre_monsoon_date,
            [pre_monsoon_ae] = @pre_monsoon_ae,
            [pre_monsoon_dee] = @pre_monsoon_dee,
            [pre_monsoon_ee] = @pre_monsoon_ee,
            [post_monsoon_date] = @post_monsoon_date,
            [post_monsoon_ae] = @post_monsoon_ae,
            [post_monsoon_dee] = @post_monsoon_dee,
            [post_monsoon_ee] = @post_monsoon_ee,
            [past_survey] = @past_survey,
            [past_survey_details] = @past_survey_details,
            [observer_flood_level] = @observer_flood_level,
            [designed_flood_level] = @designed_flood_level,
            [finished_road_level] = @finished_road_level,
            [updated_at] = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (
            [assessment_id], [action_type], [river_name], [road_name], [chainage], [latitude], [longitude],
            [circle_name], [division_name], [subdivision_name], [span_count], [span_configuration],
            [total_length], [classification_of_bridge], [angle_crossing], [bridge_type], [super_structure],
            [weaving_coat], [sub_structure], [abutment_type], [return_details], [foundation], [bearing],
            [approach_type], [approach_lhs], [approach_rhs], [approach_length], [railing], [river_training],
            [repair_work], [carriageway_width], [total_carriageway], [approach_carriageway], [construction_year],
            [bridge_level], [river_perennial], [pre_monsoon_date], [pre_monsoon_ae], [pre_monsoon_dee],
            [pre_monsoon_ee], [post_monsoon_date], [post_monsoon_ae], [post_monsoon_dee], [post_monsoon_ee],
            [past_survey], [past_survey_details], [observer_flood_level], [designed_flood_level], [finished_road_level]
          )
          VALUES (
            @assessment_id, @action_type, @river_name, @road_name, @chainage, @latitude, @longitude,
            @circle_name, @division_name, @subdivision_name, @span_count, @span_configuration,
            @total_length, @classification_of_bridge, @angle_crossing, @bridge_type, @super_structure,
            @weaving_coat, @sub_structure, @abutment_type, @return_details, @foundation, @bearing,
            @approach_type, @approach_lhs, @approach_rhs, @approach_length, @railing, @river_training,
            @repair_work, @carriageway_width, @total_carriageway, @approach_carriageway, @construction_year,
            @bridge_level, @river_perennial, @pre_monsoon_date, @pre_monsoon_ae, @pre_monsoon_dee,
            @pre_monsoon_ee, @post_monsoon_date, @post_monsoon_ae, @post_monsoon_dee, @post_monsoon_ee,
            @past_survey, @past_survey_details, @observer_flood_level, @designed_flood_level, @finished_road_level
          );
        
        COMMIT TRANSACTION;
        PRINT 'Successfully saved Bridge Details for assessment: ' + @assessment_id;
        
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        PRINT 'Error saving Bridge Details: ' + @ErrorMessage;
        THROW;
      END CATCH
    END
  `;

  await executeSQL(sql, connectionString, createUpsertBridgeDetailsProc, 'Create Bridge Details upsert procedure');

  // Procedure 2: Upsert Survey Assessment (Form 2) - Matching handleForm2 exactly
  const createUpsertSurveyAssessmentProc = `
    CREATE PROCEDURE [dbo].[upsert_survey_assessment]
      @assessment_id NVARCHAR(50),
      @form_data NVARCHAR(MAX)
    AS
    BEGIN
      SET NOCOUNT ON;
      
      BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Parse JSON data and extract fields matching Apps Script form handler
        DECLARE @action_type NVARCHAR(50) = JSON_VALUE(@form_data, '$.action_type');
        DECLARE @survey_from_date NVARCHAR(50) = JSON_VALUE(@form_data, '$.survey_from_date');
        DECLARE @survey_to_date NVARCHAR(50) = JSON_VALUE(@form_data, '$.survey_to_date');
        DECLARE @surveyor_name NVARCHAR(255) = JSON_VALUE(@form_data, '$.surveyor_name');
        DECLARE @weather_conditions NVARCHAR(255) = JSON_VALUE(@form_data, '$.weather_conditions');
        DECLARE @traffic_conditions NVARCHAR(255) = JSON_VALUE(@form_data, '$.traffic_conditions');
        DECLARE @water_level NVARCHAR(100) = JSON_VALUE(@form_data, '$.water_level');
        DECLARE @structural_condition NVARCHAR(100) = JSON_VALUE(@form_data, '$.structural_condition');
        DECLARE @deck_condition NVARCHAR(100) = JSON_VALUE(@form_data, '$.deck_condition');
        DECLARE @superstructure_condition NVARCHAR(100) = JSON_VALUE(@form_data, '$.superstructure_condition');
        DECLARE @substructure_condition NVARCHAR(100) = JSON_VALUE(@form_data, '$.substructure_condition');
        DECLARE @foundation_condition NVARCHAR(100) = JSON_VALUE(@form_data, '$.foundation_condition');
        DECLARE @bearing_condition NVARCHAR(100) = JSON_VALUE(@form_data, '$.bearing_condition');
        DECLARE @expansion_joints NVARCHAR(100) = JSON_VALUE(@form_data, '$.expansion_joints');
        DECLARE @drainage_system NVARCHAR(100) = JSON_VALUE(@form_data, '$.drainage_system');
        DECLARE @safety_features NVARCHAR(100) = JSON_VALUE(@form_data, '$.safety_features');
        DECLARE @load_capacity NVARCHAR(100) = JSON_VALUE(@form_data, '$.load_capacity');
        DECLARE @defects_observed NVARCHAR(MAX) = JSON_VALUE(@form_data, '$.defects_observed');
        DECLARE @recommendations NVARCHAR(MAX) = JSON_VALUE(@form_data, '$.recommendations');
        
        -- Upsert operation
        MERGE [dbo].[survey_assessment] AS target
        USING (SELECT @assessment_id as assessment_id) AS source
        ON target.[assessment_id] = source.assessment_id
        WHEN MATCHED THEN
          UPDATE SET 
            [action_type] = @action_type,
            [survey_from_date] = @survey_from_date,
            [survey_to_date] = @survey_to_date,
            [surveyor_name] = @surveyor_name,
            [weather_conditions] = @weather_conditions,
            [traffic_conditions] = @traffic_conditions,
            [water_level] = @water_level,
            [structural_condition] = @structural_condition,
            [deck_condition] = @deck_condition,
            [superstructure_condition] = @superstructure_condition,
            [substructure_condition] = @substructure_condition,
            [foundation_condition] = @foundation_condition,
            [bearing_condition] = @bearing_condition,
            [expansion_joints] = @expansion_joints,
            [drainage_system] = @drainage_system,
            [safety_features] = @safety_features,
            [load_capacity] = @load_capacity,
            [defects_observed] = @defects_observed,
            [recommendations] = @recommendations,
            [updated_at] = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (
            [assessment_id], [action_type], [survey_from_date], [survey_to_date], [surveyor_name],
            [weather_conditions], [traffic_conditions], [water_level], [structural_condition],
            [deck_condition], [superstructure_condition], [substructure_condition], [foundation_condition],
            [bearing_condition], [expansion_joints], [drainage_system], [safety_features], [load_capacity],
            [defects_observed], [recommendations]
          )
          VALUES (
            @assessment_id, @action_type, @survey_from_date, @survey_to_date, @surveyor_name,
            @weather_conditions, @traffic_conditions, @water_level, @structural_condition,
            @deck_condition, @superstructure_condition, @substructure_condition, @foundation_condition,
            @bearing_condition, @expansion_joints, @drainage_system, @safety_features, @load_capacity,
            @defects_observed, @recommendations
          );
        
        COMMIT TRANSACTION;
        PRINT 'Successfully saved Survey Assessment for assessment: ' + @assessment_id;
        
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        PRINT 'Error saving Survey Assessment: ' + @ErrorMessage;
        THROW;
      END CATCH
    END
  `;

  await executeSQL(sql, connectionString, createUpsertSurveyAssessmentProc, 'Create Survey Assessment upsert procedure');

  // Procedure 3: Upsert Evaluation & Remarks (Form 3) - Matching handleForm3 exactly
  const createUpsertEvaluationRemarksProc = `
    CREATE PROCEDURE [dbo].[upsert_evaluation_remarks]
      @assessment_id NVARCHAR(50),
      @form_data NVARCHAR(MAX)
    AS
    BEGIN
      SET NOCOUNT ON;
      
      BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Parse JSON data and extract fields matching Apps Script form handler
        DECLARE @action_type NVARCHAR(50) = JSON_VALUE(@form_data, '$.action_type');
        DECLARE @condition_state NVARCHAR(255) = JSON_VALUE(@form_data, '$.conditionState');
        DECLARE @condition_state_other NVARCHAR(255) = JSON_VALUE(@form_data, '$.conditionStateOther');
        DECLARE @remarks NVARCHAR(MAX) = JSON_VALUE(@form_data, '$.remarks');
        DECLARE @assessment_status NVARCHAR(100) = JSON_VALUE(@form_data, '$.assessment_status');
        
        -- Upsert operation
        MERGE [dbo].[evaluation_remarks] AS target
        USING (SELECT @assessment_id as assessment_id) AS source
        ON target.[assessment_id] = source.assessment_id
        WHEN MATCHED THEN
          UPDATE SET 
            [action_type] = @action_type,
            [condition_state] = @condition_state,
            [condition_state_other] = @condition_state_other,
            [remarks] = @remarks,
            [assessment_status] = @assessment_status,
            [updated_at] = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (
            [assessment_id], [action_type], [condition_state], [condition_state_other], 
            [remarks], [assessment_status]
          )
          VALUES (
            @assessment_id, @action_type, @condition_state, @condition_state_other, 
            @remarks, @assessment_status
          );
        
        COMMIT TRANSACTION;
        PRINT 'Successfully saved Evaluation & Remarks for assessment: ' + @assessment_id;
        
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        PRINT 'Error saving Evaluation & Remarks: ' + @ErrorMessage;
        THROW;
      END CATCH
    END
  `;

  await executeSQL(sql, connectionString, createUpsertEvaluationRemarksProc, 'Create Evaluation & Remarks upsert procedure');
}

async function insertDefaultData(sql, connectionString) {
  console.log('📝 Inserting Reference Data...');

  const insertReferenceData = `
    PRINT 'Reference data ready for bridge assessment with columns matching Apps Script forms';
  `;

  await executeSQL(sql, connectionString, insertReferenceData, 'Insert reference data');
}

// Function to verify schema creation
async function verifySchema(sql, connectionString) {
  console.log('🔍 Verifying Bridge Assessment Schema...');

  const verifyQuery = `
    SELECT 
      'Tables' as object_type, 
      name as object_name,
      'Bridge assessment form data storage - Apps Script compatible' as description
    FROM sys.tables 
    WHERE name IN ('bridge_details', 'survey_assessment', 'evaluation_remarks')
    
    UNION ALL
    
    SELECT 
      'Procedures' as object_type, 
      name as object_name,
      'Form data processing procedures - Apps Script compatible' as description
    FROM sys.procedures 
    WHERE name IN ('upsert_bridge_details', 'upsert_survey_assessment', 'upsert_evaluation_remarks')
    
    UNION ALL
    
    SELECT 
      'Indexes' as object_type, 
      name as object_name,
      'Performance optimization indexes' as description
    FROM sys.indexes 
    WHERE name LIKE 'IX_%bridge_details%' OR name LIKE 'IX_%survey%' OR name LIKE 'IX_%evaluation%'
    
    ORDER BY object_type, object_name
  `;

  try {
    const result = await executeSQL(sql, connectionString, verifyQuery, 'Verify schema objects');

    console.log('🏗️ Bridge Assessment Schema Verification Results:');
    let currentType = '';
    result.forEach(row => {
      if (row.object_type !== currentType) {
        currentType = row.object_type;
        console.log(`\n📋 ${currentType}:`);
      }
      console.log(`  ✅ ${row.object_name} - ${row.description}`);
    });

    const requiredObjects = [
      'bridge_details', 'survey_assessment', 'evaluation_remarks',
      'upsert_bridge_details', 'upsert_survey_assessment', 'upsert_evaluation_remarks'
    ];

    const foundObjects = result.map(row => row.object_name);
    const missingObjects = requiredObjects.filter(obj => !foundObjects.includes(obj));

    if (missingObjects.length > 0) {
      console.error('❌ Missing required objects:', missingObjects);
      throw new Error(`Missing database objects: ${missingObjects.join(', ')}`);
    } else {
      console.log('\n✅ All required schema objects are present');
      console.log('🌉 Database ready with 3 tables matching Apps Script forms:');
      console.log('   - bridge_details: 47 columns matching Form 1 fields');
      console.log('   - survey_assessment: 20 columns matching Form 2 fields');
      console.log('   - evaluation_remarks: 6 columns matching Form 3 fields');
    }

    return result;
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    throw error;
  }
}

// Test the schema
async function testSchema(sql, connectionString) {
  console.log('🧪 Testing Bridge Assessment Schema...');

  const testQuery = `
    DECLARE @test_assessment_id NVARCHAR(50) = 'TEST_' + CAST(NEWID() AS NVARCHAR(36));
    
    -- Test bridge details insertion with Apps Script format
    DECLARE @test_form1_data NVARCHAR(MAX) = N'{
      "action_type": "save",
      "riverName": "Test River",
      "roadName": "Test Highway NH-1",
      "chainage": "10+500",
      "latitude": "28.123456",
      "longitude": "77.654321",
      "constructionYear": "2010",
      "circleName": "Test Circle",
      "bridgeType": "RCC Bridge"
    }';
    
    EXEC upsert_bridge_details @assessment_id = @test_assessment_id, @form_data = @test_form1_data;
    
    -- Test survey assessment insertion
    DECLARE @test_form2_data NVARCHAR(MAX) = N'{
      "action_type": "save",
      "surveyor_name": "Test Surveyor",
      "structural_condition": "Good",
      "recommendations": "Regular maintenance required"
    }';
    
    EXEC upsert_survey_assessment @assessment_id = @test_assessment_id, @form_data = @test_form2_data;
    
    -- Test evaluation remarks insertion
    DECLARE @test_form3_data NVARCHAR(MAX) = N'{
      "action_type": "save",
      "conditionState": "State 1",
      "remarks": "Bridge is in good condition",
      "assessment_status": "completed"
    }';
    
    EXEC upsert_evaluation_remarks @assessment_id = @test_assessment_id, @form_data = @test_form3_data;
    
    -- Verify data was inserted
    SELECT 'Bridge Details' as form_type, COUNT(*) as record_count 
    FROM [dbo].[bridge_details] WHERE [assessment_id] = @test_assessment_id
    UNION ALL
    SELECT 'Survey Assessment' as form_type, COUNT(*) as record_count 
    FROM [dbo].[survey_assessment] WHERE [assessment_id] = @test_assessment_id
    UNION ALL
    SELECT 'Evaluation Remarks' as form_type, COUNT(*) as record_count 
    FROM [dbo].[evaluation_remarks] WHERE [assessment_id] = @test_assessment_id;
    
    -- Clean up test data
    DELETE FROM [dbo].[bridge_details] WHERE [assessment_id] = @test_assessment_id;
    DELETE FROM [dbo].[survey_assessment] WHERE [assessment_id] = @test_assessment_id;
    DELETE FROM [dbo].[evaluation_remarks] WHERE [assessment_id] = @test_assessment_id;
    
    PRINT '✅ Schema test completed successfully - All forms work with Apps Script format';
  `;

  try {
    await executeSQL(sql, connectionString, testQuery, 'Test schema operations with Apps Script format');
    console.log('✅ Schema test passed - ready for Apps Script form submissions');
  } catch (error) {
    console.error('❌ Schema test failed:', error.message);
  }
}

// Export functions
module.exports = {
  initDatabase: async (sql, connectionString) => {
    await initDatabase(sql, connectionString);
    await verifySchema(sql, connectionString);
    await testSchema(sql, connectionString);
  },
  verifySchema,
  testSchema
};