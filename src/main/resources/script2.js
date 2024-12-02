// Pobieranie referencji do elementów
const saveButton = document.querySelector('.save-button');
const meetingNameInput = document.querySelector('#meeting-name');
const meetingContainer = document.querySelector('#meeting-container');
const joinButton = document.querySelector('.join-button');
const meetingCodeInput = document.querySelector('#join-code');

let currentlyOpenDetails = null; // Globalna zmienna przechowująca otwarte spotkania

// Funkcja do sprawdzania, czy użytkownik jest właścicielem spotkania
function isOwner(ownerId) {
    const currentUserId = localStorage.getItem('userId');
    return currentUserId !== null && currentUserId === ownerId.toString();
}

// Funkcja do dodania spotkania do interfejsu użytkownika
function addMeetingToUI(meeting) {
    const meetingDiv = document.createElement('div');
    meetingDiv.classList.add('meeting');

    const titleDiv = document.createElement('div');
    titleDiv.classList.add('meeting-title-container');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = meeting.name;
    nameSpan.classList.add('meeting-name');

    titleDiv.appendChild(nameSpan);

    // Dodaj kod spotkania w nagłówku tylko dla właściciela
    if (isOwner(meeting.owner.id)) {
        const codeSpan = document.createElement('span');
        codeSpan.textContent = `Code: ${meeting.code}`;
        codeSpan.classList.add('meeting-code');
        titleDiv.appendChild(codeSpan);
    }

    const detailsDiv = document.createElement('div');
    detailsDiv.classList.add('meeting-details');

    // Kontener na trzy przyciski
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('details-button-container');

    ['Users', 'Date', 'Common Date'].forEach(detail => {
        const button = document.createElement('button');
        button.classList.add('details-button');
        button.textContent = detail;
        buttonContainer.appendChild(button);
    });

    detailsDiv.appendChild(buttonContainer);

    // Dodaj przycisk usuwania dla właściciela
    if (isOwner(meeting.owner.id)) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Meeting';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', async () => {
            const confirmed = confirm("Are you sure you want to delete this meeting?");
            if (confirmed) {
                await deleteMeeting(meeting.id);
                meetingDiv.remove();
            }
        });
        detailsDiv.appendChild(deleteButton);
    }

    // Obsługa kliknięcia na tytuł spotkania
    titleDiv.addEventListener('click', () => {
        // Jeśli coś jest otwarte, zamknij je
        if (currentlyOpenDetails && currentlyOpenDetails !== detailsDiv) {
            currentlyOpenDetails.style.display = 'none';
        }

        // Przełącz widoczność aktualnego
        const isCurrentlyOpen = detailsDiv.style.display === 'flex';
        detailsDiv.style.display = isCurrentlyOpen ? 'none' : 'flex';

        // Zaktualizuj referencję do aktualnie otwartych szczegółów
        currentlyOpenDetails = isCurrentlyOpen ? null : detailsDiv;
    });

    meetingDiv.appendChild(titleDiv);
    meetingDiv.appendChild(detailsDiv);
    meetingContainer.appendChild(meetingDiv);
}

// Funkcja do tworzenia nowego spotkania
async function createMeeting(name) {
    if (!name) {
        alert("Meeting name cannot be empty!");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to create a meeting.");
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/meetings/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            const data = await response.json();
            // Po pomyślnym utworzeniu spotkania dodajemy je do listy w interfejsie
            addMeetingToUI(data);
            meetingNameInput.value = '';
        } else {
            console.error('Failed to create meeting:', response.statusText);
            alert('Failed to create meeting.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while creating the meeting.');
    }
}

// Funkcja do usuwania spotkania
async function deleteMeeting(meetingId) {
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
            alert("Meeting deleted successfully.");
        } else {
            alert('Failed to delete meeting. Server responded with code ' + response.status);
        }
    } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('An error occurred while deleting the meeting.');
    }
}


// Funkcja do ładowania spotkań z serwera
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

            meetingContainer.innerHTML = '';  // Usuwanie wszystkich poprzednich spotkań z kontenera

            // Dodawanie nowych spotkań do UI
            meetings.forEach(meeting => {
                addMeetingToUI(meeting);
            });
        } else {
            alert('Failed to load meetings. Server responded with code ' + response.status);
        }
    } catch (error) {
        console.error('Error loading meetings:', error);
        alert('An error occurred while loading meetings.');
    }
}

// Funkcja do dołączenia do spotkania
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
            meetingNameInput.value = '';
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

// Inicjalizacja strony po załadowaniu dokumentu
document.addEventListener('DOMContentLoaded', () => {
    loadMeetings();  // Załaduj spotkania
});

// Obsługa kliknięcia przycisku "Save"
saveButton.addEventListener('click', () => {
    const meetingName = meetingNameInput.value.trim();
    createMeeting(meetingName);
});

// Obsługa kliknięcia przycisku "Join"
joinButton.addEventListener('click', handleJoinButtonAction);
