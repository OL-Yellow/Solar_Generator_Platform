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
        this.totalSteps = 5;
        this.bindEvents();
        this.updateProgress();
    }

    bindEvents() {
        // Next button handler
        document.querySelectorAll('.btn-next').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextStep();
            });
        });

        // Previous button handler
        document.querySelectorAll('.btn-prev').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.previousStep();
            });
        });

        // Calculate button handler
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.calculateResults();
            });
        }

        // Delete buttons
        document.querySelectorAll('.delete-appliance').forEach(button => {
            button.addEventListener('click', () => {
                const applianceItem = button.closest('.appliance-item');
                if (applianceItem) {
                    applianceItem.remove();
                    this.updateTotalPower();
                }
            });
        });

        // Appliance controls
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quantity-btn')) {
                this.handleQuantityButton(e.target);
            } else if (e.target.matches('.hours-btn')) {
                this.handleHoursButton(e.target);
            } else if (e.target.matches('.backup-toggle')) {
                this.handleBackupToggle(e.target);
            }
        });

        // Appliance select changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('.appliance-select')) {
                const watts = APPLIANCES[e.target.value] || 0;
                const item = e.target.closest('.appliance-item');
                item.querySelector('.watts-value').textContent = watts;
                this.updateAppliancePower(item);
            }
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
        const currentStep = document.getElementById(`step${this.currentStep}`);
        const nextStep = document.getElementById(`step${this.currentStep + 1}`);

        if (currentStep && nextStep) {
            currentStep.classList.add('d-none');
            nextStep.classList.remove('d-none');
            this.currentStep++;
            this.updateProgress();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            const currentStep = document.getElementById(`step${this.currentStep}`);
            const prevStep = document.getElementById(`step${this.currentStep - 1}`);

            if (currentStep && prevStep) {
                currentStep.classList.add('d-none');
                prevStep.classList.remove('d-none');
                this.currentStep--;
                this.updateProgress();
            }
        }
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

// Function to add new appliance row
function addApplianceRow() {
    const applianceList = document.querySelector('.appliance-list');
    const newApplianceRow = document.createElement('div');
    newApplianceRow.className = 'appliance-item';
    newApplianceRow.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
            <select class="form-select appliance-select mb-3" required>
                <option value="">Select Appliance</option>
                ${Object.keys(APPLIANCES).map(appliance => 
                    `<option value="${appliance}">${appliance}</option>`
                ).join('')}
            </select>
            <button type="button" class="btn btn-sm btn-outline-danger delete-appliance" title="Remove appliance">
                <i class="fas fa-times"></i>
            </button>
        </div>

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
                <div class="text-end">
                    <span class="watts-value">0</span>
                    <small class="d-block text-muted daily-kwh">0.00 kWh/day</small>
                </div>
            </div>
        </div>
    `;
    applianceList.appendChild(newApplianceRow);

    // Add event listeners
    const select = newApplianceRow.querySelector('.appliance-select');
    select.addEventListener('change', (e) => {
        const watts = APPLIANCES[e.target.value] || 0;
        const item = e.target.closest('.appliance-item');
        item.querySelector('.watts-value').textContent = watts;
        calculator.updateAppliancePower(item);
    });

    const deleteButton = newApplianceRow.querySelector('.delete-appliance');
    deleteButton.addEventListener('click', () => {
        applianceList.removeChild(newApplianceRow);
        calculator.updateTotalPower();
    });
}

// Initialize calculator when DOM is ready
let calculator;
document.addEventListener('DOMContentLoaded', () => {
    calculator = new SolarCalculator();

    // Update sun hours when location changes
    document.getElementById('location').addEventListener('change', function() {
        document.getElementById('sun-hours').value = this.value;
    });
});