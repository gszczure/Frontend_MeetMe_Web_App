const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const meetingId = localStorage.getItem("currentMeetingId");

// Enum dla stanów wyboru
const SelectionState = {
    NONE: "none",
    YES: "yes",
    IF_NEEDED: "if_needed",
};

// Zmienne do przechowywania danych w pamięci podręcznej
let cachedMeetingDates = null;
let cachedVoteCounts = null;

// Funkcja do pobierania wszystkich potrzebnych danych
async function fetchAllData() {
    if (!cachedMeetingDates) {
        cachedMeetingDates = await fetchMeetingDates();
    }
    cachedVoteCounts = await fetchVoteCounts();
    const userSelections = await fetchUserSelections();
    return { meetingDates: cachedMeetingDates, voteCounts: cachedVoteCounts, userSelections };
}

// Funkcja do pobierania wyborów użytkownika z backendu
async function fetchUserSelections() {
    try {
        const response = await fetch(`http://localhost:8080/api/selections/${meetingId}/${userId}/user_selections`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.ok) {
            return await response.json();
        } else {
            console.error("Nie udało się pobrać wyborów użytkownika");
            return {};
        }
    } catch (error) {
        console.error("Błąd podczas pobierania wyborów użytkownika:", error);
        return {};
    }
}

// Funkcja do pobierania liczby głosów
async function fetchVoteCounts() {
    try {
        const response = await fetch(`http://localhost:8080/api/selections/${meetingId}/votes`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.ok) {
            return await response.json();
        } else {
            console.error("Nie udało się pobrać liczby głosów");
            return {};
        }
    } catch (error) {
        console.error("Błąd podczas pobierania liczby głosów:", error);
        return {};
    }
}

// Funkcja do aktualizacji wyboru użytkownika w backendzie
async function updateUserSelection(dateRangeId, selectionState) {
    try {
        const response = await fetch(`http://localhost:8080/api/selections/${meetingId}/${userId}/${dateRangeId}/update_selection`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ state: selectionState }),
        });
        if (!response.ok) {
            console.error("Nie udało się zaktualizować wyboru użytkownika");
        }
    } catch (error) {
        console.error("Błąd podczas aktualizacji wyboru użytkownika:", error);
    }
}

function createDateItem(dateObj, userSelections, voteCounts) {
    const dateItem = document.createElement("div");
    dateItem.className = "date-item";
    dateItem.dataset.dateRangeId = dateObj.id;

    const dateSpan = document.createElement("span");
    dateSpan.className = "date";
    dateSpan.textContent = formatDateForDisplay(dateObj.startDate);

    const timeSpan = document.createElement("span");
    timeSpan.className = "time";
    timeSpan.textContent = dateObj.startTime ? `Start Time: ${dateObj.startTime}` : "";

    const durationSpan = document.createElement("span");
    durationSpan.className = "duration";
    durationSpan.textContent = dateObj.duration ? `Duration: ${dateObj.duration}h` : "";

    const votesContainer = document.createElement("div");
    votesContainer.className = "votes-container";

    const yesBar = document.createElement("div");
    yesBar.className = "yes-bar";

    const ifNeededBar = document.createElement("div");
    ifNeededBar.className = "if-needed-bar";

    votesContainer.appendChild(yesBar);
    votesContainer.appendChild(ifNeededBar);

    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "checkbox-container";

    const checkmark = document.createElement("span");
    checkmark.className = "checkmark";

    checkboxContainer.appendChild(checkmark);

    let currentState = userSelections[dateObj.id] || SelectionState.NONE;

    const updateVotesDisplay = () => {
        const votes = voteCounts[dateObj.id] || { yes: 0, if_needed: 0 };
        const yesVotes = votes.yes || 0;
        const ifNeededVotes = votes.if_needed || 0;

        yesBar.style.width = `${yesVotes * 15}px`;
        yesBar.textContent = yesVotes > 0 ? `${yesVotes}` : "";

        ifNeededBar.style.width = `${ifNeededVotes * 15}px`;
        ifNeededBar.textContent = ifNeededVotes > 0 ? `${ifNeededVotes}` : "";
    };

    updateCheckmarkAppearance(checkmark, currentState, dateItem);
    updateVotesDisplay();

    const handleClick = async () => {
        switch (currentState) {
            case SelectionState.NONE:
                currentState = SelectionState.YES;
                break;
            case SelectionState.YES:
                currentState = SelectionState.IF_NEEDED;
                break;
            case SelectionState.IF_NEEDED:
                currentState = SelectionState.NONE;
                break;
        }

        updateCheckmarkAppearance(checkmark, currentState, dateItem);
        await updateUserSelection(dateObj.id, currentState);

        // Pobierz zaktualizowane liczby głosów i odśwież wyświetlanie
        cachedVoteCounts = await fetchVoteCounts();
        voteCounts = cachedVoteCounts;
        updateVotesDisplay();
        await renderPopularTimeSlots();
    };

    dateItem.addEventListener("click", handleClick);

    dateItem.appendChild(dateSpan);
    dateItem.appendChild(timeSpan);
    dateItem.appendChild(durationSpan);
    dateItem.appendChild(votesContainer);
    dateItem.appendChild(checkboxContainer);

    return dateItem;
}

function updateCheckmarkAppearance(checkmark, state, dateItem) {
    checkmark.className = "checkmark";
    dateItem.classList.remove("selected-yes", "selected-if-needed");
    switch (state) {
        case SelectionState.YES:
            checkmark.classList.add("green-check");
            checkmark.classList.remove("yellow-plus", "hidden");
            dateItem.classList.add("selected-yes");
            break;
        case SelectionState.IF_NEEDED:
            checkmark.classList.add("yellow-plus");
            checkmark.classList.remove("green-check", "hidden");
            dateItem.classList.add("selected-if-needed");
            break;
        case SelectionState.NONE:
            checkmark.classList.add("hidden");
            checkmark.classList.remove("green-check", "yellow-plus");
            break;
    }
}

// Funkcja do pobierania danych z API
async function fetchMeetingDates() {
    if (!token || !meetingId) {
        alert("You must be logged in and have a valid meeting selected.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/date-ranges/meeting/${meetingId}/date`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            alert("Błąd wczytywania dat!");
            return [];
        }
    } catch (error) {
        console.error("Błąd:", error);
        return [];
    }
}

// Funkcja renderująca wszystkie daty na stronie
async function renderDates(meetingDates, userSelections, voteCounts) {
    const dateList = document.getElementById("date-list");
    dateList.innerHTML = "";

    meetingDates.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    meetingDates.forEach((dateObj) => {
        dateList.appendChild(createDateItem(dateObj, userSelections, voteCounts));
    });
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Intl.DateTimeFormat("en-GB", options).format(date);
}

async function renderPopularTimeSlots() {
    try {
        const meetingDates = cachedMeetingDates;
        const voteCounts = cachedVoteCounts;

        const combinedData = meetingDates.map(date => ({
            ...date,
            votes: voteCounts[date.id] || { yes: 0, if_needed: 0 },
            totalVotes: (voteCounts[date.id]?.yes || 0) + (voteCounts[date.id]?.if_needed || 0)
        }));

        combinedData.sort((a, b) => b.totalVotes - a.totalVotes);

        const popularSlots = combinedData.slice(0, 3);

        let popularSlotsSection = document.querySelector('.popular-slots');
        if (!popularSlotsSection) {
            popularSlotsSection = document.createElement('section');
            popularSlotsSection.className = 'popular-slots';
            document.querySelector('main').appendChild(popularSlotsSection);
        }

        popularSlotsSection.innerHTML = `
            <h2>Most Popular Time Slots</h2>
            <div class="popular-slots-list">
                ${popularSlots.map((slot, index) => `
                    <div class="popular-slot-card ${['green', 'blue', 'yellow'][index]}">
                        <div class="popular-slot-date">${formatDateForDisplay(slot.startDate)}</div>
                        <div class="popular-slot-time">
                            ${slot.startTime} (${slot.duration}h)
                        </div>
                        <div class="vote-circles">
                            <div class="vote-circle yes">${slot.votes.yes || 0}</div>
                            <div class="vote-circle if-needed">${slot.votes.if_needed || 0}</div>
                        </div>
                        <button class="view-votes-button" data-date-range-id="${slot.id}">
                            View Votes (${slot.totalVotes})
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        const viewVotesButtons = document.querySelectorAll('.view-votes-button');
        viewVotesButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                const dateRangeId = event.target.getAttribute('data-date-range-id');
                await fetchVotesForDate(dateRangeId);
            });
        });

    } catch (error) {
        console.error("Błąd podczas renderowania popularnych terminów:", error);
    }
}

// Funkcja do pobierania szczegółowych głosów dla konkretnej daty
async function fetchVotesForDate(dateRangeId) {
    try {
        const response = await fetch(`http://localhost:8080/api/getVotes/${dateRangeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const votes = await response.json();
            displayVotesInModal(votes, dateRangeId);
        } else {
            console.error("Błąd pobierania głosów dla tej daty");
        }
    } catch (error) {
        console.error("Błąd podczas pobierania głosów:", error);
    }
}

function displayVotesInModal(votes, dateRangeId) {
    const modal = document.getElementById("modal1");
    const dateHeader = document.getElementById("date-header");
    const voteList = document.getElementById("vote-list");

    const dateObj = cachedMeetingDates.find(date => date.id === Number(dateRangeId));
    dateHeader.textContent = formatDateForDisplay(dateObj.startDate);

    voteList.innerHTML = "";

    votes.sort((a, b) => {
        const order = { yes: 1, if_needed: 2 };
        return (order[a.state] || 3) - (order[b.state] || 3);
    });

    votes.forEach(vote => {
        const listItem = document.createElement("li");
        listItem.className = `vote-item vote-${vote.state || 'no-vote'}`;
        listItem.textContent = `${vote.firstName} ${vote.lastName} - ${vote.state === 'yes' ? 'Available' : vote.state === 'if_needed' ? 'If needed' : 'No vote'}`;
        voteList.appendChild(listItem);
    });

    modal.style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

window.onclick = function(event) {
    if (event.target.className === "modal") {
        event.target.style.display = "none";
    }
}

function displayOrganizerName(meetingDates) {
    if (meetingDates.length > 0) {
        const organizerName = meetingDates[0].addedBy;
        const organizerInfoElement = document.getElementById("organizer-info");
        organizerInfoElement.textContent = `${organizerName} is organizing the meeting`;
    }
}


const logoutButton = document.querySelector('.logout-button');
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// Główna funkcja renderująca
async function renderAll() {
    const { meetingDates, voteCounts, userSelections } = await fetchAllData();
    displayOrganizerName(meetingDates);
    renderDates(meetingDates, userSelections, voteCounts);
    await renderPopularTimeSlots();
}

document.addEventListener("DOMContentLoaded", renderAll);

// TODO zastanowic sie jak zrobic by nie bugowalo sie przy szybkim klikaniu w jakas date(moze ustawic opuznienie lub cos takiego)
// TODO zrobic by jednak uzytkownicy ktorzy nei wybrali nic nie byli wyswietlani (Moze zrobic by wogole ich do bazy danych nie dowawac)
// TODO zrobic zebatke dal ownera spotkania by mogl usuwac ludzi ze spotkania