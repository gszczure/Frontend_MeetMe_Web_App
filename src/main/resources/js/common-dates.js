const meetingId = localStorage.getItem("currentMeetingId");
const token = localStorage.getItem("token");

async function fetchCommonDates() {
    if (!token || !meetingId) {
        alert("You must be logged in and have a valid meeting selected.");
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:8080/api/date-ranges/meeting/${meetingId}/common-dates`,
            {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const datesArray = await response.json();
            const container = document.getElementById('common-dates-container');
            container.innerHTML = "";

            if (datesArray.length === 0) {
                container.textContent = "No common dates available.";
            } else {
                const options = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };

                datesArray
                    .map(dateString => {
                        const [day, month, year] = dateString.split('.');
                        const jsDate = new Date(`${year}-${month}-${day}`);
                        const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(jsDate);

                        //TODO TEN FORAMT NIE DZIALA
                        const [weekday, ...rest] = formattedDate.split(', ');
                        return `${rest.join(' ')} (${weekday})`;

                    })
                    .sort((a, b) => new Date(a) - new Date(b))
                    .forEach(formattedDate => {
                        const dateElement = document.createElement('div');
                        dateElement.className = 'date-item';
                        dateElement.textContent = formattedDate;
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

fetchCommonDates();
