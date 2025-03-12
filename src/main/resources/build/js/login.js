// let url = "http://localhost:8080";
let url = "https://backendmeetingapp-1.onrender.com"

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
                    `${url}/api/auth/login`,
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
                    window.location.href = 'index.html';
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

            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const email = document.getElementById('email').value;
            const phoneNumber = document.getElementById('phoneNumber').value;

            // Walidacja po stronie frontendu
            if (firstName === '' || lastName === '') {
                document.getElementById('message').textContent = 'First and last name are required!';
                return;
            }
            if (username.length < 3 || username.length > 20 || /\s/.test(username)) {
                document.getElementById('message').textContent = 'Username must be 3-20 characters long and cannot contain spaces!';
                return;
            }
            if (password.length < 6) {
                document.getElementById('message').textContent = 'Password must be at least 6 characters long!';
                return;
            }
            if (password !== confirmPassword) {
                document.getElementById('message').textContent = 'Passwords do not match!';
                return;
            }
            const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
            if (!emailRegex.test(email)) {
                document.getElementById('message').textContent = 'Invalid email format!';
                return;
            }
            const phoneRegex = /^\d{9}$/;
            if (!phoneRegex.test(phoneNumber)) {
                document.getElementById('message').textContent = 'Phone number must consist of exactly 9 digits!';
                return;
            }

            try {
                const response = await fetch(
                    `${url}/api/auth/register`,
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
                    window.location.href = '../html/login.html';
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
