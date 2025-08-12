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

// Utility function to send data to backend
async function sendToGoogleSheets(formData, formType, actionType) {
    const payload = {
        assessment_id: localStorage.getItem('assessment_id') || null,
        ...formData,
        form_type: formType,
        action_type: actionType,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch('http://localhost:4000/api/forms', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (result.status === 'success') {
            if (result.assessment_id) {
                localStorage.setItem('assessment_id', result.assessment_id);
            }
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
                window.location.href = 'indexB.html';
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
    // Serialize ALL inputs/textareas/selects by name from the Form 1 element
    const formElement = document.getElementById(CONFIG.FORMS.form1.formId);
    const collectedData = {};

    if (formElement) {
        const formData = new FormData(formElement);
        for (const [fieldName, fieldValue] of formData.entries()) {
            collectedData[fieldName] = fieldValue;
        }
    } else {
        // Fallback: collect by querying all named inputs in the document
        const controls = document.querySelectorAll('input[name], textarea[name], select[name]');
        controls.forEach(control => {
            collectedData[control.name] = control.value;
        });
    }

    return collectedData;
}

function validateBridgeDetailsData(data) {
    // If key fields from Form 1 exist, require them; otherwise allow submission
    if ('riverName' in data || 'roadName' in data || 'chainage' in data) {
        return Boolean(data.riverName) && Boolean(data.roadName) && Boolean(data.chainage);
    }
    return true;
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
                window.location.href = 'IndexC.html';
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
    // Serialize ALL inputs/textareas/selects by name from the Form 2 element
    const formElement = document.getElementById(CONFIG.FORMS.form2.formId);
    const collectedData = {};

    if (formElement) {
        const formData = new FormData(formElement);
        for (const [fieldName, fieldValue] of formData.entries()) {
            // If multiple controls share the same name, last one wins. Adjust if needed.
            collectedData[fieldName] = fieldValue;
        }
    } else {
        // Fallback: collect by querying all named inputs in the document
        const controls = document.querySelectorAll('input[name], textarea[name], select[name]');
        controls.forEach(control => {
            collectedData[control.name] = control.value;
        });
    }

    return collectedData;
}

function validateSurveyAssessmentData(data) {
    // Basic validation: ensure survey dates exist if present in the form
    if ('survey_from_date' in data || 'survey_to_date' in data) {
        return Boolean(data.survey_from_date) && Boolean(data.survey_to_date);
    }
    // If dates not present, allow submission
    return true;
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
                // Finalize on backend
                const assessmentId = localStorage.getItem('assessment_id');
                if (assessmentId) {
                    fetch(`http://localhost:4000/api/assessments/${assessmentId}/finalize`, { method: 'POST' });
                }
                // Redirect to success page or reset
                window.location.href = 'assessment-complete.html';
            } else {
                alert('Error saving Evaluation & Remarks: ' + result.error);
            }
        });
}

function getEvaluationRemarksData() {
    // Serialize ALL inputs/textareas/selects by name from the Form 3 element
    const formElement = document.getElementById(CONFIG.FORMS.form3.formId);
    const collectedData = {};

    if (formElement) {
        const formData = new FormData(formElement);
        for (const [fieldName, fieldValue] of formData.entries()) {
            collectedData[fieldName] = fieldValue;
        }
    } else {
        // Fallback: collect by querying all named inputs in the document
        const controls = document.querySelectorAll('input[name], textarea[name], select[name]');
        controls.forEach(control => {
            collectedData[control.name] = control.value;
        });
    }

    return collectedData;
}

function validateEvaluationRemarksData(data) {
    // If key fields from Form 3 exist, require them; otherwise allow submission
    if ('conditionState' in data || 'remarks' in data) {
        return Boolean(data.conditionState) && Boolean(data.remarks);
    }
    return true;
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