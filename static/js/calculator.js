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
        document.getElementById('calculate-btn').disabled = true;
        document.getElementById('calculate-btn').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Getting Recommendations...';

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
                // Parse and display the AI recommendations
                const recommendations = data.recommendations;

                // Update results section with AI recommendations
                document.getElementById('results-section').innerHTML = `
                    <div class="results-card">
                        <h3 class="mb-4">AI-Powered Solar Solution Recommendations</h3>
                        <div class="recommendation-text">
                            ${recommendations}
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
            document.getElementById('calculate-btn').disabled = false;
            document.getElementById('calculate-btn').innerHTML = 'Calculate Results';
        });
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