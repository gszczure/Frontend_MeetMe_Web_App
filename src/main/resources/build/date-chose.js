let userId = localStorage.getItem("userId");
let meetingId = null;
let isProcessing = false;
let cachedMeetingDates = null;
let cachedVoteCounts = null;
let guest = false;
// let url = "http://localhost:8080";
let url = "https://backendmeetingapp-1.onrender.com"



// Enum dla stanów wyboru
const SelectionState = {
    NONE: "none",
    YES: "yes",
    IF_NEEDED: "if_needed",
};

function disableButtonsIfGuest(guest) {
    const participantsBtn = document.getElementById("participants-btn");

    if (guest) {
        participantsBtn.classList.add("disabled-button");

        function blockClick(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            showNotification("The meeting participants list can only be viewed by registered users.");
        }

        // Najpierw usuwamy stare eventy, żeby nie dodawać wielu
        participantsBtn.replaceWith(participantsBtn.cloneNode(true));
        const newBtn = document.getElementById("participants-btn");
        newBtn.classList.add("disabled-button");
        newBtn.addEventListener("click", blockClick);
    } else {
        participantsBtn.classList.remove("disabled-button");
    }
}

function getMeetingCode() {
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get("code");
    return code;
}

function getToken() {
    return localStorage.getItem("token");
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Intl.DateTimeFormat("en-GB", options).format(date);
}

async function fetchAllData() {
    const meetingCode = getMeetingCode();
    if (!meetingCode) {
        console.error("Brak meetingCode");
        return;
    }

    const token = getToken();
    if (!token) {
        console.error("Invalid token.");
        return;
    }

    try {
        const response = await fetch(
            `${url}/api/meeting-details/details/${meetingCode}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Nie znaleziono spotkania");
        }

        const meetingDetails = await response.json();

        meetingId = meetingDetails.meetingId;

        cachedMeetingDates = meetingDetails.dateRanges;
        cachedVoteCounts = await fetchVoteCounts();
        const userSelections = await fetchUserSelections();

        guest = meetingDetails.guest;

        disableButtonsIfGuest(guest);

        return {
            meetingDetails,
            meetingDates: cachedMeetingDates,
            voteCounts: cachedVoteCounts,
            userSelections,
            guest
        };
    } catch (error) {
        console.error("Błąd podczas pobierania danych spotkania:", error);
    }
}

async function fetchUserSelections() {
    const token = getToken();

    if (!token) {
        console.error("Invalid token.");
        return;
    }
    try {
        const response = await fetch(`${url}/api/date-selections/${meetingId}/${userId}/user_selections`, {
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

async function fetchVoteCounts() {
    const token = getToken();

    if (!token) {
        console.error("Invalid token.");
        return;
    }
    try {
        const response = await fetch(`${url}/api/date-selections/${meetingId}/votes`, {
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

async function updateUserSelection(dateRangeId, selectionState) {
    const token = getToken();
    if (!token) {
        console.error("Invalid token.");
        return;
    }
    try {
        if (selectionState === SelectionState.NONE) {
            const response = await fetch(
                `${url}/api/date-selections/${meetingId}/${userId}/${dateRangeId}/delete_selection`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    method: "DELETE",
                },
            );

            if (!response.ok) {
                console.error("Nie udało się usunąć wyboru użytkownika");
            }
            return;
        }
        const response = await fetch(
            `${url}/api/date-selections/${meetingId}/${userId}/${dateRangeId}/update_selection`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ state: selectionState }),
            },
        );

        if (!response.ok) {
            console.error("Nie udało się zaktualizować wyboru użytkownika");
        }
    } catch (error) {
        console.error("Błąd podczas aktualizacji wyboru użytkownika:", error);
    }
}

async function fetchVotesForDate(dateRangeId) {
    const token = getToken();
    if (!token) {
        console.error("Invalid token.");
        return;
    }

    try {
        const response = await fetch(`${url}/api/meeting-details/getVotes/${dateRangeId}`, {
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

async function removeParticipant(userId) {
    const token = getToken();
    if (!token) {
        console.error("Invalid token.");
        return;
    }
    try {
        const response = await fetch(`${url}/api/meetings/${meetingId}/participants/${userId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.ok) {
            return true;
            // TODO dodac zeby ladowalo od nowa strone
        } else {
            console.error("Failed to remove participant");
            return false;
        }
    } catch (error) {
        console.error("Error removing participant:", error);
        return false;
    }
}

async function fetchParticipants() {
    const token = getToken();
    if (!token) {
        console.error("Invalid token.");
        return;
    }
    try {
        const response = await fetch(`${url}/api/meetings/${meetingId}/participants`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.ok) {
            return await response.json();
        } else {
            console.error("Failed to fetch participants");
            return null;
        }
    } catch (error) {
        console.error("Error fetching participants:", error);
        return null;
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

        yesBar.style.width = `${Math.min(yesVotes * 15, 100)}px`;
        yesBar.textContent = yesVotes > 0 ? `${yesVotes}` : "";

        ifNeededBar.style.width = `${Math.min(ifNeededVotes * 15, 100)}px`;
        ifNeededBar.textContent = ifNeededVotes > 0 ? `${ifNeededVotes}` : "";
    };

    updateCheckmarkAppearance(checkmark, currentState, dateItem);
    updateVotesDisplay();

    const handleClick = async (event) => {
        if (isProcessing) return;

        isProcessing = true;
        const dateItem = event.currentTarget;
        const dateRangeId = dateItem.dataset.dateRangeId;

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

        try {
            await updateUserSelection(dateRangeId, currentState);

            cachedVoteCounts = await fetchVoteCounts();
            voteCounts = cachedVoteCounts;
            updateVotesDisplay();
            await renderPopularTimeSlots();
        } catch (error) {
            console.error("Błąd podczas aktualizacji wyboru:", error);
        } finally {
            isProcessing = false;
        }
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

async function renderDates(meetingDates, userSelections, voteCounts) {
    const dateList = document.getElementById("date-list");
    dateList.innerHTML = "";

    meetingDates.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    meetingDates.forEach((dateObj) => {
        dateList.appendChild(createDateItem(dateObj, userSelections, voteCounts));
    });
}

async function renderPopularTimeSlots() {
    try {
        const meetingDates = cachedMeetingDates;
        const voteCounts = cachedVoteCounts;

        const combinedData = meetingDates.map((date) => ({
            ...date,
            votes: voteCounts[date.id] || { yes: 0, if_needed: 0 },
            totalVotes: (voteCounts[date.id]?.yes || 0) + (voteCounts[date.id]?.if_needed || 0),
        }));

        combinedData.sort((a, b) => b.totalVotes - a.totalVotes);
        const popularSlots = combinedData.slice(0, 3);

        let popularSlotsSection = document.querySelector(".popular-slots");
        if (!popularSlotsSection) {
            popularSlotsSection = document.createElement("section");
            popularSlotsSection.className = "popular-slots";
            document.querySelector("main").appendChild(popularSlotsSection);
        }

        popularSlotsSection.innerHTML = `
            <h2>Most Popular Time Slots</h2>
            <div class="popular-slots-list">
                ${popularSlots
            .map(
                (slot, index) => `
                        <div class="popular-slot-card ${["green", "blue", "yellow"][index]}">
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
                    `,
            )
            .join("")}
            </div>
        `;

        const viewVotesButtons = document.querySelectorAll(".view-votes-button");

        viewVotesButtons.forEach((button) => {
            if (guest) {
                button.classList.add("disabled-button");

                function blockClick(e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    showNotification("The view votes list can only be viewed by registered users.");
                }

                // Zamieniamy guzik na klon, żeby usunąć stare eventy
                const newButton = button.cloneNode(true);
                button.replaceWith(newButton);
                newButton.classList.add("disabled-button");
                newButton.addEventListener("click", blockClick);
            } else {
                button.classList.remove("disabled-button");

                // Normalny event dla zalogowanych użytkowników
                button.addEventListener("click", async (event) => {
                    const dateRangeId = event.target.getAttribute("data-date-range-id");
                    await fetchVotesForDate(dateRangeId);
                });
            }
        });
    } catch (error) {
        console.error("Błąd podczas renderowania popularnych terminów:", error);
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
        return order[a.state] - order[b.state];
    });

    votes.forEach(vote => {
        const listItem = document.createElement("li");
        listItem.className = `vote-item vote-${vote.state}`;
        listItem.textContent = `${vote.firstName} ${vote.lastName} - ${vote.state === "yes" ? "Available" : "If needed"}`;
        voteList.appendChild(listItem);
    });

    modal.style.display = "block";
}

async function showParticipantsModal() {
    const token = getToken();

    if (!token) {
        return;
    }

    const participantsData = await fetchParticipants();
    if (!participantsData) return;

    const { owner, participants } = participantsData;
    const participantsList = document.getElementById("participants-list");
    const participantCount = document.getElementById("participant-count");
    const isOwner = owner.id === Number.parseInt(userId);

    participantsList.innerHTML = "";
    participantCount.textContent = participants.length + 1; // plus jeden bo jeszcze owner

    const ownerLi = document.createElement("li");
    ownerLi.innerHTML = `${owner.firstName} ${owner.lastName} <strong>(Owner)</strong>`;
    participantsList.appendChild(ownerLi);

    // TODO zrobic potwierdzenie przy usuwaniu (czy na pewno chcesz usunac... )
    participants.forEach((participant) => {
        const li = document.createElement("li");
        li.innerHTML = `
      ${participant.firstName} ${participant.lastName}
      ${isOwner ? `<button class="remove-participant" data-user-id="${participant.id}">&times;</button>` : ""}
    `;
        participantsList.appendChild(li);
    });

    if (isOwner) {
        const removeButtons = document.querySelectorAll(".remove-participant");
        removeButtons.forEach((button) => {
            button.addEventListener("click", async (e) => {
                if (isProcessing) return;
                isProcessing = true;
                const userId = e.target.getAttribute("data-user-id");
                removeButtons.forEach((btn) => (btn.disabled = true));
                const success = await removeParticipant(userId);
                if (success) {
                    e.target.parentElement.remove();
                    participantCount.textContent = Number.parseInt(participantCount.textContent) - 1;
                }
                removeButtons.forEach((btn) => (btn.disabled = false));
                isProcessing = false;
            });
        });
    }

    document.getElementById("participants-modal").style.display = "block";
}

window.onclick = (event) => {
    if (event.target.className === "modal") {
        event.target.style.display = "none";
    }
};

document.getElementById("participants-btn").addEventListener("click", showParticipantsModal);

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}


// Główna funkcja renderująca
async function renderAll() {
    const data = await fetchAllData();
    if (!data) return;

    const { meetingDetails, meetingDates, voteCounts, userSelections } = data;

    const organizerInfoElement = document.getElementById("organizer-info");
    organizerInfoElement.innerHTML = `<div class="organizer-name">${meetingDetails.name}</div>`;

    const commentElement = document.querySelector(".comment");
    commentElement.textContent = meetingDetails.comment || null;

    disableButtonsIfGuest(guest);

    await renderDates(meetingDates, userSelections, voteCounts);

    await renderPopularTimeSlots();
}

// Logowanie
async function handleLogin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username && password) {
        try {
            const response = await fetch(`${url}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.token);
                localStorage.setItem("userId", data.userId);
                userId = data.userId;
                localStorage.setItem("isAuthenticated", "true");

                document.getElementById("login-overlay").style.display = "none";
                await handleAutoJoinMeeting();
                await renderAll();
                showNotification("Successfully logged in.")
            } else {
                showAlert("Invalid username or password. Please try again.");
            }
        } catch (error) {
            console.error("Error logging in:", error);
            showAlert("Error logging in. Please try again.");
        }
    } else {
        showAlert("Please enter both username and password.");
    }
}

// Guest Logowanie
async function handleGuestLogin() {
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;

    if (firstName && lastName) {
        try {
            const response = await fetch(`${url}/api/auth/guest-login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ firstName, lastName }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.token);
                localStorage.setItem("userId", data.userId);
                userId = data.userId;
                localStorage.setItem("isGuest", "true");

                document.getElementById("login-overlay").style.display = "none";
                await handleAutoJoinMeeting();
                await renderAll();
                showNotification("You are logged in as a guest. Some features may be restricted.")
            } else {
                console.error("Failed to login:", response.statusText);
                showAlert("Failed to login as guest. Please try again.");
            }
        } catch (error) {
            console.error("Error logging in:", error);
            showAlert("Error logging in as guest. Please try again.");
        }
    } else {
        showAlert("Please enter both your first and last name.");
    }
}

// auto-joining meetings
async function handleAutoJoinMeeting() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (!code) return;

    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${url}/api/meetings/join`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            console.error("Failed to auto-join meeting");
        }
    } catch (error) {
        console.error("Error auto-joining meeting:", error);
    }
}

const shareButton = document.getElementById("share-btn")
if (shareButton) {
    shareButton.addEventListener("click", async () => {
        const meetingCode = getMeetingCode()
        if (meetingCode && meetingCode !== "null") {
            const meetingLink = `https://backendmeetingapp-1.onrender.com/api/meetings/join/${meetingCode}`

            try {
                await navigator.clipboard.writeText(meetingLink)
                showNotification("Meeting link has been copied to your clipboard!")
            } catch (err) {
                showNotification("Failed to copy meeting link to clipboard.")
            }
        } else {
            showNotification("Invalid meeting code.")
        }
    })
}

function setupLoginForm() {
    const showLoginFormLink = document.getElementById("show-login-form");
    const showGuestLoginLink = document.getElementById("show-guest-login");
    const loginFormContainer = document.getElementById("login-form-container");
    const guestLoginContainer = document.getElementById("guest-login-container");
    const loginButton = document.getElementById("login-button-auth");
    const guestLoginButton = document.getElementById("login-button");


    showLoginFormLink.addEventListener("click", (e) => {
        e.preventDefault();
        loginFormContainer.style.display = "block";
        guestLoginContainer.style.display = "none";
    });

    showGuestLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        loginFormContainer.style.display = "none";
        guestLoginContainer.style.display = "block";
    });

    loginButton.addEventListener("click", handleLogin);
    guestLoginButton.addEventListener("click", handleGuestLogin);
}

const token = localStorage.getItem("token");
const loginOverlay = document.getElementById("login-overlay");

if (token) {
    loginOverlay.style.display = "none";
    userId = localStorage.getItem("userId");
    handleAutoJoinMeeting();
    renderAll();
} else {
    loginOverlay.style.display = "flex";
    setupLoginForm();
}

// TODO pomysles nad priorytetem kolejnosci wysweitlania most popular date np (3.YES 1.IfNeeded > 3.IfNeeded 1.YES)
// TODO dodac jakies wyglady dla guzikow ktore nei sa dostepne dla gosci
// TODO zrobic is processing w kazdym guziku (viev votes i participants) bo w tych brakuje
//TODO jak usune uzytkownika to ma sie wszystko zaladowac ponownie (w sumei to nie wszytko bo tylko pasek kolorow glosow i na dole lista glosow) VOTES ma sie zaladowac jeszcze raz
// TODO zrobi w participants X czerwonego jak przy usuwaniu ludzi
//TODO naprawic blad ze jak spamie participants to sie wysweitli po wczytaniu wszystkiego (zrobic zeby te guziki byly disabled na poczatku albo zeby funckjie odpowiadajace endpoitom dobrym byly dopiero mozliwe zeby wysylac dane po jakims czasie)
// TODO zrobic na telefonei inaczej guziki edit share oraz participants
//TODO dodac wyglady po najechaniu na daty do wyboru (krawedzie sie podswieca)