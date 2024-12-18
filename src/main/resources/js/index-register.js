document.addEventListener('DOMContentLoaded', () => {
    // Logowanie
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(
                    'http://localhost:8080/api/auth/login',
                    {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userId', data.userId);
                    window.location.href = 'main.html';
                } else {
                    document.getElementById('message').textContent = 'Incorrect username or password!';
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('message').textContent = 'An error occurred. Try again later.';
            }
        });
    }

    // Rejestracja
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            //TODO dodac validacje
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const email = document.getElementById('email').value;
            const phoneNumber = document.getElementById('phoneNumber').value;

            if (password !== confirmPassword) {
                document.getElementById('message').textContent = 'Passwords do not match!';
                return;
            }

            try {
                const response = await fetch(
                    'http://localhost:8080/api/auth/register',
                    {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        username,
                        password,
                        email,
                        phoneNumber
                    }),
                });

                if (response.ok) {
                    window.location.href = 'index.html';
                } else {
                    document.getElementById('message').textContent = 'Registration failed.';
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('message').textContent = 'An error occurred. Try again later.';
            }
        });
    }
});
