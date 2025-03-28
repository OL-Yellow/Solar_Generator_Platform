// Constants for calculations
const PANEL_COST_PER_KW = 350000;  // NGN per kW
const BATTERY_COST_PER_KWH = 150000;  // NGN per kWh
const INVERTER_BASE_COST = 150000;  // Base cost for small inverter
const INSTALLATION_COST_PERCENTAGE = 0.15;
const DIESEL_PRICE_PER_LITER = 650; // NGN

// Common appliances in Nigeria with typical wattage
const APPLIANCES = {
    'LED Lights': 10,
    'Ceiling Fan': 75,
    'Standing Fan': 60,
    'Smartphone Charger': 5,
    'Laptop': 65,
    'Desktop Computer': 150,
    'TV (32-inch LED)': 50,
    'TV (43-inch LED)': 80,
    'TV (55-inch LED)': 120,
    'Small Refrigerator': 150,
    'Large Refrigerator': 250,
    'Chest Freezer': 200,
    'Air Conditioner (1HP)': 1000,
    'Air Conditioner (1.5HP)': 1500,
    'Air Conditioner (2HP)': 2000,
    'Electric Iron': 1000,
    'Microwave': 1000,
    'Electric Kettle': 1000,
    'Water Dispenser': 100,
    'Security Lights': 50,
    'CCTV System': 100,
    'Small Water Pump': 200,
    'Large Water Pump': 500
};

class SolarCalculator {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4; // Updated to include results step
        this.init();
    }

    init() {
        this.updateProgress();
        this.bindEvents();
    }

    bindEvents() {
        document.querySelectorAll('.btn-next').forEach(button => {
            button.addEventListener('click', () => this.nextStep());
        });

        document.querySelectorAll('.btn-prev').forEach(button => {
            button.addEventListener('click', () => this.previousStep());
        });

        // Calculator form handling
        const calcForm = document.getElementById('calculator-form');
        if (calcForm) {
            calcForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculateResults();
            });
        }

        // Bind calculate button if it exists
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.calculateResults();
            });
        }

        document.querySelectorAll('.appliance-select').forEach(select => {
            select.addEventListener('change', (e) => this.updateAppliancePower(e.target.closest('.appliance-item')));
        });

        document.querySelectorAll('.backup-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleBackupToggle(e.target));
        });
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.appliance-item');
                const valueSpan = item.querySelector('.quantity-value');
                const currentValue = parseInt(valueSpan.textContent);
                if (e.target.dataset.action === 'increase') {
                    valueSpan.textContent = currentValue + 1;
                } else {
                    valueSpan.textContent = Math.max(1, currentValue - 1);
                }
                this.updateAppliancePower(item);
            });
        });

        document.querySelectorAll('.hours-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.appliance-item');
                const valueSpan = item.querySelector('.hours-value');
                const currentValue = parseInt(valueSpan.textContent);
                if (e.target.dataset.action === 'increase') {
                    valueSpan.textContent = Math.min(24, currentValue + 1);
                } else {
                    valueSpan.textContent = Math.max(1, currentValue - 1);
                }
                this.updateAppliancePower(item);
            });
        });

        // Initialize the appliance rows
        document.querySelectorAll('.appliance-item').forEach(item => {
            initializeApplianceRow(item);
        });
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            // Basic form validation for current step
            const currentStepElement = document.getElementById(`step${this.currentStep}`);
            let isValid = true;
            
            // Get required fields in the current step
            currentStepElement.querySelectorAll('input[required], select[required]').forEach(field => {
                if (!field.value) {
                    field.classList.add('is-invalid');
                    isValid = false;
                    
                    // Add shake animation for visual feedback
                    field.classList.add('shake-animation');
                    setTimeout(() => {
                        field.classList.remove('shake-animation');
                    }, 500);
                    
                    // Focus on the first invalid field
                    if (isValid === false) {
                        field.focus();
                    }
                } else {
                    field.classList.remove('is-invalid');
                }
            });
            
            if (!isValid) {
                // Show validation message
                let errorMessage = currentStepElement.querySelector('.validation-message');
                if (!errorMessage) {
                    errorMessage = document.createElement('div');
                    errorMessage.className = 'validation-message alert alert-danger mt-3';
                    errorMessage.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>Please fill out all required fields before proceeding.';
                    currentStepElement.appendChild(errorMessage);
                    
                    // Remove message after 3 seconds
                    setTimeout(() => {
                        errorMessage.remove();
                    }, 3000);
                }
                return;
            }
            
            // Track step completion with Meta Pixel
            if (typeof fbq === 'function') {
                // Track specific step completion
                fbq('trackCustom', `CompleteStep${this.currentStep}`, {
                    content_name: `Step ${this.currentStep} Complete`,
                    content_category: 'Calculator Step',
                    step_number: this.currentStep,
                    total_steps: this.totalSteps
                });
                console.log(`Meta Pixel: Completed Step ${this.currentStep} tracked`);
                
                // Track next button click for the current step
                fbq('trackCustom', `ClickNextStep${this.currentStep}`, {
                    content_name: `Next Button - Step ${this.currentStep}`,
                    content_category: 'Calculator Navigation',
                    step_number: this.currentStep,
                    total_steps: this.totalSteps
                });
                console.log(`Meta Pixel: Next button click for Step ${this.currentStep} tracked`);
            }
            
            // Transition to next step
            document.getElementById(`step${this.currentStep}`).classList.add('d-none');
            this.currentStep++;
            
            const nextStepElement = document.getElementById(`step${this.currentStep}`);
            nextStepElement.classList.remove('d-none');
            
            // Highlight the active step
            nextStepElement.classList.add('highlight-step');
            setTimeout(() => {
                nextStepElement.classList.remove('highlight-step');
            }, 500);
            
            this.updateProgress();
            
            // Scroll to top of form
            window.scrollTo({
                top: document.getElementById('calculator-form').offsetTop - 20,
                behavior: 'smooth'
            });
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            // Track going back to previous step with Meta Pixel
            if (typeof fbq === 'function') {
                fbq('trackCustom', `BackToStep${this.currentStep-1}`, {
                    content_name: `Back Button - From Step ${this.currentStep}`,
                    content_category: 'Calculator Navigation',
                    from_step: this.currentStep,
                    to_step: this.currentStep-1,
                    total_steps: this.totalSteps
                });
                console.log(`Meta Pixel: Back to Step ${this.currentStep-1} tracked`);
            }
            
            document.getElementById(`step${this.currentStep}`).classList.add('d-none');
            this.currentStep--;
            
            const prevStepElement = document.getElementById(`step${this.currentStep}`);
            prevStepElement.classList.remove('d-none');
            
            // Highlight the active step
            prevStepElement.classList.add('highlight-step');
            setTimeout(() => {
                prevStepElement.classList.remove('highlight-step');
            }, 500);
            
            this.updateProgress();
            
            // Scroll to top of form
            window.scrollTo({
                top: document.getElementById('calculator-form').offsetTop - 20,
                behavior: 'smooth'
            });
        }
    }

    updateProgress() {
        // Update progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            const progress = (this.currentStep / this.totalSteps) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        // Update step indicators
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;
            
            // Remove all status classes first
            step.classList.remove('active', 'completed');
            
            // Add appropriate class based on current step
            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                // Add check icon for completed steps
                step.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                // Reset to step number for future steps
                step.textContent = stepNumber;
            }
        });
        
        // Update step labels
        document.querySelectorAll('.progress-label').forEach((label, index) => {
            const stepNumber = index + 1;
            label.classList.toggle('active', stepNumber === this.currentStep);
        });
    }

    handleBackupToggle(button) {
        button.dataset.state = button.dataset.state === 'yes' ? 'no' : 'yes';
        button.textContent = button.dataset.state === 'yes' ? 'Yes' : 'No';
        button.classList.toggle('active', button.dataset.state === 'yes');
        this.updateTotalPower();
    }

    updateAppliancePower(item) {
        const select = item.querySelector('.appliance-select');
        const watts = APPLIANCES[select.value] || 0;
        const quantity = parseInt(item.querySelector('.quantity-value').textContent) || 1;
        const hours = parseInt(item.querySelector('.hours-value').textContent) || 6;
        const kwh = (watts * quantity * hours) / 1000;

        // Track appliance changes with Meta Pixel
        if (typeof fbq === 'function' && select.value) {
            fbq('trackCustom', 'ApplianceConfigured', {
                content_name: 'Appliance Configuration',
                content_category: 'Appliance Selection',
                appliance_type: select.value,
                quantity: quantity,
                hours: hours,
                power_usage: kwh.toFixed(2),
                step_number: this.currentStep
            });
            console.log(`Meta Pixel: Appliance ${select.value} configured`);
        }

        item.querySelector('.watts-value').textContent = watts;
        item.querySelector('.daily-kwh').textContent = kwh.toFixed(2);
        this.updateTotalPower();
    }

    updateTotalPower() {
        let totalPower = 0;
        let backupPower = 0;

        document.querySelectorAll('.appliance-item').forEach(item => {
            const powerValue = parseFloat(item.querySelector('.daily-kwh').textContent) || 0;
            totalPower += powerValue;

            // Only add to backup power if backup is enabled
            const backupToggle = item.querySelector('.backup-toggle');
            if (backupToggle && backupToggle.dataset.state === 'yes') {
                backupPower += powerValue;
            }
        });

        document.getElementById('total-daily-power').textContent = totalPower.toFixed(2);
        document.getElementById('backup-daily-power').textContent = backupPower.toFixed(2);
    }

    async calculateResults() {
        try {
            // Track this calculation event to Meta Pixel if available
            if (typeof fbq === 'function') {
                fbq('trackCustom', 'CalculateResults', {
                    content_name: 'System Calculation',
                    content_category: 'Solar Calculator',
                    value: parseFloat(document.getElementById('total-daily-power').textContent) || 0,
                    currency: 'NGN'
                });
                console.log('Meta Pixel: Calculation event tracked');
            }
            
            // Collect appliance data
            const appliances = [];
            document.querySelectorAll('.appliance-item').forEach(item => {
                const select = item.querySelector('.appliance-select');
                if (select.value) {  // Only include appliances that have been selected
                    appliances.push({
                        type: select.value,
                        units: parseInt(item.querySelector('.quantity-value').textContent) || 1,
                        hours: parseInt(item.querySelector('.hours-value').textContent) || 6,
                        backup: item.querySelector('.backup-toggle').dataset.state === 'yes',
                        power: parseInt(item.querySelector('.watts-value').textContent) || 0,
                        daily_usage: parseFloat(item.querySelector('.daily-kwh').textContent) || 0
                    });
                }
            });

            const locationSelect = document.getElementById('location');
            const userData = {
                location: locationSelect.value,
                location_name: locationSelect.options[locationSelect.selectedIndex].text,
                user_type: document.getElementById('usage-type')?.value || '',
                grid_hours: document.getElementById('grid-hours')?.value || '',
                monthly_fuel_cost: document.getElementById('generator-fuel')?.value || '',
                daily_energy: document.getElementById('backup-daily-power')?.textContent || '',
                maintenance_cost: document.getElementById('generator-maintenance')?.value || '',
                appliances: appliances  // Add appliances data to the request
            };

            // Enhanced validation
            if (!userData.location || !userData.user_type) {
                alert('Please complete the basic information section first.');
                return;
            }

            if (!userData.grid_hours || !userData.monthly_fuel_cost || !userData.maintenance_cost) {
                alert('Please complete the current power usage section first.');
                return;
            }

            if (!userData.daily_energy || parseFloat(userData.daily_energy) === 0) {
                alert('Please add at least one appliance to backup before calculating.');
                return;
            }

            // Log the data being sent
            console.log('Sending data to backend:', userData);

            const response = await fetch('/get_recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received response:', data);

            if (data.success) {
                // Store application number for later use in lead submission
                if (data.application_number) {
                    localStorage.setItem('applicationNumber', data.application_number);
                }
                
                // Navigate to results step
                document.getElementById(`step${this.currentStep}`).classList.add('d-none');
                this.currentStep = 4; // Set to results step
                document.getElementById('step4').classList.remove('d-none');
                document.getElementById('results-section').innerHTML = data.recommendations;
                this.updateProgress();
                
                // Scroll to top of results
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error(data.error || 'Failed to get recommendations');
            }
        } catch (error) {
            console.error('Error details:', error);
            alert('Failed to calculate results. Please check your inputs and try again.');
        }
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize calculator if we're on the calculator page
    if (document.getElementById('calculator-form')) {
        try {
            window.calculator = new SolarCalculator();
            
            // Add common pre-filled appliances for Nigerian households
            addPrefilledAppliances();
        } catch (error) {
            console.error('Error initializing calculator:', error);
        }
    }
});

// Function to add event listeners to appliance rows
function initializeApplianceRow(applianceRow) {
    if (!applianceRow) {
        console.error('Invalid appliance row element');
        return;
    }
    
    const calculator = window.calculator;
    if (!calculator) {
        console.error('Calculator not initialized');
        return;
    }

    const selectElement = applianceRow.querySelector('.appliance-select');
    if (selectElement) {
        selectElement.addEventListener('change', () =>
            calculator.updateAppliancePower(applianceRow)
        );
    }

    applianceRow.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = applianceRow.querySelector('.quantity-value');
            if (value) {
                if (btn.dataset.action === 'increase') {
                    value.textContent = parseInt(value.textContent) + 1;
                } else {
                    value.textContent = Math.max(1, parseInt(value.textContent) - 1);
                }
                calculator.updateAppliancePower(applianceRow);
            }
        });
    });

    applianceRow.querySelectorAll('.hours-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = applianceRow.querySelector('.hours-value');
            if (value) {
                if (btn.dataset.action === 'increase') {
                    value.textContent = Math.min(24, parseInt(value.textContent) + 1);
                } else {
                    value.textContent = Math.max(1, parseInt(value.textContent) - 1);
                }
                calculator.updateAppliancePower(applianceRow);
            }
        });
    });

    const backupToggle = applianceRow.querySelector('.backup-toggle');
    if (backupToggle) {
        backupToggle.addEventListener('click', (e) => {
            calculator.handleBackupToggle(e.target);
            calculator.updateAppliancePower(applianceRow);
        });
    }

    const deleteBtn = applianceRow.querySelector('.delete-appliance');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            applianceRow.remove();
            calculator.updateTotalPower();
        });
    }

    calculator.updateAppliancePower(applianceRow);
}

function addApplianceRow() {
    const calculator = window.calculator;
    if (!calculator) {
        console.error('Calculator not initialized');
        return;
    }

    const applianceList = document.querySelector('.appliance-list');
    if (!applianceList) {
        console.error('Appliance list container not found');
        return;
    }
    
    // Track adding a new appliance with Meta Pixel
    if (typeof fbq === 'function') {
        fbq('trackCustom', 'AddAppliance', {
            content_name: 'Add New Appliance',
            content_category: 'Appliance Selection',
            step_number: window.calculator.currentStep
        });
        console.log('Meta Pixel: Add appliance tracked');
    }
    
    const addButton = applianceList.querySelector('.btn-add-appliance');
    const template = document.createElement('div');

    template.innerHTML = `
        <div class="appliance-item">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <select class="form-select appliance-select mb-3" required>
                    <option value="">Select Appliance</option>
                    ${Object.keys(APPLIANCES).map(appliance =>
                        `<option value="${appliance}">${appliance}</option>`
                    ).join('')}
                </select>
                <button type="button" class="btn btn-sm btn-outline-danger delete-appliance ms-2" title="Remove appliance">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="appliance-controls">
                <div class="control-group">
                    <div class="d-flex align-items-center justify-content-between w-100">
                        <div class="d-flex flex-column align-items-center">
                            <label class="text-muted mb-1">Number of Units</label>
                            <div class="btn-group">
                                <button type="button" class="btn btn-sm btn-outline-secondary quantity-btn" data-action="decrease">-</button>
                                <span class="quantity-value mx-2">1</span>
                                <button type="button" class="btn btn-sm btn-outline-secondary quantity-btn" data-action="increase">+</button>
                            </div>
                        </div>
                        <div class="d-flex flex-column align-items-center">
                            <label class="text-muted mb-1">Number Hours per Day in use</label>
                            <div class="btn-group">
                                <button type="button" class="btn btn-sm btn-outline-secondary hours-btn" data-action="decrease">-</button>
                                <span class="hours-value mx-2">6</span>
                                <button type="button" class="btn btn-sm btn-outline-secondary hours-btn" data-action="increase">+</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="backup-control">
                        <label class="form-label d-block mb-1">Include in Backup?</label>
                        <button type="button" class="btn btn-sm backup-toggle active" data-state="yes">Yes</button>
                    </div>
                    <div class="text-end">
                        <div class="power-stats">
                            <div class="power-stat">
                                <span class="stat-label">Power:</span>
                                <span class="watts-value">0</span> W
                            </div>
                            <div class="power-stat">
                                <span class="stat-label">Daily Usage:</span>
                                <span class="daily-kwh">0.00</span> kWh/day
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const newRow = template.firstElementChild;
    applianceList.insertBefore(newRow, addButton);
    initializeApplianceRow(newRow);
}

// Function to add pre-filled common appliances for Nigerian households
function addPrefilledAppliances() {
    // Only add pre-filled appliances if there are no existing ones
    if (document.querySelectorAll('.appliance-item').length === 0) {
        // Common appliances for Nigerian homes with their default settings
        const commonAppliances = [
            { name: 'LED Lights', quantity: 5, hours: 8, backup: true },
            { name: 'Laptop', quantity: 1, hours: 6, backup: true },
            { name: 'TV (32-inch LED)', quantity: 1, hours: 6, backup: true },
            { name: 'Standing Fan', quantity: 1, hours: 8, backup: true }
        ];
        
        // Add each common appliance
        commonAppliances.forEach(appliance => {
            // Add new row
            addApplianceRow();
            
            // Configure the last added row with the appliance data
            const newRow = document.querySelector('.appliance-list .appliance-item:last-of-type');
            
            // Set the appliance type
            const select = newRow.querySelector('.appliance-select');
            select.value = appliance.name;
            
            // Set the quantity
            const quantitySpan = newRow.querySelector('.quantity-value');
            quantitySpan.textContent = appliance.quantity;
            
            // Set the hours
            const hoursSpan = newRow.querySelector('.hours-value');
            hoursSpan.textContent = appliance.hours;
            
            // Set backup status
            const backupToggle = newRow.querySelector('.backup-toggle');
            backupToggle.dataset.state = appliance.backup ? 'yes' : 'no';
            backupToggle.textContent = appliance.backup ? 'Yes' : 'No';
            backupToggle.classList.toggle('active', appliance.backup);
            
            // Update calculations
            window.calculator.updateAppliancePower(newRow);
        });
    }
}

// Handle lead submission from the results page
function setupLeadSubmission() {
    const submitLeadBtn = document.getElementById('submit-lead-btn');
    if (submitLeadBtn) {
        submitLeadBtn.addEventListener('click', async function() {
            const fullName = document.getElementById('full-name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            
            // Basic validation
            if (!fullName || !email || !phone) {
                alert('Please fill in all contact information fields.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // Track this lead submission event to Meta Pixel if available
            if (typeof fbq === 'function') {
                fbq('track', 'Lead', {
                    content_name: 'Lead Submission',
                    content_category: 'Form Submit',
                    status: 'form_submitted'
                });
                console.log('Meta Pixel: Lead submission event tracked');
            }
            
            try {
                const response = await fetch('/submit_lead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        full_name: fullName,
                        email: email,
                        phone: phone,
                        application_number: localStorage.getItem('applicationNumber') || ''
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    // Redirect to thank you page
                    window.location.href = '/thank-you';
                } else {
                    throw new Error(data.error || 'Failed to submit information');
                }
            } catch (error) {
                console.error('Error submitting lead:', error);
                alert('There was a problem submitting your information. Please try again.');
            }
        });
    }
}

// Initialize existing appliance rows
document.querySelectorAll('.appliance-item').forEach(initializeApplianceRow);

// Set up lead submission when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupLeadSubmission();
});