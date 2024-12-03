const logoutButton = document.querySelector('.logout-button');

document.addEventListener('DOMContentLoaded', () => {
    const meetingId = localStorage.getItem('currentMeetingId');
    const meetingTitle = localStorage.getItem('currentMeetingTitle');


    if (meetingId && meetingTitle) {
        const mainContent = document.getElementById('main-content');

        const titleElement = document.createElement('h2');
        titleElement.textContent = `Users for meeting: "${meetingTitle}"`;
        titleElement.classList.add('meeting-title');
        mainContent.appendChild(titleElement);

        // Ładowanie uczestników spotkania
        loadUsersForMeeting(meetingId);
    } else {
        alert('Meeting ID or title not found.');
    }
});

async function loadUsersForMeeting(meetingId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/meetings/${meetingId}/participants`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            const users = data.participants;
            displayUsers(users);
        } else {
            console.error('Failed to load users:', response.status);
            alert('Failed to load users.');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Funkcja do wyświetlania użytkowników na stronie z numeracją
function displayUsers(users) {
    const mainContent = document.getElementById('main-content');

    // Tworzymy kontener na listę użytkowników
    const usersList = document.createElement('ol');
    usersList.classList.add('users-list');

    users.forEach((user) => {
        const userItem = document.createElement('li');
        userItem.classList.add('user-item');
        userItem.textContent = `${user.firstName} ${user.lastName}`;
        usersList.appendChild(userItem);
    });

    // Dodajemy listę użytkowników do głównej sekcji
    mainContent.appendChild(usersList);
}

// Funkcja wylogowania
function logoutUser() {

    localStorage.clear();
    window.location.href = 'index.html';
}

logoutButton.addEventListener('click', logoutUser);

