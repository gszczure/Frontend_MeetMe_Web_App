document.addEventListener("DOMContentLoaded", () => {
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    const addDateButton = document.getElementById("add-date-button");
    const saveDatesButton = document.getElementById("save-dates-button");
    const dateList = document.getElementById("date-list");


    //TODO usunać to na samej gorze z najpierw wczytywaniem calego pliku bo i tka juz mam to w html zrobione
    //TODO zrobic zeby pustego przedzialu daty nie mozna save zrobic
    //TODO zrobic by po kliknieciu save dates ta lista byla czyszczona bo jak sie nei czysci to sie dodaje podwojnie

    const selectedDates = [];

    const today = new Date().toISOString().split('T')[0];
    startDateInput.setAttribute('min', today);
    endDateInput.setAttribute('min', today);

    addDateButton.addEventListener("click", () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (startDate && endDate) {
            // Formatowanie daty na format nazwowy dla wyświetlenia
            const formattedStartDate = formatDateForDisplay(startDate);
            const formattedEndDate = formatDateForDisplay(endDate);
            const dateRange = `${formattedStartDate} to ${formattedEndDate}`;

            if (!selectedDates.includes(dateRange)) {
                selectedDates.push(dateRange);
                const listItem = document.createElement("li");
                listItem.textContent = dateRange;
                dateList.appendChild(listItem);
            } else {
                alert("This date range has already been added.");
            }
        } else {
            alert("Please select both a start date and an end date.");
        }

        startDateInput.value = "";
        endDateInput.value = "";
    });

    // Obsługuje zapisanie dat do bazy
    saveDatesButton.addEventListener("click", () => {
        saveDateRanges();
    });

    // Funkcja formatująca daty na format: 7 December 2024 (dla wyświetlenia)
    function formatDateForDisplay(dateString) {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Intl.DateTimeFormat('en-GB', options).format(date);
    }

    // Funkcja formatująca daty na format: 07-12-2024 (do wysyłki na backend)
    function formatDateForDatabase(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
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
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || 'Failed to save dates'}`);
            }
        } catch (error) {
            console.error("Error saving dates:", error);
            alert("An error occurred while saving dates.");
        }
    }
});
