const meetingContainer = document.querySelector('#meeting-container');
const joinButton = document.querySelector('.join-button');
const meetingCodeInput = document.querySelector('#join-code');
const createMeetingButton = document.querySelector('.create-meeting-button');

// Funkcja do sprawdzania, czy użytkownik jest właścicielem spotkania
function isOwner(ownerId) {
    const currentUserId = localStorage.getItem('userId');
    return currentUserId !== null && currentUserId === ownerId.toString();
}

async function deleteMeeting(meetingId, event) {
    event.stopPropagation();

    const confirmed = confirm("Are you sure you want to delete this meeting?");
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to delete a meeting.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/meetings/${meetingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            loadMeetings();
        } else {
            alert('Failed to delete meeting.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while deleting the meeting.');
    }
}

// Funkcja dodawania spotkania do UI
function addMeetingToUI(meeting) {
    const meetingCard = document.createElement('div');
    meetingCard.classList.add('meeting-card');

    const nameDiv = document.createElement('div');
    nameDiv.classList.add('meeting-name');
    nameDiv.textContent = meeting.name;

    meetingCard.appendChild(nameDiv);

    if (isOwner(meeting.owner.id)) {
        const codeDiv = document.createElement('div');
        codeDiv.classList.add('meeting-code');
        codeDiv.textContent = `Code: ${meeting.code}`;
        meetingCard.appendChild(codeDiv);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-meeting');
        deleteButton.innerHTML = '×';
        deleteButton.addEventListener('click', (e) => deleteMeeting(meeting.id, e));
        meetingCard.appendChild(deleteButton);
    }

    meetingCard.addEventListener('click', () => {
        localStorage.setItem('currentMeetingId', meeting.id);
        localStorage.setItem('currentMeetingName', meeting.name);
        window.location.href = 'date-chose.html';
    });

    meetingContainer.appendChild(meetingCard);
}

// Funkcja do ładowania spotkań
async function loadMeetings() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to load meetings.");
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/meetings/for-user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const meetings = await response.json();
            meetings.sort((a, b) => a.name.localeCompare(b.name));
            meetingContainer.innerHTML = '';
            meetings.forEach(meeting => addMeetingToUI(meeting));
        } else {
            alert('Failed to load meetings.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while loading meetings.');
    }
}

// Funkcja do dołączania do spotkania
async function handleJoinButtonAction() {
    const meetingCode = meetingCodeInput.value.trim();
    if (!meetingCode) {
        alert("Meeting code cannot be empty.");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to join a meeting.");
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/meetings/join', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: meetingCode })
        });

        if (response.ok) {
            alert("Successfully joined the meeting.");
            meetingCodeInput.value = '';
            loadMeetings();
        } else if (response.status === 409) {
            alert("You already belong to this meeting.");
        } else {
            alert("Invalid meeting code.");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while joining the meeting.");
    }
}

createMeetingButton.addEventListener('click', () => {
    window.location.href = 'create-meeting.html';
});

joinButton.addEventListener('click', handleJoinButtonAction);

const logoutButton = document.querySelector('.logout-button');
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// Załaduj spotkania po załadowaniu strony
loadMeetings();