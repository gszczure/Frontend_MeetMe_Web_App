const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

// TODO sprawdzic blad jak w[isze start time a potem duration na none ustawie i stworze spotkanie
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDates = new Set();
        this.isApplyAllClicked = false;
        this.init();
    }

    init() {
        this.renderCalendar();
        this.attachEventListeners();
        this.initMobileButton();
    }

    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();

        document.getElementById('currentMonth').textContent =
            new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });

        grid.innerHTML = '';

        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        weekdays.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'weekday';
            dayEl.textContent = day;
            grid.appendChild(dayEl);
        });

        const firstDay = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'date disabled';
            grid.appendChild(emptyDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateEl = document.createElement('div');
            dateEl.className = 'date';
            dateEl.textContent = day;

            const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day
                .toString()
                .padStart(2, '0')}`;
            if (this.selectedDates.has(dateString)) {
                dateEl.classList.add('selected');
            }

            dateEl.addEventListener('click', () => this.toggleDate(dateString));
            grid.appendChild(dateEl);
        }
    }

    toggleDate(dateString) {
        if (this.selectedDates.has(dateString)) {
            this.selectedDates.delete(dateString);
        } else {
            this.selectedDates.add(dateString);
        }
        this.renderCalendar();
        this.renderSelectedDates();
    }

    renderSelectedDates() {
        const container = document.getElementById('selectedDatesList');
        container.innerHTML = '';

        if (this.isApplyAllClicked) {
            // Formularz dla wszystkich zaznaczonych dat – pole start time opakowane w kontener z animacją
            const applyAllForm = document.createElement('div');
            applyAllForm.className = 'apply-all-form';
            applyAllForm.innerHTML = `
        <h3>Apply time for all selected dates (${this.selectedDates.size})</h3>
        <div class="input-group">
          <div class="start-time-container" id="timeForAllDatesContainer">
            <div class="input-field">
              <label>Start Time</label>
              <input type="time" id="timeForAllDates">
            </div>
          </div>
          <div class="input-field">
            <label>Duration</label>
            <select id="durationForAllDates" data-date="applyAll">
              <option value="" disabled selected>Select Duration Time</option>
              <option value="None">None</option>
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="All Day">All Day</option>
            </select>
          </div>
        </div>
      `;
            container.appendChild(applyAllForm);
        } else {
            // Formularze indywidualne dla każdej daty
            [...this.selectedDates].sort().forEach(dateString => {
                const dateInput = document.createElement('div');
                dateInput.className = 'date-input';

                const date = new Date(dateString);
                const formattedDate = date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

                dateInput.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3>${formattedDate}</h3>
            <button class="remove-date" onclick="calendar.toggleDate('${dateString}')">&times;</button>
          </div>
          <div class="input-group">
            <div class="start-time-container" id="startTimeContainer-${dateString}">
              <div class="input-field">
                <label>Start Time</label>
                <input type="time" id="startTime-${dateString}" data-date="${dateString}">
              </div>
            </div>
            <div class="input-field">
              <label>Duration</label>
              <select id="duration-${dateString}" data-date="${dateString}">
                <option value="" disabled selected>Select Duration Time</option>
                <option value="None">None</option>
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="All Day">All Day</option>
              </select>
            </div>
          </div>
        `;
                container.appendChild(dateInput);
            });
        }

        const button = document.querySelector('.apply-all');
        button.textContent = this.isApplyAllClicked
            ? 'Set different times for each date'
            : 'Apply same time to all dates';
    }

    attachEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.querySelector('.apply-all').addEventListener('click', () => {
            this.isApplyAllClicked = !this.isApplyAllClicked;
            this.renderSelectedDates();
        });

        let isProcessing = false;

        // Zdarzenie kliknięcia przycisku zapisu
        document.getElementById('save&create-button').addEventListener('click', async () => {
            if (isProcessing) return

            isProcessing = true;
            try {
                const meetingName = document.getElementById('meeting-name').value.trim();
                const comment = document.getElementById('meeting-description').value.trim();

                if (!meetingName) {
                    alert("Meeting name cannot be empty!");
                    return;
                }

                if (this.selectedDates.size === 0) {
                    alert('Please select at least one date.');
                    return;
                }

                // Walidacja wyboru duration i pola start time gdy wybrano czas liczbowy
                if (this.isApplyAllClicked) {
                    const durationForAll = document.getElementById('durationForAllDates').value;
                    if (!durationForAll) {
                        alert('Please select a duration for all dates.');
                        return;
                    }
                    if (['1', '2', '3'].includes(durationForAll)) {
                        const startTime = document.getElementById('timeForAllDates').value;
                        if (!startTime) {
                            alert('Please select a start time when choosing a numeric duration.');
                            return;
                        }
                    }
                } else {
                    for (let date of this.selectedDates) {
                        const durationSelect = document.getElementById(`duration-${date}`);
                        if (!durationSelect || !durationSelect.value) {
                            alert(`Please select a duration for ${date}.`);
                            return;
                        }
                        if (['1', '2', '3'].includes(durationSelect.value)) {
                            const startTimeInput = document.getElementById(`startTime-${date}`);
                            if (!startTimeInput || !startTimeInput.value) {
                                alert(`Please select a start time for ${date} when choosing a numeric duration.`);
                                return;
                            }
                        }
                    }
                }

                // Najpierw tworzymy spotkanie
                const meeting = await this.createMeeting();
                if (!meeting) return;

                if (comment) {
                    const commentSaved = await this.saveComment(meeting.id, comment);
                    if (!commentSaved) return;
                }

                // Następnie zapisujemy daty
                const success = await this.saveSelectedDates(meeting.id);
                if (!success) return;

                alert(`Meeting created successfully! Share this code with others: ${meeting.code}`);
                window.location.href = 'main.html';
            } finally {
                isProcessing = false
            }
        });

        // Obsługa zmiany w polach select – animacja ukrywania/pokazywania pola start time
        document.getElementById('selectedDatesList').addEventListener('change', (event) => {
            if (event.target.tagName === 'SELECT') {
                let associatedContainer;
                if (event.target.id === 'durationForAllDates') {
                    associatedContainer = document.getElementById('timeForAllDatesContainer');
                } else {
                    const date = event.target.dataset.date;
                    associatedContainer = document.getElementById(`startTimeContainer-${date}`);
                }
                if (associatedContainer) {
                    if (event.target.value === 'All Day' || event.target.value === 'None') {
                        associatedContainer.classList.add('hidden');
                        // Czyszczenie pola start time
                        const timeInput = associatedContainer.querySelector('input');
                        if (timeInput) timeInput.value = '';
                    } else {
                        associatedContainer.classList.remove('hidden');
                    }
                }
            }
        });
    }

    async createMeeting() {
        const meetingName = document.getElementById('meeting-name').value.trim();
        const meetingDescription = document.getElementById('meeting-description').value.trim();

        if (!meetingName) {
            alert("Meeting name cannot be empty!");
            return null;
        }

        if (!token) {
            alert("You must be logged in to create a meeting.");
            return null;
        }

        try {
            const response = await fetch('http://localhost:8080/api/meetings/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: meetingName,
                    description: meetingDescription
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                alert('Failed to create meeting.');
                return null;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while creating the meeting.');
            return null;
        }
    }

    async saveComment(meetingId, comment) {
        if (!meetingId || !token) {
            alert('Invalid meeting data for comment saving.');
            return false;
        }
        try {
            const response = await fetch(`http://localhost:8080/api/meetings/${meetingId}/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                // Przesyłamy komentarz jako zwykły tekst – backend go trimuje
                body: JSON.stringify(comment)
            });

            if (response.ok) {
                return true;
            } else {
                const errorMessage = await response.text();
                alert(`Error saving comment: ${errorMessage}`);
                return false;
            }
        } catch (error) {
            console.error('Error saving comment:', error);
            alert('An error occurred while saving the comment.');
            return false;
        }
    }

    async saveSelectedDates(meetingId) {
        if (!meetingId || !token || !userId) {
            alert('Invalid meeting data.');
            return false;
        }

        if (this.selectedDates.size === 0) {
            alert('Please select at least one date.');
            return false;
        }

        let dateRanges = [];
        if (this.isApplyAllClicked) {
            const startTime = document.getElementById('timeForAllDates').value;
            const duration = document.getElementById('durationForAllDates').value;

            dateRanges = [...this.selectedDates].map(date => ({
                meetingId: meetingId,
                userId: userId,
                startDate: date,
                startTime: startTime || null,
                duration: duration || null,
                yesVotes: 1
            }));
        } else {
            dateRanges = [...this.selectedDates].map(date => {
                const startTimeInput = document.getElementById(`startTime-${date}`);
                const durationSelect = document.getElementById(`duration-${date}`);
                return {
                    meetingId: meetingId,
                    userId: userId,
                    startDate: date,
                    startTime: startTimeInput ? startTimeInput.value : null,
                    duration: durationSelect ? durationSelect.value : null,
                    yesVotes: 1
                };
            });
        }

        try {
            const response = await fetch('http://localhost:8080/api/date-ranges', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dateRanges)
            });

            if (response.ok) {
                return true;
            } else {
                const errorMessage = await response.text();
                alert(`Error saving dates: ${errorMessage}`);
                return false;
            }
        } catch (error) {
            console.error('Error saving dates:', error);
            alert('An error occurred while saving dates.');
            return false;
        }
    }

    initMobileButton() {
        const desktopButton = document.getElementById("save&create-button")
        const mobileButton = document.querySelector(".mobile-footer-button")

        if (desktopButton && mobileButton) {
            mobileButton.addEventListener("click", (e) => {
                e.preventDefault()
                    desktopButton.click()
            })
        }
    }
}

const calendar = new Calendar();

const logoutButton = document.querySelector('.logout-button');
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});
