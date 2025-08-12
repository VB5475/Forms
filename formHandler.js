/**
 * Forms Handler - Bridge/Structure Assessment Forms
 * 
 * SETUP INSTRUCTIONS:
 * 1. Replace 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' with your actual deployed script URL
 * 2. Update the field mappings in each function to match your actual form fields
 * 3. Include this file in all your HTML pages: <script src="bridge-forms-handler.js"></script>
 * 
 * FORM STRUCTURE:
 * - Form 1: Bridge Details - Has "Next" and "Save Bridge Details" buttons
 * - Form 2: Survey Assessment - Has "Next" and "Save Survey Assessment" buttons  
 * - Form 3: Evaluation & Remarks - Has "Final Save" button only
 * 
 * GOOGLE SHEETS:
 * - Sheet 1: "A. Details of existing Bridge/Structure"
 * - Sheet 2: "B. Survey And Condition Assessment"
 * - Sheet 3: "C. Evaluation & Remarks"
 */

// Configuration
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
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
    },
    SHEET_NAMES: {
        form1: 'A. Details of existing Bridge/Structure',
        form2: 'B. Survey And Condition Assessment',
        form3: 'C. Evaluation & Remarks'
    }
};

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

// Utility function to send data to Google Sheets
async function sendToGoogleSheets(formData, formType, actionType) {
    const payload = {
        ...formData,
        form_type: formType,
        action_type: actionType,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (result.status === 'success') {
            return { success: true, data: result };
        } else {
            throw new Error(result.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        return { success: false, error: error.message };
    }
}

// FORM 1 HANDLERS - Bridge Details
function handleBridgeDetailsNext() {
    const formData = getBridgeDetailsData();

    if (!validateBridgeDetailsData(formData)) {
        alert('Please fill in all required fields for Bridge Details');
        return;
    }

    const nextBtn = document.getElementById(CONFIG.FORMS.form1.nextButtonId);
    setLoadingState(nextBtn, true);

    sendToGoogleSheets(formData, 'form1', 'next')
        .then(result => {
            setLoadingState(nextBtn, false);

            if (result.success) {
                alert('Bridge Details saved! Proceeding to Survey Assessment...');
                // Navigate to Form 2 - adjust URL as needed
                window.location.href = 'survey-assessment.html';
            } else {
                alert('Error saving Bridge Details: ' + result.error);
            }
        });
}

function handleBridgeDetailsSave() {
    const formData = getBridgeDetailsData();

    if (!validateBridgeDetailsData(formData)) {
        alert('Please fill in all required fields for Bridge Details');
        return;
    }

    const saveBtn = document.getElementById(CONFIG.FORMS.form1.saveButtonId);
    setLoadingState(saveBtn, true);

    sendToGoogleSheets(formData, 'form1', 'save')
        .then(result => {
            setLoadingState(saveBtn, false);

            if (result.success) {
                alert('Bridge Details saved successfully!');
                // Optionally redirect or reset form
            } else {
                alert('Error saving Bridge Details: ' + result.error);
            }
        });
}

function getBridgeDetailsData() {
    // UPDATE THESE FIELD NAMES TO MATCH YOUR ACTUAL BRIDGE DETAILS FORM FIELDS
    return {
        bridge_name: document.getElementById('bridge-name')?.value || '',
        location: document.getElementById('bridge-location')?.value || '',
        type: document.getElementById('bridge-type')?.value || '',
        year_built: document.getElementById('year-built')?.value || '',
        span_length: document.getElementById('span-length')?.value || '',
        width: document.getElementById('bridge-width')?.value || '',
        material: document.getElementById('bridge-material')?.value || '',
        traffic_load: document.getElementById('traffic-load')?.value || '',
        // Add more Bridge Details specific fields here
    };
}

function validateBridgeDetailsData(data) {
    // UPDATE VALIDATION RULES FOR YOUR BRIDGE DETAILS REQUIRED FIELDS
    return data.bridge_name && data.location && data.type;
}

// FORM 2 HANDLERS - Survey Assessment
function handleSurveyAssessmentNext() {
    const formData = getSurveyAssessmentData();

    if (!validateSurveyAssessmentData(formData)) {
        alert('Please fill in all required fields for Survey Assessment');
        return;
    }

    const nextBtn = document.getElementById(CONFIG.FORMS.form2.nextButtonId);
    setLoadingState(nextBtn, true);

    sendToGoogleSheets(formData, 'form2', 'next')
        .then(result => {
            setLoadingState(nextBtn, false);

            if (result.success) {
                alert('Survey Assessment saved! Proceeding to Evaluation & Remarks...');
                // Navigate to Form 3 - adjust URL as needed
                window.location.href = 'evaluation-remarks.html';
            } else {
                alert('Error saving Survey Assessment: ' + result.error);
            }
        });
}

function handleSurveyAssessmentSave() {
    const formData = getSurveyAssessmentData();

    if (!validateSurveyAssessmentData(formData)) {
        alert('Please fill in all required fields for Survey Assessment');
        return;
    }

    const saveBtn = document.getElementById(CONFIG.FORMS.form2.saveButtonId);
    setLoadingState(saveBtn, true);

    sendToGoogleSheets(formData, 'form2', 'save')
        .then(result => {
            setLoadingState(saveBtn, false);

            if (result.success) {
                alert('Survey Assessment saved successfully!');
                // Optionally redirect or reset form
            } else {
                alert('Error saving Survey Assessment: ' + result.error);
            }
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
        // Add more Survey Assessment specific fields here
    };
}

function validateSurveyAssessmentData(data) {
    // UPDATE VALIDATION RULES FOR YOUR SURVEY ASSESSMENT REQUIRED FIELDS
    return data.structural_condition && data.deck_condition && data.load_capacity;
}

// FORM 3 HANDLERS - Evaluation & Remarks
function handleEvaluationRemarksSave() {
    const formData = getEvaluationRemarksData();

    if (!validateEvaluationRemarksData(formData)) {
        alert('Please fill in all required fields for Evaluation & Remarks');
        return;
    }

    const saveBtn = document.getElementById(CONFIG.FORMS.form3.saveButtonId);
    setLoadingState(saveBtn, true);

    sendToGoogleSheets(formData, 'form3', 'save')
        .then(result => {
            setLoadingState(saveBtn, false);

            if (result.success) {
                alert('Bridge Assessment completed successfully! Thank you!');
                // Redirect to success page or reset
                window.location.href = 'assessment-complete.html';
            } else {
                alert('Error saving Evaluation & Remarks: ' + result.error);
            }
        });
}

function getEvaluationRemarksData() {
    // UPDATE THESE FIELD NAMES TO MATCH YOUR ACTUAL EVALUATION & REMARKS FORM FIELDS
    return {
        overall_rating: document.getElementById('overall-rating')?.value || '',
        priority_level: document.getElementById('priority-level')?.value || '',
        recommended_actions: document.getElementById('recommended-actions')?.value || '',
        maintenance_required: document.getElementById('maintenance-required')?.value || '',
        repair_urgency: document.getElementById('repair-urgency')?.value || '',
        cost_estimate: document.getElementById('cost-estimate')?.value || '',
        inspector_name: document.getElementById('inspector-name')?.value || '',
        inspection_date: document.getElementById('inspection-date')?.value || '',
        additional_remarks: document.getElementById('additional-remarks')?.value || '',
        // Add more Evaluation & Remarks specific fields here
    };
}

function validateEvaluationRemarksData(data) {
    // UPDATE VALIDATION RULES FOR YOUR EVALUATION & REMARKS REQUIRED FIELDS
    return data.overall_rating && data.priority_level && data.inspector_name;
}

// AUTO-INITIALIZATION
document.addEventListener('DOMContentLoaded', function () {
    // Auto-bind Form 1 buttons (Bridge Details)
    const bridgeDetailsNextBtn = document.getElementById(CONFIG.FORMS.form1.nextButtonId);
    const bridgeDetailsSaveBtn = document.getElementById(CONFIG.FORMS.form1.saveButtonId);

    if (bridgeDetailsNextBtn) {
        bridgeDetailsNextBtn.addEventListener('click', handleBridgeDetailsNext);
    }
    if (bridgeDetailsSaveBtn) {
        bridgeDetailsSaveBtn.addEventListener('click', handleBridgeDetailsSave);
    }

    // Auto-bind Form 2 buttons (Survey Assessment)
    const surveyAssessmentNextBtn = document.getElementById(CONFIG.FORMS.form2.nextButtonId);
    const surveyAssessmentSaveBtn = document.getElementById(CONFIG.FORMS.form2.saveButtonId);

    if (surveyAssessmentNextBtn) {
        surveyAssessmentNextBtn.addEventListener('click', handleSurveyAssessmentNext);
    }
    if (surveyAssessmentSaveBtn) {
        surveyAssessmentSaveBtn.addEventListener('click', handleSurveyAssessmentSave);
    }

    // Auto-bind Form 3 button (Evaluation & Remarks)
    const evaluationRemarksSaveBtn = document.getElementById(CONFIG.FORMS.form3.saveButtonId);

    if (evaluationRemarksSaveBtn) {
        evaluationRemarksSaveBtn.addEventListener('click', handleEvaluationRemarksSave);
    }
});

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
    }
};