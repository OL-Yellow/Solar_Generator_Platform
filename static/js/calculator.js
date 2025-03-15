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
        document.addEventListener('DOMContentLoaded', () => {
            this.updateProgress();
            this.setupStepNavigation();
            this.setupCalculationTriggers();
        });
    }

    setupStepNavigation() {
        const nextButtons = document.querySelectorAll('.btn-next');
        const prevButtons = document.querySelectorAll('.btn-prev');

        nextButtons.forEach(button => {
            button.addEventListener('click', () => this.nextStep());
        });

        prevButtons.forEach(button => {
            button.addEventListener('click', () => this.previousStep());
        });
    }

    setupCalculationTriggers() {
        const calculateButton = document.getElementById('calculate-btn');
        if (calculateButton) {
            calculateButton.addEventListener('click', () => this.calculateResults());
        }

        // Update appliance calculations on change
        const applianceInputs = document.querySelectorAll('.appliance-input');
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
            this.hideStep(this.currentStep);
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateProgress();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.hideStep(this.currentStep);
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
        }
    }

    hideStep(step) {
        document.querySelector(`#step${step}`).classList.add('d-none');
    }

    showStep(step) {
        document.querySelector(`#step${step}`).classList.remove('d-none');
    }

    validateCurrentStep() {
        // Add validation logic for each step
        const step = document.querySelector(`#step${this.currentStep}`);
        const requiredFields = step.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach(field => {
            if (!field.value) {
                valid = false;
                field.classList.add('is-invalid');
            } else {
                field.classList.remove('is-invalid');
            }
        });

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
        const location = document.getElementById('location').value;
        const sunHours = parseFloat(document.getElementById('sun-hours').value);
        const dailyEnergy = parseFloat(document.getElementById('total-daily-power').textContent);
        const backupDays = parseFloat(document.getElementById('backup-days').value) || 1;
        const generatorFuel = parseFloat(document.getElementById('generator-fuel').value) || 0;
        const generatorMaintenance = parseFloat(document.getElementById('generator-maintenance').value) || 0;

        // Calculate system requirements
        const panelCapacity = (dailyEnergy * 1.3) / sunHours;
        const batteryCapacity = dailyEnergy * 1.5 * backupDays;

        // Calculate costs
        const panelCost = panelCapacity * PANEL_COST_PER_KW;
        const batteryCost = batteryCapacity * BATTERY_COST_PER_KWH;
        const installationCost = (panelCost + batteryCost) * INSTALLATION_COST_PERCENTAGE;
        const totalSystemCost = panelCost + batteryCost + installationCost;

        // Calculate savings
        const monthlyFuelCost = generatorFuel * DIESEL_PRICE_PER_LITER;
        const monthlyMaintenance = generatorMaintenance / 12;
        const currentMonthlyCost = monthlyFuelCost + monthlyMaintenance;
        const monthlySavings = currentMonthlyCost - (totalSystemCost / 120); // Assuming 10-year lifespan
        const paybackPeriod = totalSystemCost / monthlySavings;

        // Update results
        this.displayResults({
            systemSize: panelCapacity.toFixed(2),
            batterySize: batteryCapacity.toFixed(2),
            totalCost: totalSystemCost.toFixed(2),
            monthlySavings: monthlySavings.toFixed(2),
            paybackPeriod: paybackPeriod.toFixed(1),
            currentCost: currentMonthlyCost.toFixed(2)
        });

        // Show results section
        document.getElementById('results-section').classList.remove('d-none');
        
        // Create ROI chart
        this.createROIChart(totalSystemCost, monthlySavings);
    }

    displayResults(results) {
        document.getElementById('system-size').textContent = results.systemSize;
        document.getElementById('battery-size').textContent = results.batterySize;
        document.getElementById('total-cost').textContent = results.totalCost;
        document.getElementById('monthly-savings').textContent = results.monthlySavings;
        document.getElementById('payback-period').textContent = results.paybackPeriod;
        document.getElementById('current-cost').textContent = results.currentCost;

        // Update hidden fields for lead form
        document.getElementById('lead-system-size').value = results.systemSize;
        document.getElementById('lead-estimated-savings').value = results.monthlySavings;
    }

    createROIChart(totalCost, monthlySavings) {
        const ctx = document.getElementById('roi-chart').getContext('2d');
        const months = Array.from({length: 121}, (_, i) => i);
        const savings = months.map(month => month * monthlySavings);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Cumulative Savings',
                    data: savings,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }, {
                    label: 'System Cost',
                    data: Array(121).fill(totalCost),
                    borderColor: 'rgb(255, 99, 132)',
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Return on Investment Over Time'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Months'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'NGN'
                        }
                    }
                }
            }
        });
    }
}

// Initialize calculator
const calculator = new SolarCalculator();
