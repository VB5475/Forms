/**
 * Forms Handler - Bridge/Structure Assessment Forms
 * Fixed to prevent duplicate API calls
 * Updated to send data as FormData instead of JSON
 * Supports both Google Sheets and local Node.js server
 * 
 * SETUP INSTRUCTIONS:
 * 1. Make sure your Node.js server is running on http://localhost:4000
 * 2. Update field mappings if needed to match your actual form fields
 * 3. Include this file in all your HTML pages: <script src="bridge-forms-handler.js"></script>
 * 
 * FORM STRUCTURE:
 * - Form 1: Bridge Details - Has "Next" and "Save Bridge Details" buttons
 * - Form 2: Survey Assessment - Has "Next" and "Save Survey Assessment" buttons  
 * - Form 3: Evaluation & Remarks - Has "Final Save" button only
 */

// Configuration - Updated to use local server and Google Sheets
const CONFIG = {
    SERVER_URL: 'http://localhost:4000/api/forms', // Your local Node.js server
    FINALIZE_URL: 'http://localhost:4000/api/assessments', // For finalizing assessments
    GSHEET_URL: 'https://script.google.com/macros/s/AKfycbxAfSBcHAOHG9JW2debF-KARuPVVBJ60wpkH5IElxDpi7Bd81xroKz9o17O7EYaJVG_/exec', // Replace with your Google Apps Script URL
    FORMS: {
        form1: {
            nextButtonId: 'bridge-details-next-btn',
            saveButtonId: 'bridge-details-save-btn',
            formId: 'bridge-details-form'
        },
        form2: {
            nextButtonId: 'survey-assessment-next-btn',
            saveButtonId: 'survey-assessment-save-btn',
            formId: 'survey-assessment-form'
        },
        form3: {
            saveButtonId: 'evaluation-remarks-save-btn',
            formId: 'evaluation-remarks-form'
        }
    }
};

// Global variable to store assessment ID across forms
let currentAssessmentId = localStorage.getItem('bridge_assessment_id') || null;

// Track if handlers are already initialized to prevent duplicate bindings
let handlersInitialized = false;

// Track ongoing submissions to prevent duplicate calls
let ongoingSubmissions = new Set();

// Utility function to show loading state
function setLoadingState(buttonElement, isLoading) {
    if (isLoading) {
        buttonElement.disabled = true;
        buttonElement.dataset.originalText = buttonElement.innerText;
        buttonElement.innerText = 'Submitting...';
    } else {
        buttonElement.disabled = false;
        buttonElement.innerText = buttonElement.dataset.originalText || buttonElement.innerText;
    }
}

// Utility function to get radio button value
function getRadioValue(name) {
    const radio = document.querySelector(`input[name="${name}"]:checked`);
    return radio ? radio.value : '';
}

// Utility function to get span configuration data
function getSpanConfigurationData() {
    const spanCount = document.getElementById('spanCount')?.value || '';
    const spanConfig = [];

    if (spanCount) {
        for (let i = 1; i <= parseInt(spanCount); i++) {
            const spanType = document.getElementById(`spanType${i}`)?.value || '';
            const spanLength = document.getElementById(`spanLength${i}`)?.value || '';
            const spanNumber = document.getElementById(`spanNumber${i}`)?.value || '';

            if (spanType || spanLength || spanNumber) {
                spanConfig.push({
                    type: spanType,
                    length: spanLength,
                    number: spanNumber
                });
            }
        }
    }

    return {
        spanCount: spanCount,
        spanConfiguration: spanConfig
    };
}

// Utility function to convert object to FormData
function createFormData(dataObject) {
    const formData = new FormData();

    // Add assessment_id and metadata

    console.log("see the currentAssessmentId")

    if (currentAssessmentId) {
        formData.append('assessment_id', currentAssessmentId);
    }
    formData.append('timestamp', new Date().toISOString());

    // Iterate through all properties and add to FormData
    for (const [key, value] of Object.entries(dataObject)) {
        if (value !== null && value !== undefined) {
            // Handle arrays and objects by converting to JSON string
            if (typeof value === 'object' && !Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value.toString());
            }
        }
    }

    return formData;
}

// Updated function to send FormData to local Node.js server
async function sendToLocalServer(formDataObject, formType, actionType) {
    const formData = createFormData(formDataObject);

    // Add form metadata
    formData.append('form_type', formType);
    formData.append('action_type', actionType);

    try {
        console.log('Sending FormData to local server...');
        console.log('Form Type:', formType, 'Action:', actionType);
        console.log("see server formdata:", formData)
        const response = await fetch(CONFIG.SERVER_URL, {
            method: 'POST',
            body: formData, // Send as FormData (not JSON)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Server response:', result);

        if (result.status === 'success') {
            // Store assessment ID for future requests
            if (result.assessment_id) {
                currentAssessmentId = result.assessment_id;
                localStorage.setItem('bridge_assessment_id', currentAssessmentId);
            }

            return {
                success: true,
                data: result,
                assessment_id: result.assessment_id,
                submission_id: result.submission_id
            };
        } else {
            throw new Error(result.error || 'Submission failed');
        }
    } catch (error) {
        console.error('Error sending to local server:', error);
        throw error;
    }
}

// Updated function to send FormData to Google Sheets
async function sendToGoogleSheets(formDataObject, formType, actionType) {
    if (!CONFIG.GSHEET_URL || CONFIG.GSHEET_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        console.log('Google Sheets URL not configured, skipping...');
        return { success: true, message: 'Google Sheets not configured' };
    }

    const formData = createFormData(formDataObject);

    // Add form metadata for Google Sheets
    formData.append('form_type', formType);
    formData.append('action_type', actionType);
    formData.append('sheet_name', getSheetNameByFormType(formType));

    try {
        console.log('Sending FormData to Google Sheets...');

        const response = await fetch(CONFIG.GSHEET_URL, {
            method: 'POST',
            body: formData, // Send as FormData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Fixed: Properly handle Google Sheets response
        try {
            const result = await response.json();
            console.log('Google Sheets response:', result);
            return {
                success: result.status === 'success' || result.result === 'success',
                data: result,
                message: result.message || 'Submitted to Google Sheets'
            };
        } catch (jsonError) {
            // If response is not JSON, assume success if status is OK
            const textResponse = await response.text();
            console.log('Google Sheets response (non-JSON):', textResponse);
            return {
                success: true,
                data: textResponse,
                message: 'Submitted to Google Sheets (non-JSON response)'
            };
        }
    } catch (error) {
        console.error('Error sending to Google Sheets:', error);
        throw error;
    }
}

// Helper function to determine sheet name based on form type
function getSheetNameByFormType(formType) {
    const sheetNames = {
        'form1': 'A. Details of existing Bridge Structure',
        'form2': 'B. Survey And Condition Assessment',
        'form3': 'C. Evaluation & Remarks'
    };
    return sheetNames[formType] || 'FormSubmissions';
}

// Fixed: Combined function to send to both destinations with duplicate prevention
async function submitFormData(formDataObject, formType, actionType) {
    // Create unique submission key to prevent duplicates
    const submissionKey = `${formType}_${actionType}_${JSON.stringify(formDataObject).substring(0, 50)}_${Date.now()}`;

    // Check if this submission is already in progress
    if (ongoingSubmissions.has(submissionKey)) {
        console.log('Duplicate submission prevented:', submissionKey);
        return { success: false, error: 'Submission already in progress' };
    }

    // Add to ongoing submissions
    ongoingSubmissions.add(submissionKey);

    const results = {
        server: null,
        gsheets: null,
        success: false
    };

    try {
        // Run both API calls in parallel instead of sequentially
        console.log('Starting parallel submission to both APIs...');

        const [serverResult, gsheetsResult] = await Promise.allSettled([
            sendToLocalServer(formDataObject, formType, actionType),
            sendToGoogleSheets(formDataObject, formType, actionType)
        ]);

        // Handle server result
        if (serverResult.status === 'fulfilled') {
            results.server = serverResult.value;
            console.log('Server submission successful:', serverResult.value);
        } else {
            console.error('Server submission failed:', serverResult.reason);
            results.server = { success: false, error: serverResult.reason.message };
        }

        // Handle Google Sheets result
        if (gsheetsResult.status === 'fulfilled') {
            results.gsheets = gsheetsResult.value;
            console.log('Google Sheets submission successful:', gsheetsResult.value);
        } else {
            console.error('Google Sheets submission failed:', gsheetsResult.reason);
            results.gsheets = { success: false, error: gsheetsResult.reason.message };
        }

        // Consider successful if at least one destination succeeded
        results.success = (results.server?.success || results.gsheets?.success);

        console.log('Final submission results:', results);
        return results;

    } catch (error) {
        console.error('Error in submitFormData:', error);
        throw error;
    } finally {
        // Remove from ongoing submissions after a delay to prevent rapid duplicate clicks
        setTimeout(() => {
            ongoingSubmissions.delete(submissionKey);
        }, 2000);
    }
}

// Function to finalize assessment (for final form submission)
async function finalizeAssessment(assessmentId) {
    try {
        const formData = new FormData();
        formData.append('assessment_id', assessmentId);
        formData.append('action', 'finalize');

        const response = await fetch(`${CONFIG.FINALIZE_URL}/${assessmentId}/finalize`, {
            method: 'POST',
            body: formData, // Send as FormData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.status === 'success';
    } catch (error) {
        console.error('Error finalizing assessment:', error);
        throw error;
    }
}

// FORM 1 HANDLERS - Bridge Details
function handleBridgeDetailsNext() {
    // Prevent duplicate calls
    const nextBtn = document.getElementById(CONFIG.FORMS.form1.nextButtonId);
    if (!nextBtn || nextBtn.disabled) {
        console.log('Button not found or already disabled, preventing duplicate call');
        return;
    }

    const formData = getBridgeDetailsData();

    if (!validateBridgeDetailsData(formData)) {
        alert('Please fill in all required fields for Bridge Details');
        return;
    }

    setLoadingState(nextBtn, true);

    submitFormData(formData, 'form1', 'next')
        .then(results => {
            setLoadingState(nextBtn, false);

            if (results.success) {
                let message = 'Bridge Details saved!';
                if (results.server && results.server.assessment_id) {
                    message += ` Assessment ID: ${results.server.assessment_id}.`;
                }
                message += ' Proceeding to Survey Assessment...';

                alert(message);
                // Navigate to Form 2 - adjust URL as needed
                window.location.href = 'indexB.html';
            } else {
                alert('Error saving Bridge Details. Please try again.');
            }
        })
        .catch(error => {
            setLoadingState(nextBtn, false);
            console.error('Error in handleBridgeDetailsNext:', error);
            alert('Error saving Bridge Details: ' + error.message);
        });
}

function handleBridgeDetailsSave() {
    // Prevent duplicate calls
    const saveBtn = document.getElementById(CONFIG.FORMS.form1.saveButtonId);
    if (!saveBtn || saveBtn.disabled) {
        console.log('Button not found or already disabled, preventing duplicate call');
        return;
    }

    const formData = getBridgeDetailsData();

    if (!validateBridgeDetailsData(formData)) {
        alert('Please fill in all required fields for Bridge Details');
        return;
    }

    setLoadingState(saveBtn, true);

    submitFormData(formData, 'form1', 'save')
        .then(results => {
            setLoadingState(saveBtn, false);

            if (results.success) {
                let message = 'Bridge Details saved successfully!';
                if (results.server && results.server.assessment_id) {
                    message += ` Assessment ID: ${results.server.assessment_id}`;
                }
                alert(message);
            } else {
                alert('Error saving Bridge Details. Please try again.');
            }
        })
        .catch(error => {
            setLoadingState(saveBtn, false);
            console.error('Error in handleBridgeDetailsSave:', error);
            alert('Error saving Bridge Details: ' + error.message);
        });
}

function getBridgeDetailsData() {
    // Get span configuration data
    const spanData = getSpanConfigurationData();

    return {
        // Basic Information
        riverName: document.getElementById('riverName')?.value || '',
        roadName: document.getElementById('roadName')?.value || '',
        chainage: document.getElementById('chainage')?.value || '',
        latitude: document.getElementById('latitude')?.value || '',
        longitude: document.getElementById('longitude')?.value || '',

        // Administrative Details
        circleName: document.getElementById('circleName')?.value || '',
        divisionName: document.getElementById('divisionName')?.value || '',
        subdivisionName: document.getElementById('subdivisionName')?.value || '',

        // Span Configuration
        spanCount: spanData.spanCount,
        spanConfiguration: JSON.stringify(spanData.spanConfiguration),
        totalLength: document.getElementById('totalLength')?.value || '',
        classificationOfBridge: getRadioValue('classificationOfBridge'),
        classificationOfBridgeOther: document.getElementById('classificationOfBridgeOther')?.value || '',

        // Bridge Structure Details
        angleCrossing: document.getElementById('angleCrossing')?.value || '',
        bridgeType: getRadioValue('bridgeType'),
        bridgeTypeOther: document.getElementById('bridgeTypeOther')?.value || '',

        // Super Structure
        superStructure: getRadioValue('superStructure'),
        superStructureOther: document.getElementById('superStructureOther')?.value || '',
        weavingCoat: document.getElementById('weavingCoat')?.value || '',

        // Sub Structure
        subStructure: getRadioValue('subStructure'),
        subStructureOther: document.getElementById('subStructureOther')?.value || '',
        abutmentType: getRadioValue('abutmentType'),
        abutmentTypeOther: document.getElementById('abutmentTypeOther')?.value || '',
        returnDetails: getRadioValue('returnDetails'),
        returnDetailsOther: document.getElementById('returnDetailsOther')?.value || '',

        // Foundation and Bearing
        foundation: getRadioValue('foundation'),
        foundationOther: document.getElementById('foundationOther')?.value || '',
        bearing: getRadioValue('bearing'),
        bearingOther: document.getElementById('bearingOther')?.value || '',

        // Approach Details
        approachType: getRadioValue('approachType'),
        approachTypeOther: document.getElementById('approachTypeOther')?.value || '',
        approachLHS: document.getElementById('approachLHS')?.value || '',
        approachRHS: document.getElementById('approachRHS')?.value || '',
        approachLength: document.getElementById('approachLength')?.value || '',

        // Railing and Protection
        railing: getRadioValue('railing'),
        railingOther: document.getElementById('railingOther')?.value || '',
        riverTraining: document.getElementById('riverTraining')?.value || '',
        repairWork: document.getElementById('repairWork')?.value || '',

        // Dimensions
        carriagewayWidth: document.getElementById('carriagewayWidth')?.value || '',
        totalCarriageway: document.getElementById('totalCarriageway')?.value || '',
        approachCarriageway: document.getElementById('approachCarriageway')?.value || '',

        // Construction and Specifications
        constructionYear: document.getElementById('constructionYear')?.value || '',
        bridgeLevel: getRadioValue('bridgeLevel'),
        bridgeLevelOther: document.getElementById('bridgeLevelOther')?.value || '',
        riverPerennial: getRadioValue('riverPerennial'),

        // Inspection Details
        preMonsoonDate: document.getElementById('preMonsoonDate')?.value || '',
        preMonsoonAE: document.getElementById('preMonsoonAE')?.value || '',
        preMonsoonDEE: document.getElementById('preMonsoonDEE')?.value || '',
        preMonsoonEE: document.getElementById('preMonsoonEE')?.value || '',
        postMonsoonDate: document.getElementById('postMonsoonDate')?.value || '',
        postMonsoonAE: document.getElementById('postMonsoonAE')?.value || '',
        postMonsoonDEE: document.getElementById('postMonsoonDEE')?.value || '',
        postMonsoonEE: document.getElementById('postMonsoonEE')?.value || '',

        // Survey Information
        pastSurvey: getRadioValue('pastSurvey'),
        pastSurveyDetails: document.getElementById('pastSurveyDetails')?.value || '',

        // Flood Levels
        observerFloodLevel: document.getElementById('observerFloodLevel')?.value || '',
        designedFloodLevel: document.getElementById('designedFloodLevel')?.value || '',
        finishedRoadLevel: document.getElementById('finishedRoadLevel')?.value || ''
    };
}

function validateBridgeDetailsData(data) {
    // Required fields validation based on your form
    const requiredFields = [
        'riverName',
        'roadName',
        'chainage',
        'latitude',
        'longitude',
        'circleName',
        'divisionName',
        'subdivisionName',
        'spanCount',
        'angleCrossing',
        'carriagewayWidth',
        'totalCarriageway',
        'approachCarriageway',
        'constructionYear',
        'observerFloodLevel',
        'designedFloodLevel',
        'finishedRoadLevel'
    ];

    // Check if all required fields have values
    for (let field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            console.log(`Missing required field: ${field}`);
            return false;
        }
    }

    // Check required radio buttons
    const requiredRadioFields = [
        'bridgeType',
        'superStructure',
        'subStructure',
        'abutmentType',
        'returnDetails',
        'foundation',
        'bearing',
        'approachType',
        'railing',
        'bridgeLevel',
        'riverPerennial',
        'pastSurvey'
    ];

    for (let field of requiredRadioFields) {
        if (!data[field] || data[field].trim() === '') {
            console.log(`Missing required radio field: ${field}`);
            return false;
        }
    }

    // If span configuration is shown, validate it
    if (data.spanCount && parseInt(data.spanCount) > 0) {
        if (!data.totalLength || data.totalLength.trim() === '') {
            console.log('Missing total length when span count is provided');
            return false;
        }
        if (!data.classificationOfBridge || data.classificationOfBridge.trim() === '') {
            console.log('Missing classification of bridge when span count is provided');
            return false;
        }
    }

    return true;
}

// FORM 2 HANDLERS - Survey Assessment
function handleSurveyAssessmentNext() {
    // Prevent duplicate calls
    const nextBtn = document.getElementById(CONFIG.FORMS.form2.nextButtonId);
    if (!nextBtn || nextBtn.disabled) {
        console.log('Button not found or already disabled, preventing duplicate call');
        return;
    }

    const formData = getSurveyAssessmentData();

    // if (!validateSurveyAssessmentData(formData)) {
    //     alert('Please fill in all required fields for Survey Assessment');
    //     return;
    // }

    setLoadingState(nextBtn, true);

    submitFormData(formData, 'form2', 'next')
        .then(results => {
            setLoadingState(nextBtn, false);

            if (results.success) {
                alert('Survey Assessment saved! Proceeding to Evaluation & Remarks...');
                // Navigate to Form 3 - adjust URL as needed
                window.location.href = 'evaluation-remarks.html';
            } else {
                alert('Error saving Survey Assessment. Please try again.');
            }
        })
        .catch(error => {
            setLoadingState(nextBtn, false);
            console.error('Error in handleSurveyAssessmentNext:', error);
            alert('Error saving Survey Assessment: ' + error.message);
        });
}

function handleSurveyAssessmentSave() {
    // Prevent duplicate calls
    const saveBtn = document.getElementById(CONFIG.FORMS.form2.saveButtonId);
    if (!saveBtn || saveBtn.disabled) {
        console.log('Button not found or already disabled, preventing duplicate call');
        return;
    }

    const formData = getSurveyAssessmentData();

    // if (!validateSurveyAssessmentData(formData)) {
    //     alert('Please fill in all required fields for Survey Assessment');
    //     return;
    // }

    setLoadingState(saveBtn, true);

    submitFormData(formData, 'form2', 'save')
        .then(results => {
            setLoadingState(saveBtn, false);

            if (results.success) {
                alert('Survey Assessment saved successfully!');
            } else {
                alert('Error saving Survey Assessment. Please try again.');
            }
        })
        .catch(error => {
            setLoadingState(saveBtn, false);
            console.error('Error in handleSurveyAssessmentSave:', error);
            alert('Error saving Survey Assessment: ' + error.message);
        });
}

function getSurveyAssessmentData() {
    // UPDATE THESE FIELD NAMES TO MATCH YOUR ACTUAL SURVEY ASSESSMENT FORM FIELDS
    return {
        structural_condition: document.getElementById('structural-condition')?.value || '',
        deck_condition: document.getElementById('deck-condition')?.value || '',
        superstructure_condition: document.getElementById('superstructure-condition')?.value || '',
        substructure_condition: document.getElementById('substructure-condition')?.value || '',
        bearing_condition: document.getElementById('bearing-condition')?.value || '',
        expansion_joints: document.getElementById('expansion-joints')?.value || '',
        drainage_system: document.getElementById('drainage-system')?.value || '',
        safety_features: document.getElementById('safety-features')?.value || '',
        load_capacity: document.getElementById('load-capacity')?.value || '',
        // Add more Survey Assessment specific fields here based on your actual form
    };
}

function validateSurveyAssessmentData(data) {
    // UPDATE VALIDATION RULES FOR YOUR SURVEY ASSESSMENT REQUIRED FIELDS
    return data.structural_condition && data.deck_condition && data.load_capacity;
}

// FORM 3 HANDLERS - Evaluation & Remarks
function handleEvaluationRemarksSave() {
    // Prevent duplicate calls
    const saveBtn = document.getElementById(CONFIG.FORMS.form3.saveButtonId);
    if (!saveBtn || saveBtn.disabled) {
        console.log('Button not found or already disabled, preventing duplicate call');
        return;
    }

    const formData = getEvaluationRemarksData();

    if (!validateEvaluationRemarksData(formData)) {
        alert('Please fill in all required fields for Evaluation & Remarks');
        return;
    }

    setLoadingState(saveBtn, true);

    // First save the form data
    submitFormData(formData, 'form3', 'save')
        .then(results => {
            if (results.success && currentAssessmentId) {
                // Then finalize the assessment
                return finalizeAssessment(currentAssessmentId);
            } else {
                throw new Error('Failed to save evaluation remarks');
            }
        })
        .then(finalized => {
            setLoadingState(saveBtn, false);

            if (finalized) {
                alert('Bridge Assessment completed successfully! Thank you!');

                // Clear stored assessment ID
                localStorage.removeItem('bridge_assessment_id');
                currentAssessmentId = null;

                // Redirect to success page or reset
                window.location.href = 'assessment-complete.html';
            } else {
                alert('Assessment saved but finalization failed');
            }
        })
        .catch(error => {
            setLoadingState(saveBtn, false);
            console.error('Error in handleEvaluationRemarksSave:', error);
            alert('Error completing assessment: ' + error.message);
        });
}

function getEvaluationRemarksData() {
    return {
        // Condition State as per IRC SP: 40-2019
        conditionState: document.getElementById('conditionState')?.value || '',
        conditionStateOther: document.getElementById('conditionStateOther')?.value || '',

        // Remarks and Evaluation
        remarks: document.getElementById('remarks')?.value || ''
    };
}

function validateEvaluationRemarksData(data) {
    // Required fields validation for Form 3
    const requiredFields = [
        'conditionState',
        'remarks'
    ];

    // Check if all required fields have values
    for (let field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            console.log(`Missing required field: ${field}`);
            return false;
        }
    }

    // If condition state is "other", check if other specification is provided
    if (data.conditionState === 'other' && (!data.conditionStateOther || data.conditionStateOther.trim() === '')) {
        console.log('Missing specification for "Other" condition state');
        alert('Please specify the condition state when selecting "Others"');
        return false;
    }

    return true;
}

// Function to remove existing event listeners to prevent duplicates
function removeExistingEventListeners() {
    const buttonIds = [
        CONFIG.FORMS.form1.nextButtonId,
        CONFIG.FORMS.form1.saveButtonId,
        CONFIG.FORMS.form2.nextButtonId,
        CONFIG.FORMS.form2.saveButtonId,
        CONFIG.FORMS.form3.saveButtonId
    ];

    buttonIds.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            // Clone the button to remove all event listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        }
    });
}

// ENHANCED AUTO-INITIALIZATION - Fixed to prevent duplicate bindings
function initializeBridgeFormHandler() {
    // Prevent duplicate initialization
    if (handlersInitialized) {
        console.log('Form handlers already initialized, skipping...');
        return;
    }

    console.log('Initializing Bridge Form Handler...');

    // Display current assessment ID if available
    if (currentAssessmentId) {
        console.log('Current Assessment ID:', currentAssessmentId);
    }

    // Remove any existing event listeners first
    removeExistingEventListeners();

    // Auto-bind Form 1 buttons (Bridge Details)
    const bridgeDetailsNextBtn = document.getElementById(CONFIG.FORMS.form1.nextButtonId);
    const bridgeDetailsSaveBtn = document.getElementById(CONFIG.FORMS.form1.saveButtonId);

    if (bridgeDetailsNextBtn) {
        bridgeDetailsNextBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleBridgeDetailsNext();
        });
        console.log('Bridge Details Next button bound');
    }
    if (bridgeDetailsSaveBtn) {
        bridgeDetailsSaveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleBridgeDetailsSave();
        });
        console.log('Bridge Details Save button bound');
    }

    // Auto-bind Form 2 buttons (Survey Assessment)
    const surveyAssessmentNextBtn = document.getElementById(CONFIG.FORMS.form2.nextButtonId);
    const surveyAssessmentSaveBtn = document.getElementById(CONFIG.FORMS.form2.saveButtonId);

    if (surveyAssessmentNextBtn) {
        surveyAssessmentNextBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleSurveyAssessmentNext();
        });
        console.log('Survey Assessment Next button bound');
    }
    if (surveyAssessmentSaveBtn) {
        surveyAssessmentSaveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleSurveyAssessmentSave();
        });
        console.log('Survey Assessment Save button bound');
    }

    // Auto-bind Form 3 button (Evaluation & Remarks)
    const evaluationRemarksSaveBtn = document.getElementById(CONFIG.FORMS.form3.saveButtonId);

    if (evaluationRemarksSaveBtn) {
        evaluationRemarksSaveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleEvaluationRemarksSave();
        });
        console.log('Evaluation Remarks Save button bound');
    }

    // Initialize any dynamic form elements (like span configuration)
    initializeDynamicFormElements();

    // Mark as initialized
    handlersInitialized = true;
    console.log('Bridge Form Handler fully initialized for FormData submission');
}

// Initialize dynamic form elements
function initializeDynamicFormElements() {
    // Handle span count change for Form 1
    const spanCountSelect = document.getElementById('spanCount');
    if (spanCountSelect) {
        spanCountSelect.addEventListener('change', function () {
            handleSpanCountChange(this.value);
        });
    }

    // Handle "other" option shows/hides
    initializeOtherOptionHandlers();

    // Handle approach length calculation
    initializeApproachCalculation();
}

// Handle span count changes
function handleSpanCountChange(spanCount) {
    const spanConfigSection = document.getElementById('spanConfigurationSection');
    const totalLengthSection = document.getElementById('totalLengthSection');
    const classificationSection = document.getElementById('classificationOfBridgeSection');

    if (spanCount && parseInt(spanCount) > 0) {
        if (spanConfigSection) spanConfigSection.style.display = 'block';
        if (totalLengthSection) totalLengthSection.style.display = 'block';
        if (classificationSection) classificationSection.style.display = 'block';

        // Generate span configuration rows
        generateSpanConfigurationRows(parseInt(spanCount));
    } else {
        if (spanConfigSection) spanConfigSection.style.display = 'none';
        if (totalLengthSection) totalLengthSection.style.display = 'none';
        if (classificationSection) classificationSection.style.display = 'none';
    }
}

// Generate dynamic span configuration rows
function generateSpanConfigurationRows(spanCount) {
    const container = document.getElementById('spanConfigurationRows');
    if (!container) return;

    container.innerHTML = ''; // Clear existing rows

    for (let i = 1; i <= spanCount; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'span-config-row';
        rowDiv.style.cssText = 'display: flex; gap: 15px; margin-bottom: 10px; align-items: center;';

        rowDiv.innerHTML = `
            <div>
                <label for="spanType${i}" style="font-size: 12px; color: #666; margin-right: 5px;">Type:</label>
                <select id="spanType${i}" name="spanType${i}" style="width: 120px;" required>
                    <option value="">Select Type</option>
                    <option value="main">Main Span</option>
                    <option value="approach">Approach Span</option>
                    <option value="side">Side Span</option>
                </select>
            </div>
            <div>
                <label for="spanLength${i}" style="font-size: 12px; color: #666; margin-right: 5px;">Length (m):</label>
                <input type="number" id="spanLength${i}" name="spanLength${i}" step="0.01" placeholder="0.00" style="width: 100px;" required>
            </div>
            <div>
                <label for="spanNumber${i}" style="font-size: 12px; color: #666; margin-right: 5px;">No. of Spans:</label>
                <input type="number" id="spanNumber${i}" name="spanNumber${i}" min="1" placeholder="1" style="width: 80px;" required>
            </div>
        `;

        container.appendChild(rowDiv);
    }
}

// Initialize "other" option handlers
function initializeOtherOptionHandlers() {
    const otherHandlers = [
        { radioName: 'classificationOfBridge', otherId: 'classificationOfBridgeOther' },
        { radioName: 'bridgeType', otherId: 'bridgeTypeOther' },
        { radioName: 'superStructure', otherId: 'superStructureOther' },
        { radioName: 'subStructure', otherId: 'subStructureOther' },
        { radioName: 'abutmentType', otherId: 'abutmentTypeOther' },
        { radioName: 'returnDetails', otherId: 'returnDetailsOther' },
        { radioName: 'foundation', otherId: 'foundationOther' },
        { radioName: 'bearing', otherId: 'bearingOther' },
        { radioName: 'approachType', otherId: 'approachTypeOther' },
        { radioName: 'railing', otherId: 'railingOther' },
        { radioName: 'bridgeLevel', otherId: 'bridgeLevelOther' }
    ];

    otherHandlers.forEach(handler => {
        const radios = document.querySelectorAll(`input[name="${handler.radioName}"]`);
        const otherInput = document.getElementById(handler.otherId);

        if (radios.length > 0 && otherInput) {
            radios.forEach(radio => {
                radio.addEventListener('change', function () {
                    if (this.value === 'other') {
                        otherInput.style.display = 'block';
                        otherInput.required = true;
                    } else {
                        otherInput.style.display = 'none';
                        otherInput.required = false;
                        otherInput.value = '';
                    }
                });
            });
        }
    });

    // Handle past survey details
    const pastSurveyRadios = document.querySelectorAll('input[name="pastSurvey"]');
    const pastSurveyDetails = document.getElementById('pastSurveyDetails');

    if (pastSurveyRadios.length > 0 && pastSurveyDetails) {
        pastSurveyRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                if (this.value === 'yes') {
                    pastSurveyDetails.style.display = 'block';
                    pastSurveyDetails.required = true;
                } else {
                    pastSurveyDetails.style.display = 'none';
                    pastSurveyDetails.required = false;
                    pastSurveyDetails.value = '';
                }
            });
        });
    }

    // Handle condition state other for Form 3
    const conditionState = document.getElementById('conditionState');
    const conditionStateOther = document.getElementById('conditionStateOther');

    if (conditionState && conditionStateOther) {
        conditionState.addEventListener('change', function () {
            if (this.value === 'other') {
                conditionStateOther.style.display = 'block';
                conditionStateOther.required = true;
            } else {
                conditionStateOther.style.display = 'none';
                conditionStateOther.required = false;
                conditionStateOther.value = '';
            }
        });
    }
}

// Initialize approach length calculation
function initializeApproachCalculation() {
    const approachLHS = document.getElementById('approachLHS');
    const approachRHS = document.getElementById('approachRHS');
    const approachLength = document.getElementById('approachLength');

    if (approachLHS && approachRHS && approachLength) {
        function calculateTotal() {
            const lhs = parseFloat(approachLHS.value) || 0;
            const rhs = parseFloat(approachRHS.value) || 0;
            approachLength.value = (lhs + rhs).toFixed(2);
        }

        approachLHS.addEventListener('input', calculateTotal);
        approachRHS.addEventListener('input', calculateTotal);
    }
}

// Multiple initialization strategies to ensure the handler loads properly
if (document.readyState === 'loading') {
    // Document is still loading
    document.addEventListener('DOMContentLoaded', initializeBridgeFormHandler);
} else if (document.readyState === 'interactive') {
    // Document has finished loading but resources might still be loading
    window.addEventListener('load', initializeBridgeFormHandler);
} else {
    // Document is completely loaded
    initializeBridgeFormHandler();
}

// Export functions for manual binding if needed
window.BridgeAssessmentHandler = {
    bridgeDetails: {
        handleNext: handleBridgeDetailsNext,
        handleSave: handleBridgeDetailsSave
    },
    surveyAssessment: {
        handleNext: handleSurveyAssessmentNext,
        handleSave: handleSurveyAssessmentSave
    },
    evaluationRemarks: {
        handleSave: handleEvaluationRemarksSave
    },
    // Utility functions
    testConnection: function () {
        console.log('Testing connection to local server...');
        fetch('http://localhost:4000/health')
            .then(response => response.json())
            .then(data => {
                console.log('Connection test successful:', data);
                alert('Connection to local server is working!');
            })
            .catch(error => {
                console.error('Connection test failed:', error);
                alert('Connection test failed. Make sure your server is running on http://localhost:4000');
            });
    },
    testGoogleSheets: function () {
        if (!CONFIG.GSHEET_URL || CONFIG.GSHEET_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
            alert('Google Sheets URL not configured. Please update CONFIG.GSHEET_URL in the script.');
            return;
        }

        console.log('Testing connection to Google Sheets...');
        const testData = new FormData();
        testData.append('test', 'connection_test');
        testData.append('timestamp', new Date().toISOString());

        fetch(CONFIG.GSHEET_URL, {
            method: 'POST',
            body: testData
        })
            .then(response => response.json())
            .then(data => {
                console.log('Google Sheets connection test successful:', data);
                alert('Connection to Google Sheets is working!');
            })
            .catch(error => {
                console.error('Google Sheets connection test failed:', error);
                alert('Google Sheets connection test failed: ' + error.message);
            });
    },
    // Get current assessment ID
    getCurrentAssessmentId: function () {
        return currentAssessmentId;
    },
    // Clear assessment ID (for testing)
    clearAssessmentId: function () {
        localStorage.removeItem('bridge_assessment_id');
        currentAssessmentId = null;
        console.log('Assessment ID cleared');
    },
    // Manual form data submission (for testing)
    submitTestData: function () {
        const testData = {
            test_field_1: 'test_value_1',
            test_field_2: 'test_value_2',
            test_number: 123,
            test_array: ['item1', 'item2', 'item3'],
            test_object: { nested: 'value', count: 42 }
        };

        console.log('Submitting test data...');
        submitFormData(testData, 'test_form', 'test_action')
            .then(results => {
                console.log('Test submission results:', results);
                alert('Test data submitted successfully!');
            })
            .catch(error => {
                console.error('Test submission failed:', error);
                alert('Test submission failed: ' + error.message);
            });
    },
    // Force re-initialization (for debugging)
    forceReinit: function () {
        handlersInitialized = false;
        ongoingSubmissions.clear();
        initializeBridgeFormHandler();
        console.log('Form handler re-initialized');
    },
    // Check submission status
    getSubmissionStatus: function () {
        console.log('Ongoing submissions:', Array.from(ongoingSubmissions));
        console.log('Handlers initialized:', handlersInitialized);
        console.log('Current assessment ID:', currentAssessmentId);
    }
};

// Additional utility functions for debugging FormData
window.debugFormData = function (formData) {
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }
};

// Function to convert FormData back to object (for debugging)
window.formDataToObject = function (formData) {
    const obj = {};
    for (let [key, value] of formData.entries()) {
        if (obj[key]) {
            // Handle multiple values for same key
            if (Array.isArray(obj[key])) {
                obj[key].push(value);
            } else {
                obj[key] = [obj[key], value];
            }
        } else {
            obj[key] = value;
        }
    }
    return obj;
};

// Additional debugging utilities
window.BridgeFormDebug = {
    // Test individual API calls
    testServerOnly: function (testData = { test: 'server_only' }) {
        console.log('Testing server API only...');
        return sendToLocalServer(testData, 'test', 'server_test');
    },

    testGSheetsOnly: function (testData = { test: 'gsheets_only' }) {
        console.log('Testing Google Sheets API only...');
        return sendToGoogleSheets(testData, 'test', 'gsheets_test');
    },

    // Monitor API calls
    enableAPILogging: function () {
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            console.log('🌐 API Call:', args[0], args[1]?.method || 'GET');
            return originalFetch.apply(this, arguments)
                .then(response => {
                    console.log('✅ API Response:', args[0], response.status);
                    return response;
                })
                .catch(error => {
                    console.log('❌ API Error:', args[0], error);
                    throw error;
                });
        };
        console.log('API logging enabled');
    },

    disableAPILogging: function () {
        // This would require storing the original fetch, but for simplicity:
        console.log('Reload page to disable API logging');
    },

    // Clear all stored data
    resetAll: function () {
        localStorage.removeItem('bridge_assessment_id');
        currentAssessmentId = null;
        ongoingSubmissions.clear();
        handlersInitialized = false;
        console.log('All data reset. Call initializeBridgeFormHandler() to reinitialize.');
    }
};