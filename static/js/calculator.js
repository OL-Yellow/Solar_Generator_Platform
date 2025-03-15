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
        this.totalSteps = 5; // Updated to 5 steps
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
            } else if (e.target.matches('.delete-appliance') || e.target.closest('.delete-appliance')) {
                const applianceItem = e.target.closest('.appliance-item');
                if (applianceItem) {
                    applianceItem.remove();
                    this.updateTotalPower();
                }
            }
        });

        // Setup appliance select handlers - adjusted for new structure
        document.addEventListener('change', (e) => {
            if (e.target.matches('.appliance-select')) {
                const watts = APPLIANCES[e.target.value] || 0;
                const item = e.target.closest('.appliance-item');
                item.querySelector('.watts-value').textContent = watts;
                this.updateAppliancePower(item);
            }
        });
    }

    handleQuantityButton(button) {
        const item = button.closest('.appliance-item');
        const quantitySpan = item.querySelector('.quantity-value');
        let quantity = parseInt(quantitySpan.textContent);

        if (button.dataset.action === 'increase') {
            quantity = Math.min(quantity + 1, 99);
        } else {
            quantity = Math.max(quantity - 1, 1);
        }

        quantitySpan.textContent = quantity;
        this.updateAppliancePower(item);
    }

    handleHoursButton(button) {
        const item = button.closest('.appliance-item');
        const hoursSpan = item.querySelector('.hours-value');
        let hours = parseInt(hoursSpan.textContent);

        if (button.dataset.action === 'increase') {
            hours = Math.min(hours + 1, 24);
        } else {
            hours = Math.max(hours - 1, 0);
        }

        hoursSpan.textContent = hours;
        this.updateAppliancePower(item);
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

    updateAppliancePower(item) {
        const watts = parseInt(item.querySelector('.watts-value').textContent) || 0;
        const hours = parseInt(item.querySelector('.hours-value').textContent) || 0;
        const quantity = parseInt(item.querySelector('.quantity-value').textContent) || 1;

        const dailyKwh = (watts * hours * quantity) / 1000;
        item.querySelector('.daily-kwh').textContent = `${dailyKwh.toFixed(2)} kWh/day`;

        this.updateTotalPower();
    }

    updateTotalPower() {
        let totalPower = 0;
        document.querySelectorAll('.appliance-item').forEach(item => {
            const watts = parseInt(item.querySelector('.watts-value').textContent) || 0;
            const hours = parseInt(item.querySelector('.hours-value').textContent) || 0;
            const quantity = parseInt(item.querySelector('.quantity-value').textContent) || 1;
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

                // Move to step 5 (results)
                const step4 = document.getElementById('step4');
                const step5 = document.getElementById('step5');
                step4.classList.add('d-none');
                step5.classList.remove('d-none');
                this.currentStep = 5;
                this.updateProgress();
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
    const applianceList = document.querySelector('.appliance-list');
    const newApplianceItem = document.createElement('div');
    newApplianceItem.className = 'appliance-item';
    newApplianceItem.innerHTML = `
        <select class="form-select appliance-select mb-3" required>
            <option value="">Select Appliance</option>
            ${Object.keys(APPLIANCES).map(appliance => 
                `<option value="${appliance}">${appliance}</option>`
            ).join('')}
        </select>

        <div class="appliance-controls">
            <div class="control-group">
                <div class="d-flex align-items-center justify-content-between w-100">
                    <div class="d-flex flex-column align-items-center">
                        <small class="text-muted me-2">#</small>
                        <div class="btn-group">
                            <button type="button" class="btn btn-sm btn-outline-light quantity-btn" data-action="decrease">-</button>
                            <span class="quantity-value mx-2">1</span>
                            <button type="button" class="btn btn-sm btn-outline-light quantity-btn" data-action="increase">+</button>
                        </div>
                    </div>

                    <div class="d-flex flex-column align-items-center">
                        <small class="text-muted me-2">Hours / Day</small>
                        <div class="btn-group">
                            <button type="button" class="btn btn-sm btn-outline-light hours-btn" data-action="decrease">-</button>
                            <span class="hours-value mx-2">6</span>
                            <button type="button" class="btn btn-sm btn-outline-light hours-btn" data-action="increase">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-3">
                <button type="button" class="btn btn-sm backup-toggle" data-state="no">No</button>
                <button type="button" class="btn btn-sm btn-danger delete-appliance">Delete</button>
                <div class="text-end">
                    <span class="watts-value">0</span>
                    <small class="d-block text-muted daily-kwh">0.00 kWh/day</small>
                </div>
            </div>
        </div>
    `;
    applianceList.appendChild(newApplianceItem);

    // Add event listeners to new inputs
    const select = newApplianceItem.querySelector('.appliance-select');
    select.addEventListener('change', (e) => {
        const watts = APPLIANCES[e.target.value] || 0;
        const item = e.target.closest('.appliance-item');
        item.querySelector('.watts-value').textContent = watts;
        calculator.updateAppliancePower(item);
    });

    const quantityBtns = newApplianceItem.querySelectorAll('.quantity-btn');
    quantityBtns.forEach(btn => btn.addEventListener('click', (e) => calculator.handleQuantityButton(e.target)));

    const hoursBtns = newApplianceItem.querySelectorAll('.hours-btn');
    hoursBtns.forEach(btn => btn.addEventListener('click', (e) => calculator.handleHoursButton(e.target)));

    const backupToggle = newApplianceItem.querySelector('.backup-toggle');
    if (backupToggle) backupToggle.addEventListener('click', (e) => calculator.handleBackupToggle(e.target));
    const deleteButton = newApplianceItem.querySelector('.delete-appliance');
    deleteButton.addEventListener('click', (e) => {
        const applianceItem = e.target.closest('.appliance-item');
        if (applianceItem) {
            applianceItem.remove();
            calculator.updateTotalPower();
        }
    });
}



document.getElementById('location').addEventListener('change', function() {
    document.getElementById('sun-hours').value = this.value;
});

const calculator = new SolarCalculator();