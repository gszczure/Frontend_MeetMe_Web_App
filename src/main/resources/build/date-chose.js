const token = localStorage.getItem("token");
const meetingId = localStorage.getItem("currentMeetingId");

// Funkcja formatowania daty na odpowiedni format
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
}
// Funkcja do pobierania danych z API
async function fetchMeetingDates() {
    if (!token || !meetingId) {
        alert("You must be logged in and have a valid meeting selected.");
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:8080/api/date-ranges/meeting/${meetingId}`,
            {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            renderDates(data);
        } else {
            alert("Blad wczytywania dat!")
        }

    } catch (error) {
        console.error('Błąd:', error);
    }
}

// Funkcja tworząca elementy daty
function createDateItem(dateObj) {
    const dateItem = document.createElement('div');
    dateItem.className = 'date-item';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'date';
    dateSpan.textContent = formatDateForDisplay(dateObj.startDate);

    const timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = dateObj.startTime ? dateObj.startTime : '';

    const durationSpan = document.createElement('span');
    durationSpan.className = 'duration';
    durationSpan.textContent = dateObj.duration || 'All Day';

    const votesContainer = document.createElement('div');
    votesContainer.className = 'votes-container';

    //TODO zrobic cos zeby z bazy pobieralo a nie na 0 odrazu ustwialo
    let yesVotes = dateObj.yesVotes || 0;
    let ifNeededVotes = dateObj.ifNeededVotes || 0;

    // Tworzymy paski
    const yesBar = document.createElement('div');
    yesBar.className = 'yes-bar';
    yesBar.style.width = `${yesVotes * 15}px`;
    if (yesVotes > 0) yesBar.textContent = `${yesVotes}`;

    const ifNeededBar = document.createElement('div');
    ifNeededBar.className = 'if-needed-bar';
    ifNeededBar.style.width = `${ifNeededVotes * 15}px`;
    if (ifNeededVotes > 0) ifNeededBar.textContent = `${ifNeededVotes}`;

    votesContainer.appendChild(yesBar);
    votesContainer.appendChild(ifNeededBar);

    // Kliknięcie na kwadrat
    let clickCount = 0;

    const updateBars = () => {
        yesBar.style.width = `${yesVotes * 15}px`;
        if (yesVotes > 0) yesBar.textContent = `${yesVotes}`;
        else yesBar.textContent = '';

        ifNeededBar.style.width = `${ifNeededVotes * 15}px`;
        if (ifNeededVotes > 0) ifNeededBar.textContent = `${ifNeededVotes}`;
        else ifNeededBar.textContent = '';
    };

    const handleClick = () => {
        clickCount++;
        if (clickCount === 1) {
            yesVotes++;
            dateItem.classList.add('selected-yes');
        } else if (clickCount === 2) {
            yesVotes--;
            ifNeededVotes++;
            dateItem.classList.remove('selected-yes');
            dateItem.classList.add('selected-if-needed');
        } else if (clickCount === 3) {
            ifNeededVotes--;
            dateItem.classList.remove('selected-if-needed');
        }
        if (clickCount === 3) {
            clickCount = 0;
        }

        updateBars();
    };

    dateItem.addEventListener('click', handleClick);

    dateItem.appendChild(dateSpan);
    dateItem.appendChild(timeSpan);
    dateItem.appendChild(durationSpan);
    dateItem.appendChild(votesContainer);

    return dateItem;
}

// Funkcja renderująca wszystkie daty na stronie
function renderDates(data) {
    const dateList = document.getElementById('date-list');

    data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    data.forEach((dateObj) => {
        dateList.appendChild(createDateItem(dateObj));
    });
}

const logoutButton = document.querySelector('.logout-button');
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// Wywołaj funkcję pobierającą dane
fetchMeetingDates();