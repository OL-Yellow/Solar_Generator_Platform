class ChartManager {
    constructor() {
        Chart.defaults.color = '#ffffff';
        Chart.defaults.borderColor = '#30363d';
    }

    static initializeChartDefaults() {
        // Global chart configuration
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
        
        // Set default font family and size
        Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";
        Chart.defaults.font.size = 12;
    }

    static createBaseOptions() {
        return {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#ffffff'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#30363d',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#30363d'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                },
                y: {
                    grid: {
                        color: '#30363d'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                }
            }
        };
    }
}

// Initialize chart defaults
ChartManager.initializeChartDefaults();
