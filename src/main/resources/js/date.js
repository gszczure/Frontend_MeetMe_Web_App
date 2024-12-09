const logoutButton = document.querySelector('.logout-button');

const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const addDateButton = document.getElementById("add-date-button");
const backButton = document.getElementById("back-button");
const saveDatesButton = document.getElementById("save-dates-button");
const dateList = document.getElementById("date-list");
const addedMeetingsList = document.getElementById("added-meetings-list");

//TODO DODAC NAPIS LI W TEAM AVALIBITY JAK W SELECTED  DATE RANGES

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
}

function formatDateForDatabase(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

const selectedDates = [];

const today = new Date().toISOString().split('T')[0];
startDateInput.setAttribute('min', today);
endDateInput.setAttribute('min', today);

startDateInput.addEventListener("change", () => {
    const startDate = startDateInput.value;
    if (startDate) {
        endDateInput.setAttribute('min', startDate);
    }
});

addDateButton.addEventListener("click", () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (startDate && endDate) {
        const formattedStartDate = formatDateForDisplay(startDate);
        const formattedEndDate = formatDateForDisplay(endDate);
        const dateRange = `${formattedStartDate} to ${formattedEndDate}`;

        if (!selectedDates.includes(dateRange)) {
            selectedDates.push(dateRange);
            const listItem = document.createElement("li");
            listItem.textContent = dateRange;
            dateList.appendChild(listItem);

            const noDatesMessage = document.getElementById("no-dates-message");
            if (noDatesMessage) {
                noDatesMessage.remove();
            }
        } else {
            alert("This date range has already been added.");
        }
    } else {
        alert("Please select both a start date and an end date.");
    }

    startDateInput.value = "";
    endDateInput.value = "";
    endDateInput.removeAttribute('min');
});

saveDatesButton.addEventListener("click", () => {
    if (selectedDates.length === 0) {
        alert("No date ranges to save.");
        return;
    }

    saveDateRanges();
    dateList.innerHTML = "";
    selectedDates.length = 0;
});

async function loadSavedDateRanges() {
    const meetingId = localStorage.getItem("currentMeetingId");
    const token = localStorage.getItem("token");

    if (!token || !meetingId) {
        alert("You must be logged in and have a valid meeting selected.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/date-ranges/meeting/${meetingId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const dateRanges = await response.json();

            addedMeetingsList.innerHTML = "";

            dateRanges.forEach((dateRange) => {
                const startDate = formatDateForDisplay(dateRange.startDate);
                const endDate = formatDateForDisplay(dateRange.endDate);
                const userFullName = dateRange.addedBy;
                const listItem = document.createElement("li");
                listItem.textContent = `${startDate} to ${endDate} - Added By: ${userFullName}`;
                addedMeetingsList.appendChild(listItem);
            });
        } else {
            alert("Failed to load date ranges.");
        }
    } catch (error) {
        console.error("Error loading date ranges:", error);
        alert("An error occurred while loading date ranges.");
    }
}

async function saveDateRanges() {
    const meetingId = localStorage.getItem('currentMeetingId');
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (!token) {
        alert("You must be logged in and have a valid meeting selected.");
        return;
    }

    const dateRanges = selectedDates.map(dateRange => {
        const [startDate, endDate] = dateRange.split(" to ");
        return {
            meetingId: meetingId,
            userId: userId,
            startDate: formatDateForDatabase(startDate),
            endDate: formatDateForDatabase(endDate)
        };
    });

    try {
        const response = await fetch("http://localhost:8080/api/date-ranges", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dateRanges)
        });

        if (response.ok) {
            alert("Dates successfully saved.");
            loadSavedDateRanges();
        } else if (response.status === 409) {
            const errorMessage = await response.text();
            alert(errorMessage);
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message || "Failed to save dates"}`);
        }
    } catch (error) {
        console.error("Error saving dates:", error);
        alert("An error occurred while saving dates.");
    }
}

// Ładowanie zapisanych dat po załadowaniu strony
loadSavedDateRanges();

backButton.addEventListener("click", () => {
    window.location.href = 'main.html';
});

logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});
