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
        document.addEventListener('DOMContentLoaded', () => {
            this.updateProgress();
            this.setupStepNavigation();
            this.setupApplianceControls();
            this.setupCalculationTriggers();
        });
    }

    setupApplianceControls() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quantity-btn')) {
                this.handleQuantityButton(e.target);
            } else if (e.target.matches('.hours-btn')) {
                this.handleHoursButton(e.target);
            } else if (e.target.matches('.backup-toggle')) {
                this.handleBackupToggle(e.target);
            }
        });

        // Setup appliance select handlers
        const applianceSelects = document.querySelectorAll('.appliance-select');
        applianceSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const watts = APPLIANCES[e.target.value] || 0;
                const row = e.target.closest('tr');
                row.querySelector('.watts-value').textContent = watts;
                this.updateAppliancePower(row);
            });
        });
    }

    handleQuantityButton(button) {
        const row = button.closest('tr');
        const quantitySpan = row.querySelector('.quantity-value');
        let quantity = parseInt(quantitySpan.textContent);

        if (button.dataset.action === 'increase') {
            quantity = Math.min(quantity + 1, 99);
        } else {
            quantity = Math.max(quantity - 1, 1);
        }

        quantitySpan.textContent = quantity;
        this.updateAppliancePower(row);
    }

    handleHoursButton(button) {
        const row = button.closest('tr');
        const hoursSpan = row.querySelector('.hours-value');
        let hours = parseInt(hoursSpan.textContent);

        if (button.dataset.action === 'increase') {
            hours = Math.min(hours + 1, 24);
        } else {
            hours = Math.max(hours - 1, 0);
        }

        hoursSpan.textContent = hours;
        this.updateAppliancePower(row);
    }

    handleBackupToggle(button) {
        if (button.dataset.state === 'yes') {
            button.dataset.state = 'no';
            button.textContent = 'No';
            button.classList.remove('active');
        } else {
            button.dataset.state = 'yes';
            button.textContent = 'Yes';
            button.classList.add('active');
        }
    }

    updateAppliancePower(row) {
        const watts = parseInt(row.querySelector('.watts-value').textContent) || 0;
        const hours = parseInt(row.querySelector('.hours-value').textContent) || 0;
        const quantity = parseInt(row.querySelector('.quantity-value').textContent) || 1;

        const dailyKwh = (watts * hours * quantity) / 1000;
        row.querySelector('.daily-kwh').textContent = `${dailyKwh.toFixed(2)} kWh/day`;

        this.updateTotalPower();
    }

    updateTotalPower() {
        let totalPower = 0;
        document.querySelectorAll('.appliance-row').forEach(row => {
            const watts = parseInt(row.querySelector('.watts-value').textContent) || 0;
            const hours = parseInt(row.querySelector('.hours-value').textContent) || 0;
            const quantity = parseInt(row.querySelector('.quantity-value').textContent) || 1;
            totalPower += (watts * hours * quantity) / 1000;
        });

        document.getElementById('total-daily-power').textContent = totalPower.toFixed(2);
    }

    setupStepNavigation() {
        const nextButtons = document.querySelectorAll('.btn-next');
        nextButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextStep();
            });
        });

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
            const firstInvalid = currentStepElement.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
            }
        }

        return valid;
    }

    calculateResults() {
        const userData = {
            location: document.getElementById('location').value,
            user_type: document.getElementById('user-type').value,
            generator_size: parseFloat(document.getElementById('generator-size').value) || 0,
            generator_fuel: parseFloat(document.getElementById('generator-fuel').value) || 0,
            daily_energy: parseFloat(document.getElementById('total-daily-power').textContent) || 0,
            backup_days: parseFloat(document.getElementById('backup-days').value) || 1,
            budget_range: document.getElementById('budget-range').value
        };

        const calculateBtn = document.getElementById('calculate-btn');
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Getting Recommendations...';

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
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = 'Calculate Results';
        });
    }
}

function addApplianceRow() {
    const tbody = document.querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.className = 'appliance-row';
    newRow.innerHTML = `
        <td>
            <select class="form-select appliance-select mb-2" required>
                <option value="">Select Appliance</option>
                ${Object.keys(APPLIANCES).map(appliance => 
                    `<option value="${appliance}">${appliance}</option>`
                ).join('')}
            </select>
            <div class="d-flex align-items-center">
                <small class="text-muted me-2">Quantity:</small>
                <button type="button" class="btn btn-sm btn-outline-light quantity-btn" data-action="decrease">-</button>
                <span class="quantity-value mx-2">1</span>
                <button type="button" class="btn btn-sm btn-outline-light quantity-btn" data-action="increase">+</button>
            </div>
        </td>
        <td>
            <div class="d-flex align-items-center">
                <button type="button" class="btn btn-sm btn-outline-light hours-btn" data-action="decrease">-</button>
                <span class="hours-value mx-2">0</span>
                <button type="button" class="btn btn-sm btn-outline-light hours-btn" data-action="increase">+</button>
            </div>
        </td>
        <td>
            <button type="button" class="btn btn-sm backup-toggle active" data-state="yes">Yes</button>
        </td>
        <td>
            <span class="watts-value">0</span>
            <small class="d-block text-muted daily-kwh">0.00 kWh/day</small>
        </td>
    `;
    tbody.appendChild(newRow);

    const select = newRow.querySelector('.appliance-select');
    select.addEventListener('change', (e) => {
        const watts = APPLIANCES[e.target.value] || 0;
        const row = e.target.closest('tr');
        row.querySelector('.watts-value').textContent = watts;
        calculator.updateAppliancePower(row);
    });
}

document.getElementById('location').addEventListener('change', function() {
    document.getElementById('sun-hours').value = this.value;
});

const calculator = new SolarCalculator();