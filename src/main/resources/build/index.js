const meetingContainer = document.querySelector('#meeting-container');
const createMeetingButton = document.querySelector('.create-meeting-button');

//TODO dodac isprocessing jak w data-chose.js by blokowac klikanie drugi raz guziak usuwania

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
        showAlert("You must be logged in to delete a meeting.");
        return;
    }

    try {
        const response = await fetch(`https://backendmeetingapp-1.onrender.com/api/meetings/${meetingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            loadMeetings();
        } else {
            showAlert('Failed to delete meeting.');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('An error occurred while deleting the meeting.');
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
        // TODO &times zrobic zamiast x
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-meeting');
        deleteButton.innerHTML = '×';
        deleteButton.addEventListener('click', (e) => deleteMeeting(meeting.id, e));
        meetingCard.appendChild(deleteButton);
    }

    meetingCard.addEventListener('click', () => {
        window.location.href = `https://backendmeetingapp-1.onrender.com/api/meetings/join/${meeting.code}`;
    });

    meetingContainer.appendChild(meetingCard);
}

// Funkcja do ładowania spotkań
async function loadMeetings() {
    const token = localStorage.getItem("token")

    if (!token) {
        const loginMessage = document.createElement("div");
        loginMessage.classList.add("empty-state");
        loginMessage.innerHTML = `The list of meetings is available only for logged-in users. <br> 
                          I encourage you to <a href="register.html">Sign up</a>!`;
        meetingContainer.appendChild(loginMessage);
        return;
    }
    try {
        const response = await fetch("https://backendmeetingapp-1.onrender.com/api/meetings/for-user", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })

        if (response.ok) {
            const meetings = await response.json()
            meetings.sort((a, b) => a.name.localeCompare(b.name))

            meetingContainer.innerHTML = ""

            if (meetings.length === 0) {
                const emptyState = document.createElement("div")
                emptyState.classList.add("empty-state")
                emptyState.textContent = "Nie masz jeszcze żadnych spotkań. Utwórz nowe spotkanie, aby rozpocząć."
                meetingContainer.appendChild(emptyState)
            } else {
                meetings.forEach((meeting) => addMeetingToUI(meeting))
            }
        } else {
            showAlert("Nie udało się załadować spotkań.")
        }
    } catch (error) {
        console.error("Error:", error);
        showAlert("Wystąpił błąd podczas ładowania spotkań.");
    }
}

createMeetingButton.addEventListener('click', () => {
    window.location.href = 'create-meeting.html';
});

const logoutButton = document.querySelector('.logout-button');
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// Załaduj spotkania po załadowaniu strony
loadMeetings();