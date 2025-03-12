const meetingContainer = document.querySelector('#meeting-container');
const createMeetingButton = document.querySelector('.create-meeting-button');
// let url = "http://localhost:8080";
let url = "https://backendmeetingapp-1.onrender.com"


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
        const response = await fetch(`${url}/api/meetings/${meetingId}`, {
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
        // window.location.href = "date-chose.html";
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
                          I encourage you to <a href="https://meetme-web-q5ol.onrender.com/index.html">Log in</a>!`;
        meetingContainer.appendChild(loginMessage);
        return;
    }
    try {
        const response = await fetch(`${url}/api/meetings/for-user`, {
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
                emptyState.textContent = "You don't have any meetings yet. Create a new meeting to get started."
                meetingContainer.appendChild(emptyState)
            } else {
                meetings.forEach((meeting) => addMeetingToUI(meeting))
            }
        } else {
            showAlert("Failed to load meetings.")
        }
    } catch (error) {
        console.error("Error:", error);
        showAlert("An error occurred while loading the meetings.");
    }
}

createMeetingButton.addEventListener('click', () => {
    window.location.href = 'create-meeting.html';
});

// Załaduj spotkania po załadowaniu strony
loadMeetings();