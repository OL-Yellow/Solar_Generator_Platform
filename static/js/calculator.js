// Constants for calculations
const PANEL_COST_PER_KW = 250000; // NGN
const BATTERY_COST_PER_KWH = 200000; // NGN
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
        this.totalSteps = 5;
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

        document.querySelectorAll('.backup-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleBackupToggle(e.target));
        });
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
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

    updateProgress() {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            const progress = (this.currentStep / this.totalSteps) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
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
        const select = item.querySelector('.appliance-select');
        const watts = APPLIANCES[select.value] || 0;
        const quantity = parseInt(item.querySelector('.quantity-value').textContent) || 1;
        const hours = parseInt(item.querySelector('.hours-value').textContent) || 6;
        const kwh = (watts * quantity * hours) / 1000;

        item.querySelector('.watts-value').textContent = watts;
        item.querySelector('.daily-kwh').textContent = kwh.toFixed(2) + ' kWh/day';
        this.updateTotalPower();
    }

    updateTotalPower() {
        let totalPower = 0;
        document.querySelectorAll('.daily-kwh').forEach(element => {
            const value = parseFloat(element.textContent.replace(' kWh/day', '')) || 0;
            totalPower += value;
        });
        document.getElementById('total-daily-power').textContent = totalPower.toFixed(2);
    }

    async calculateResults() {
        try {
            const userData = {
                location: document.getElementById('location')?.value || '',
                user_type: document.getElementById('user-type')?.value || '',
                generator_size: document.getElementById('generator-size')?.value || '',
                generator_fuel: document.getElementById('generator-fuel')?.value || '',
                daily_energy: document.getElementById('total-daily-power')?.textContent || '',
                backup_days: document.getElementById('backup-days')?.value || '',
                budget_range: document.getElementById('budget-range')?.value || ''
            };

            const response = await fetch('/get_recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            if (data.success) {
                const resultsSection = document.getElementById('results-section');
                if (resultsSection) {
                    resultsSection.innerHTML = data.recommendations;
                    this.nextStep();
                }
            } else {
                alert('Failed to get recommendations: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to calculate results. Please try again.');
        }
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new SolarCalculator();
});

// Add appliance row function
function addApplianceRow() {
    const applianceList = document.querySelector('.appliance-list');
    const template = document.createElement('div');
    template.innerHTML = `
        <div class="appliance-item">
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
        </div>
    `;

    const newRow = template.firstElementChild;
    applianceList.appendChild(newRow);

    // Add event listeners to the new row
    const calculator = window.calculator;
    newRow.querySelector('.appliance-select').addEventListener('change', () => 
        calculator.updateAppliancePower(newRow)
    );

    newRow.querySelectorAll('.quantity-btn, .hours-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const valueSpan = e.target.parentElement.querySelector(
                e.target.classList.contains('quantity-btn') ? '.quantity-value' : '.hours-value'
            );
            const currentValue = parseInt(valueSpan.textContent);
            if (e.target.dataset.action === 'increase') {
                valueSpan.textContent = Math.min(24, currentValue + 1);
            } else {
                valueSpan.textContent = Math.max(1, currentValue - 1);
            }
            calculator.updateAppliancePower(newRow);
        });
    });

    newRow.querySelector('.backup-toggle').addEventListener('click', (e) => 
        calculator.handleBackupToggle(e.target)
    );

    newRow.querySelector('.delete-appliance').addEventListener('click', () => {
        newRow.remove();
        calculator.updateTotalPower();
    });
}