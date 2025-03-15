// Constants for calculations
const PANEL_COST_PER_KW = 250000; // NGN
const BATTERY_COST_PER_KWH = 200000; // NGN
const INSTALLATION_COST_PERCENTAGE = 0.15;
const DIESEL_PRICE_PER_LITER = 650; // NGN

class SolarCalculator {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.updateProgress();
            this.setupStepNavigation();
            this.setupCalculationTriggers();
            this.setupApplianceListeners();
        });
    }

    setupStepNavigation() {
        // Set up next button handlers
        const nextButtons = document.querySelectorAll('.btn-next');
        nextButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextStep();
            });
        });

        // Set up previous button handlers
        const prevButtons = document.querySelectorAll('.btn-prev');
        prevButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.previousStep();
            });
        });
    }

    setupCalculationTriggers() {
        const calculateButton = document.getElementById('calculate-btn');
        if (calculateButton) {
            calculateButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.calculateResults();
            });
        }
    }

    setupApplianceListeners() {
        // Initial appliance row listeners
        const applianceInputs = document.querySelectorAll('.appliance-row input');
        applianceInputs.forEach(input => {
            input.addEventListener('change', () => this.updateAppliancePower());
        });
    }

    updateProgress() {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            const progress = (this.currentStep / this.totalSteps) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            const currentStepElement = document.getElementById(`step${this.currentStep}`);
            const nextStepElement = document.getElementById(`step${this.currentStep + 1}`);

            if (currentStepElement && nextStepElement) {
                currentStepElement.classList.add('d-none');
                nextStepElement.classList.remove('d-none');
                this.currentStep++;
                this.updateProgress();
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            const currentStepElement = document.getElementById(`step${this.currentStep}`);
            const prevStepElement = document.getElementById(`step${this.currentStep - 1}`);

            if (currentStepElement && prevStepElement) {
                currentStepElement.classList.add('d-none');
                prevStepElement.classList.remove('d-none');
                this.currentStep--;
                this.updateProgress();
            }
        }
    }

    validateCurrentStep() {
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        if (!currentStepElement) return false;

        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                valid = false;
                field.classList.add('is-invalid');
            } else {
                field.classList.remove('is-invalid');
            }
        });

        if (!valid) {
            // Show validation message
            const firstInvalid = currentStepElement.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
            }
        }

        return valid;
    }

    updateAppliancePower() {
        let totalPower = 0;
        const applianceRows = document.querySelectorAll('.appliance-row');

        applianceRows.forEach(row => {
            const watts = parseFloat(row.querySelector('.watts').value) || 0;
            const hours = parseFloat(row.querySelector('.hours').value) || 0;
            const daily = (watts * hours) / 1000; // Convert to kWh
            row.querySelector('.daily-kwh').textContent = daily.toFixed(2);
            totalPower += daily;
        });

        document.getElementById('total-daily-power').textContent = totalPower.toFixed(2);
    }

    calculateResults() {
        // Get form values
        const userData = {
            location: document.getElementById('location').value,
            user_type: document.getElementById('user-type').value,
            generator_size: parseFloat(document.getElementById('generator-size').value) || 0,
            generator_fuel: parseFloat(document.getElementById('generator-fuel').value) || 0,
            daily_energy: parseFloat(document.getElementById('total-daily-power').textContent) || 0,
            backup_days: parseFloat(document.getElementById('backup-days').value) || 1,
            budget_range: document.getElementById('budget-range').value
        };

        // Show loading state
        const calculateBtn = document.getElementById('calculate-btn');
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Getting Recommendations...';

        // Call the AI recommendations endpoint
        fetch('/get_recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update results section with AI recommendations
                document.getElementById('results-section').innerHTML = `
                    <div class="results-card">
                        <h3 class="mb-4">AI-Powered Solar Solution Recommendations</h3>
                        <div class="recommendation-text">
                            ${data.recommendations}
                        </div>
                    </div>

                    <!-- Lead Capture Form -->
                    <div class="results-card">
                        <h3 class="mb-4">Get Detailed Quote</h3>
                        <form action="/submit_lead" method="POST" class="needs-validation" novalidate>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label for="name" class="form-label">Full Name</label>
                                    <input type="text" class="form-control" id="name" name="name" required>
                                    <div class="invalid-feedback">Please enter your name.</div>
                                </div>
                                <div class="col-md-6">
                                    <label for="phone" class="form-label">Phone Number</label>
                                    <input type="tel" class="form-control" id="phone" name="phone" required>
                                    <div class="invalid-feedback">Please enter a valid phone number.</div>
                                </div>
                                <div class="col-md-6">
                                    <label for="email" class="form-label">Email Address</label>
                                    <input type="email" class="form-control" id="email" name="email" required>
                                    <div class="invalid-feedback">Please enter a valid email address.</div>
                                </div>
                                <div class="col-md-6">
                                    <label for="contact-time" class="form-label">Best Time to Contact</label>
                                    <select class="form-select" id="contact-time" name="contact_time" required>
                                        <option value="">Choose time...</option>
                                        <option value="morning">Morning (9AM - 12PM)</option>
                                        <option value="afternoon">Afternoon (12PM - 4PM)</option>
                                        <option value="evening">Evening (4PM - 7PM)</option>
                                    </select>
                                    <div class="invalid-feedback">Please select a contact time.</div>
                                </div>
                            </div>
                            <input type="hidden" id="lead-system-size" name="system_size" value="AI Recommendation">
                            <input type="hidden" id="lead-estimated-savings" name="estimated_savings" value="Custom">
                            <button type="submit" class="btn btn-solar mt-4">Get Quote</button>
                        </form>
                    </div>
                `;

                // Show results section
                document.getElementById('results-section').classList.remove('d-none');

                // Reinitialize form validation for the new form
                const forms = document.querySelectorAll('.needs-validation');
                forms.forEach(form => {
                    form.addEventListener('submit', event => {
                        if (!form.checkValidity()) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        form.classList.add('was-validated');
                    });
                });
            } else {
                alert('Error getting recommendations. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error getting recommendations. Please try again.');
        })
        .finally(() => {
            // Reset button state
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = 'Calculate Results';
        });
    }
}

// Initialize calculator
const calculator = new SolarCalculator();

// Function to add new appliance row
function addApplianceRow() {
    const tbody = document.querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.className = 'appliance-row';
    newRow.innerHTML = `
        <td><input type="text" class="form-control" placeholder="Appliance name" required></td>
        <td><input type="number" class="form-control watts" min="0" required></td>
        <td><input type="number" class="form-control hours" min="0" max="24" required></td>
        <td><span class="daily-kwh">0.00</span></td>
    `;
    tbody.appendChild(newRow);

    // Add event listeners to new inputs
    const inputs = newRow.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', () => calculator.updateAppliancePower());
    });
}

// Update sun hours when location changes
document.getElementById('location').addEventListener('change', function() {
    document.getElementById('sun-hours').value = this.value;
});