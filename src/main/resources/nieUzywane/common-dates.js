const meetingId = localStorage.getItem("currentMeetingId");
const token = localStorage.getItem("token");
const meetingOwnerId = localStorage.getItem("meetingOwnerId");
const userId = localStorage.getItem("userId");

const backButton = document.getElementById("back-button");
const logoutButton = document.querySelector('.logout-button');

// TODO dodac usuwanie dat lub ich modyfikacje przez walsciciela
async function fetchCommonDates() {
    if (!token || !meetingId) {
        alert("You must be logged in and have a valid meeting selected.");
        return;
    }

    try {
        const response = await fetch(
            `https://backendmeetingapp-1.onrender.com/api/date-ranges/meeting/${meetingId}/common-dates`,
            {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.ok) {
            const datesArray = await response.json();
            const container = document.getElementById('common-dates-container');
            container.innerHTML = "";
            if (datesArray.length === 0) {
                container.textContent = "No common dates available.";
            } else {
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

                // datesArray
                //     .map(dateString => {
                //         const [day, month, year] = dateString.split('.');
                //         const jsDate = new Date(`${year}-${month}-${day}`);
                //         const formattedDate = new Intl.DateTimeFormat('en-US', options).format(jsDate);
                //
                //         return formattedDate;
                //     })
                //     .sort((a, b) => new Date(a) - new Date(b))
                //     .forEach(formattedDate => {
                //         const dateElement = document.createElement('div');
                //         dateElement.className = 'date-item';
                //         dateElement.textContent = formattedDate;
                //
                //         dateElement.addEventListener('click', () => {
                //             setMeetingDate(formattedDate);
                //         });
                //
                //         container.appendChild(dateElement);
                //     });

                // ZMNIENONY FORMAT DATY PONIEWARZ POPRZEDNI NIE DZIALAL NA SAFARI
                datesArray
                    .map(dateString => {
                        const [year, month, day] = dateString.split('-');
                        // Poprawiony format ISO 8601
                        const jsDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
                        return new Intl.DateTimeFormat('en-US', options).format(jsDate);
                    })
                    .sort((a, b) => new Date(a) - new Date(b))
                    .forEach(formattedDate => {
                        const dateElement = document.createElement('div');
                        dateElement.className = 'date-item';
                        dateElement.textContent = formattedDate;

                        dateElement.addEventListener('click', () => {
                            setMeetingDate(formattedDate);
                        });

                        container.appendChild(dateElement);
                    });


            }
        } else {
            alert(`Failed to fetch dates. Server responded with code ${response.status}`);
        }
    } catch (error) {
        console.error("Error fetching common dates:", error);
        alert("An error occurred while fetching dates.");
    }
}

// Funkcja, która zapisuje do backendu date spotkania
async function setMeetingDate(selectedDate) {
    if (!token || !meetingId) {
        alert("You must be logged in and have a valid meeting selected.");
        return;
    }

    if (meetingOwnerId !== userId) {
        alert("You are not authorized to set the meeting date.");
        return;
    }

    try {
        const response = await fetch(
            `https://backendmeetingapp-1.onrender.com/api/meetings/${meetingId}/date`,
            {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ date: formatDateForDatabase(selectedDate) }),
            }
        );

        if (response.ok) {
            alert("Meeting date has been successfully saved.");
            window.location.href = 'index.html';
        } else {
            alert(`Failed to save the meeting date. Server responded with code ${response.status}`);
        }
    } catch (error) {
        console.error("Error saving meeting date:", error);
        alert("An error occurred while saving the meeting date.");
    }
}

function formatDateForDatabase(dateString) {
    const jsDate = new Date(dateString);
    const year = jsDate.getFullYear();
    const month = ("0" + (jsDate.getMonth() + 1)).slice(-2);
    const day = ("0" + jsDate.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

fetchCommonDates();

backButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});

logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html'
})