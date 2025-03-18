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
            document.getElementById(`step${this.currentStep}`).classList.add('d-none');
            this.currentStep++;
            document.getElementById(`step${this.currentStep}`).classList.remove('d-none');
            this.updateProgress();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            document.getElementById(`step${this.currentStep}`).classList.add('d-none');
            this.currentStep--;
            document.getElementById(`step${this.currentStep}`).classList.remove('d-none');
            this.updateProgress();
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
            const userData = {
                location: document.getElementById('location')?.value || '',
                user_type: document.getElementById('user-type')?.value || '',
                grid_hours: document.getElementById('grid-hours')?.value || '',
                monthly_fuel_cost: document.getElementById('generator-fuel')?.value || '',
                daily_energy: document.getElementById('backup-daily-power')?.textContent || '',
                maintenance_cost: document.getElementById('generator-maintenance')?.value || ''
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
                // Navigate to results step
                document.getElementById(`step${this.currentStep}`).classList.add('d-none');
                this.currentStep = 4; // Set to results step
                document.getElementById('step4').classList.remove('d-none');
                document.getElementById('results-section').innerHTML = data.recommendations;
                this.updateProgress();
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
    window.calculator = new SolarCalculator();
    
    // Handle dual-use option visibility
    const userTypeSelect = document.getElementById('user-type');
    const dualUseDiv = document.querySelector('.dual-use-option');
    
    userTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'dual') {
            dualUseDiv.classList.remove('d-none');
        } else {
            dualUseDiv.classList.add('d-none');
        }
    });
});

// Function to add event listeners to appliance rows
function initializeApplianceRow(applianceRow) {
    const calculator = window.calculator;

    applianceRow.querySelector('.appliance-select').addEventListener('change', () =>
        calculator.updateAppliancePower(applianceRow)
    );

    applianceRow.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = applianceRow.querySelector('.quantity-value');
            if (btn.dataset.action === 'increase') {
                value.textContent = parseInt(value.textContent) + 1;
            } else {
                value.textContent = Math.max(1, parseInt(value.textContent) - 1);
            }
            calculator.updateAppliancePower(applianceRow);
        });
    });

    applianceRow.querySelectorAll('.hours-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = applianceRow.querySelector('.hours-value');
            if (btn.dataset.action === 'increase') {
                value.textContent = Math.min(24, parseInt(value.textContent) + 1);
            } else {
                value.textContent = Math.max(1, parseInt(value.textContent) - 1);
            }
            calculator.updateAppliancePower(applianceRow);
        });
    });

    applianceRow.querySelector('.backup-toggle').addEventListener('click', (e) => {
        calculator.handleBackupToggle(e.target);
        calculator.updateAppliancePower(applianceRow);
    });

    applianceRow.querySelector('.delete-appliance').addEventListener('click', () => {
        applianceRow.remove();
        calculator.updateTotalPower();
    });

    calculator.updateAppliancePower(applianceRow);
}

function addApplianceRow() {
    const calculator = window.calculator;
    if (!calculator) {
        console.error('Calculator not initialized');
        return;
    }

    const applianceList = document.querySelector('.appliance-list');
    const addButton = applianceList.querySelector('button[onclick="addApplianceRow()"]');
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
                            <label class="text-muted mb-1">Number of Units</label>
                            <div class="btn-group">
                                <button type="button" class="btn btn-sm btn-outline-secondary quantity-btn" data-action="decrease">-</button>
                                <span class="quantity-value mx-2">1</span>
                                <button type="button" class="btn btn-sm btn-outline-secondary quantity-btn" data-action="increase">+</button>
                            </div>
                        </div>
                        <div class="d-flex flex-column align-items-center">
                            <label class="text-muted mb-1">Hours / Day</label>
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

// Initialize existing appliance rows
document.querySelectorAll('.appliance-item').forEach(initializeApplianceRow);