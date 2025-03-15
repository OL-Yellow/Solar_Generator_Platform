class FormValidator {
    constructor() {
        this.initializeValidation();
    }

    initializeValidation() {
        const forms = document.querySelectorAll('.needs-validation');
        
        forms.forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            });
        });

        this.setupPhoneValidation();
        this.setupEmailValidation();
    }

    setupPhoneValidation() {
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const phone = e.target.value.replace(/\D/g, '');
                if (phone.length < 11) {
                    input.setCustomValidity('Please enter a valid Nigerian phone number');
                } else {
                    input.setCustomValidity('');
                }
            });
        });
    }

    setupEmailValidation() {
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const email = e.target.value;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    input.setCustomValidity('Please enter a valid email address');
                } else {
                    input.setCustomValidity('');
                }
            });
        });
    }
}

// Initialize form validation
const formValidator = new FormValidator();
