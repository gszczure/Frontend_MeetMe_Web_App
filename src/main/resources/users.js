const logoutButton = document.querySelector('.logout-button');
const backButton = document.querySelector('.back-button');
const leaveMeetingButton = document.querySelector('.leave-button');
const titleElement = document.querySelector('.meeting-title');
const themeToggle = document.querySelector('.theme-toggle');

document.addEventListener('DOMContentLoaded', async () => {
    const meetingId = localStorage.getItem('currentMeetingId');
    const meetingTitle = localStorage.getItem('currentMeetingTitle');
    const meetingOwnerId = localStorage.getItem('meetingOwnerId');
    const currentUserId = localStorage.getItem('userId');

    if (meetingId && meetingTitle && meetingOwnerId && currentUserId) {
        titleElement.textContent = `Users for meeting: "${meetingTitle}"`;

        //TODO ta metoda bedzie gdy wlasciceil bedzie usuwac ludzi zeby ludzie sie odswiezyli a nei zeby go wychodzilo na scene poprzednia
        loadUsersForMeeting(meetingId);

        // Sprawdzenie, czy użytkownik jest właścicielem spotkania (jeśli jest to nie widzi guzika leaveMeeting)
        if (meetingOwnerId === currentUserId) {
            if (leaveMeetingButton) {
                leaveMeetingButton.style.display = 'none';
            }
        }
    } else {
        alert('Meeting ID, title, or owner information not found.');
    }
});

// Funkcja do ładowania i wyświetlania użytkowników
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
        alert('An error occurred while loading meetings.');
    }
}

// Funkcja do wyświetlania użytkowników
function displayUsers(users) {
    const usersList = document.querySelector('.users-list');
    usersList.innerHTML = '';

    users.forEach((user) => {
        const userItem = document.createElement('li');
        userItem.classList.add('user-item');

        // Imię i nazwisko użytkownika
        const userName = document.createElement('span');
        userName.textContent = `${user.firstName} ${user.lastName}`;
        userName.classList.add('user-name');

        // Przycisk Delete
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-button');

        userItem.appendChild(userName);
        userItem.appendChild(deleteButton);
        usersList.appendChild(userItem);
    });
}

async function handleLeaveMeetingButtonClick(meetingId) {
    const confirmation = confirm(
        "Are you sure you want to leave this meeting?\nYou will no longer be a participant."
    );

    if (!confirmation) {
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to leave a meeting.");
        return;
    }

    try {
        // Wysłanie żądania DELETE do API
        const response = await fetch(`http://localhost:8080/api/meetings/${meetingId}/leave`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            alert("Successfully left the meeting.");
            window.location.href = 'main.html';
        } else {
            const errorMessage = `Failed to leave meeting. Server responded with code ${response.status}`;
            console.error(errorMessage);
            alert(errorMessage);
        }
    } catch (error) {
        console.error("An error occurred while leaving the meeting:", error);
        alert("An error occurred while leaving the meeting.");
    }
}


// Obsługa przycisków
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

backButton.addEventListener('click', () => {
    window.location.href = 'main.html';
});

leaveMeetingButton.addEventListener('click', () => {
    const meetingId = localStorage.getItem('currentMeetingId');

    if (!meetingId) {
        alert("Meeting ID not found. Please try again.");
        return;
    }

    handleLeaveMeetingButtonClick(meetingId);
});

// Guzik zmiany theme
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        themeToggle.textContent = body.classList.contains('dark-theme') ? '☀️' : '🌙';
    });
});

