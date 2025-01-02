const logoutButton = document.querySelector('.logout-button');
const backButton = document.querySelector('.back-button');
const leaveMeetingButton = document.querySelector('.leave-button');
const titleElement = document.querySelector('.meeting-title');
const usersList = document.querySelector('.users-list');

const meetingId = localStorage.getItem('currentMeetingId');
const meetingTitle = localStorage.getItem('currentMeetingTitle');
const meetingOwnerId = localStorage.getItem('meetingOwnerId');
const currentUserId = localStorage.getItem('userId');

//TODO usunqac to ze najpierw musi sie zaladowac bo i tak w html mam defer czyli najpierw beda sie ladowac
document.addEventListener('DOMContentLoaded', async () => {
    if (meetingId && meetingTitle && meetingOwnerId && currentUserId) {
        titleElement.textContent = `Users for meeting: "${meetingTitle}"`;

        loadUsersForMeeting(meetingId);

        // Sprawdzenie, czy użytkownik jest właścicielem spotkania (jeśli jest, to nie widzi guzika leaveMeeting)
        if (meetingOwnerId === currentUserId) {
            if (leaveMeetingButton) {
                leaveMeetingButton.style.display = 'none';
            }
        }
    } else {
        alert('Meeting ID, title, or owner information not found.');
    }
});

// Funkcja do wyświetlania użytkowników
function displayUsers(users) {
    usersList.innerHTML = '';

    users.forEach((user) => {
        const userItem = document.createElement('li');
        userItem.classList.add('user-item');

        // Imię i nazwisko użytkownika
        const userName = document.createElement('span');
        userName.textContent = `${user.firstName} ${user.lastName}`;
        userName.classList.add('user-name');

        // Zamiana na number poniewaz w localstorage wartości przechowywane sa jako stringi
        const ownerId = Number(meetingOwnerId);
        const currentUserIdNumber = Number(currentUserId);

        if (ownerId === currentUserIdNumber && user.id !== ownerId) {
            // Przycisk Delete
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');

            // Pobieramy obecny meetingId w którym sie znajdujemy
            const meetingId = localStorage.getItem('currentMeetingId');


            deleteButton.addEventListener('click', () => {
                // Wywołanie metody do usunięcia użytkownika z meetingu
                deleteUsersFromMeeting(meetingId, user.username);
            });

            userItem.appendChild(deleteButton);
        }

        userItem.appendChild(userName);
        usersList.appendChild(userItem);
    });
}

// Funkcja do ładowania i wyświetlania użytkowników
async function loadUsersForMeeting(meetingId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in.");
        return;
    }

    try {
        const response = await fetch(
            `https://backendmeetingapp-1.onrender.com/api/meetings/${meetingId}/participants`,
            {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            const users = data.participants;
            localStorage.setItem('participants', JSON.stringify(users)); // Zapisujemy uzytkowniów by potem do funkcji usuwającej ludzi ze spotkania przesłać username
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

async function deleteUsersFromMeeting(meetingId, username) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in.");
        return;
    }

    if (!meetingId) {
        alert("Meeting ID not found.");
        return;
    }

    try {
        const response = await fetch(
            `https://backendmeetingapp-1.onrender.com/api/meetings/${meetingId}/participants/${username}`,
            {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            alert('User deleted successfully');
            loadUsersForMeeting(meetingId);
        } else if (response.status === 403) {
            alert('You are not authorized to remove this participant.');
        } else {
            const errorMessage = `Failed to delete user. Server responded with code ${response.status}`;
            console.error(errorMessage);
            alert(errorMessage);
        }
    } catch (error) {
        console.error("An error occurred while removing user:", error);
        alert("An error occurred while removing user.");
    }
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
        const response = await fetch(
            `https://backendmeetingapp-1.onrender.com/api/meetings/${meetingId}/leave`,
            {
            method: 'DELETE',
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

