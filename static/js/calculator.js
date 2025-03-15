// Constants for calculations
const PANEL_COST_PER_KW = 250000; // NGN
const BATTERY_COST_PER_KWH = 200000; // NGN
const INSTALLATION_COST_PERCENTAGE = 0.15;
const DIESEL_PRICE_PER_LITER = 650; // NGN

// Common appliances in Nigeria with typical wattage
const APPLIANCES = {
    'LED Lights': 10,
    'Ceiling Fan': 75,
    'Standing Fan': 50,
    'Smartphone Charger': 10,
    'Laptop': 65,
    'Desktop Computer': 150,
    'TV (32-inch LED)': 50,
    'TV (43-inch LED)': 100,
    'TV (55-inch LED)': 150,
    'Small Refrigerator': 150,
    'Large Refrigerator': 250,
    'Chest Freezer': 300,
    'Air Conditioner (1HP)': 750,
    'Air Conditioner (1.5HP)': 1100,
    'Air Conditioner (2HP)': 1500,
    'Electric Iron': 1000,
    'Microwave': 800,
    'Electric Kettle': 1500,
    'Water Dispenser': 100,
    'Security Lights': 30,
    'CCTV System': 50,
    'Small Water Pump': 750,
    'Large Water Pump': 1500
};

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
            this.initializeApplianceDropdowns();
        });
    }

    initializeApplianceDropdowns() {
        // Initialize all appliance dropdowns with the list of appliances
        const applianceSelects = document.querySelectorAll('.appliance-select');
        applianceSelects.forEach(select => {
            // Add change event listener
            select.addEventListener('change', (e) => {
                const watts = APPLIANCES[e.target.value] || 0;
                const row = e.target.closest('tr');
                row.querySelector('.watts').value = watts;
                this.updateAppliancePower();
            });
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
        // Add listeners for quantity and hours inputs
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
            const quantity = parseFloat(row.querySelector('.quantity').value) || 1; //Default to 1 if no quantity
            const daily = (watts * hours * quantity) / 1000; // Convert to kWh
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
                document.getElementById('results-section').innerHTML = data.recommendations;
                document.getElementById('results-section').classList.remove('d-none');
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
        <td>
            <select class="form-select appliance-select" required>
                <option value="">Select Appliance</option>
                ${Object.keys(APPLIANCES).map(appliance => 
                    `<option value="${appliance}">${appliance}</option>`
                ).join('')}
            </select>
        </td>
        <td><input type="number" class="form-control watts" readonly></td>
        <td><input type="number" class="form-control quantity" min="1" value="1" required></td>
        <td><input type="number" class="form-control hours" min="0" max="24" required></td>
        <td><span class="daily-kwh">0.00</span></td>
    `;
    tbody.appendChild(newRow);

    // Add event listeners
    const select = newRow.querySelector('.appliance-select');
    select.addEventListener('change', (e) => {
        const watts = APPLIANCES[e.target.value] || 0;
        newRow.querySelector('.watts').value = watts;
        calculator.updateAppliancePower();
    });

    const inputs = newRow.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', () => calculator.updateAppliancePower());
    });
}

// Update sun hours when location changes
document.getElementById('location').addEventListener('change', function() {
    document.getElementById('sun-hours').value = this.value;
});