// Constants for calculations
const PANEL_COST_PER_KW = 350000;  // NGN per kW
const BATTERY_COST_PER_KWH = 150000;  // NGN per kWh
const INVERTER_BASE_COST = 150000;  // Base cost for small inverter
const INSTALLATION_COST_PERCENTAGE = 0.15;
const DIESEL_PRICE_PER_LITER = 650; // NGN

// Common appliances in Nigeria with typical wattage and usage profiles
const APPLIANCES = {
    'LED Lights (4-6 bulbs)': {
        watts: 40,
        profile: 'critical',
        typical_hours: 6
    },
    'Ceiling Fan': {
        watts: 75,
        profile: 'important',
        typical_hours: 6
    },
    'Standing Fan': {
        watts: 60,
        profile: 'important',
        typical_hours: 6
    },
    'TV (32-inch LED)': {
        watts: 50,
        profile: 'important',
        typical_hours: 4
    },
    'Small Refrigerator': {
        watts: 150,
        profile: 'critical',
        typical_hours: 8
    },
    'Phone & Laptop Charging': {
        watts: 70,
        profile: 'critical',
        typical_hours: 4
    },
    'Security Lights': {
        watts: 30,
        profile: 'critical',
        typical_hours: 12
    }
};

// Usage profiles with descriptions
const USAGE_PROFILES = {
    critical: {
        description: 'Essential items needed during power outages (e.g. lights, security, refrigeration)',
        multiplier: 1.0  // Full backup time
    },
    important: {
        description: 'Comfort items used occasionally during outages (e.g. fans, TV)',
        multiplier: 0.5  // Half of backup time
    },
    optional: {
        description: 'Non-essential items (use when excess power available)',
        multiplier: 0.25 // Quarter of backup time
    }
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


        document.querySelectorAll('.backup-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleBackupToggle(e.target));
        });

        // Initialize the appliance rows
        document.querySelectorAll('.appliance-item').forEach(item => {
            initializeApplianceRow(item);
        });
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            const currentStepElement = document.getElementById(`step${this.currentStep}`);
            if (currentStepElement) {
                currentStepElement.classList.add('d-none');
            }

            this.currentStep++;

            const nextStepElement = document.getElementById(`step${this.currentStep}`);
            if (nextStepElement) {
                nextStepElement.classList.remove('d-none');
            }

            this.updateProgress();
            console.log(`Moving to step ${this.currentStep}`);
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
        const appliance = APPLIANCES[select.value];
        const quantity = parseInt(item.querySelector('.quantity-value').textContent) || 1;

        if (!appliance) return;

        const watts = appliance.watts;
        const profile = appliance.profile;
        const typical_hours = appliance.typical_hours;

        const kwh = (watts * quantity * typical_hours) / 1000;

        item.querySelector('.watts-value').textContent = watts;
        item.querySelector('.daily-kwh').textContent = kwh.toFixed(2);
        item.querySelector('.usage-profile').textContent = profile.charAt(0).toUpperCase() + profile.slice(1);
        item.querySelector('.typical-hours').textContent = typical_hours;

        this.updateTotalPower();
    }

    updateTotalPower() {
        let totalPower = 0;
        let criticalPower = 0;
        let importantPower = 0;

        document.querySelectorAll('.appliance-item').forEach(item => {
            const select = item.querySelector('.appliance-select');
            const appliance = APPLIANCES[select.value];
            if (!appliance) return;

            const quantity = parseInt(item.querySelector('.quantity-value').textContent) || 1;
            const watts = appliance.watts;
            const profile = appliance.profile;
            const typical_hours = appliance.typical_hours;
            const kwh = (watts * quantity * typical_hours) / 1000;

            totalPower += kwh;

            if (profile === 'critical') {
                criticalPower += kwh;
            } else if (profile === 'important') {
                importantPower += kwh;
            }
        });

        document.getElementById('total-daily-power').textContent = totalPower.toFixed(2);
        document.getElementById('critical-power').textContent = criticalPower.toFixed(2);
        document.getElementById('important-power').textContent = importantPower.toFixed(2);

        // Calculate backup power needs
        const backupPower = criticalPower + (importantPower * 0.5);
        document.getElementById('backup-daily-power').textContent = backupPower.toFixed(2);

        // Update the quick cost estimate based on backup power
        updateQuickEstimate(backupPower);
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

// Constants for quick estimation
// Removed duplicate APPLIANCES constant

// Constants for quick system cost estimation
const PANEL_COST_PER_KW_2 = 350000;  // Naira per kW
const BATTERY_COST_PER_KWH_2 = 150000;  // Naira per kWh
const INVERTER_BASE_COST_2 = 150000;  // Base cost for small inverter

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new SolarCalculator();

    // Display initial cost estimate
    updateQuickEstimate();
});

// Function to update the quick cost estimate
function updateQuickEstimate(dailyBackupEnergy) {
    const quickEstimateElement = document.getElementById('quick-cost-estimate');
    if (!quickEstimateElement) return;

    // Quick estimate of system size (kW) based on backup power
    const systemSizeKW = Math.max(1, dailyBackupEnergy / 5);

    // Quick estimate of battery size (kWh)
    const batterySizeKWH = Math.max(2, dailyBackupEnergy * 0.7);

    // Calculate estimated costs
    const panelCost = systemSizeKW * PANEL_COST_PER_KW_2;
    const batteryCost = batterySizeKWH * BATTERY_COST_PER_KWH_2;
    const inverterCost = INVERTER_BASE_COST_2 + (systemSizeKW * 20000);

    // Total system cost
    const totalCost = panelCost + batteryCost + inverterCost;

    quickEstimateElement.innerHTML = `
        <div class="estimate-item">
            <span class="estimate-label">Estimated System Size:</span>
            <span class="estimate-value">${systemSizeKW.toFixed(1)} kW</span>
        </div>
        <div class="estimate-item">
            <span class="estimate-label">Estimated Cost:</span>
            <span class="estimate-value">₦${totalCost.toLocaleString('en-NG')}</span>
        </div>
    `;
}

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

// When adding a new appliance row, use this template
function addApplianceRow() {
    const applianceList = document.querySelector('.appliance-list');
    const addButton = applianceList.querySelector('button[onclick="addApplianceRow()"]');
    const template = document.createElement('div');

    template.innerHTML = `
        <div class="appliance-item">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <select class="form-select appliance-select mb-3" required>
                    <option value="">Select Appliance</option>
                    ${Object.entries(APPLIANCES).map(([name, data]) =>
                        `<option value="${name}">${name} (${data.watts}W)</option>`
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
                            <label class="text-muted mb-1">Usage Profile:</label>
                            <span class="usage-profile">-</span>
                        </div>
                        <div class="d-flex flex-column align-items-center">
                            <label class="text-muted mb-1">Typical Hours:</label>
                            <span class="typical-hours">-</span>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="power-stats">
                        <div class="power-stat">
                            <span class="stat-label">Power Rating:</span>
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
    `;

    const newRow = template.firstElementChild;
    applianceList.insertBefore(newRow, addButton);

    // Initialize with direct calculator reference
    const deleteBtn = newRow.querySelector('.delete-appliance');
    deleteBtn.addEventListener('click', () => {
        newRow.remove();
        window.calculator.updateTotalPower();
    });

    // Initialize other controls
    initializeApplianceRow(newRow);
}

// Initialize existing appliance rows
document.querySelectorAll('.appliance-item').forEach(initializeApplianceRow);