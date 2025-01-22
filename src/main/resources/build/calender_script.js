const meetingId = localStorage.getItem("currentMeetingId");
const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

// TODO zrobic wiekszy X w liscie dat
// TODO zrobic zeby jak klikne none albo all day to usuwalo sie start time
// TODO zmniejszyc kalendarz caly
// TODO zrobic zeby po save przechodzilo na maina lub zeby wyswietlalo kod dolaczenai dla innych
// TODO wymyslic cos z kodem i kiedy ma sie on wyswietlac
// TODO dodac aby zapisywac duration, start time
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

            const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
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
            // Display a single form for all dates
            const applyAllForm = document.createElement('div');
            applyAllForm.className = 'apply-all-form';
            applyAllForm.innerHTML = `
                <h3>Apply time for all selected dates (${this.selectedDates.size})</h3>
                <div class="input-group">
                    <div class="input-field">
                        <label>Start Time</label>
                        <input type="time" id="timeForAllDates">
                    </div>
                    <div class="input-field">
                        <label>Duration</label>
                        <select>
                            <option>1 hour</option>
                            <option>2 hours</option>
                            <option>3 hours</option>
                            <option>All Day</option>
                            <option>None</option>
                        </select>
                    </div>
                </div>
            `;

            container.appendChild(applyAllForm);
        } else {
            // Display individual forms for each date
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
                        <div class="input-field">
                            <label>Start Time</label>
                            <input type="time">
                        </div>
                        <div class="input-field">
                            <label>Duration</label>
                            <select>
                                <option>1 hour</option>
                                <option>2 hours</option>
                                <option>3 hours</option>
                                <option>All Day</option>
                                <option>None</option>
                            </select>
                        </div>
                    </div>
                `;

                container.appendChild(dateInput);
            });
        }

        // Update button text
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

        document.getElementById('save-dates-button').addEventListener('click', async () => {
            if (this.selectedDates.size === 0) {
                alert('No dates selected.');
                return;
            }

            await this.saveSelectedDates();
        });
    }

    async saveSelectedDates() {

        if (!meetingId || !token || !userId) {
            alert('You must be logged in and have a valid meeting selected.');
            return;
        }

        const dateRanges = [...this.selectedDates].map(date => ({
            meetingId: meetingId,
            userId: userId,
            startDate: date
        }));

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
                alert('Dates saved successfully.');
                this.selectedDates.clear();
                this.renderSelectedDates();
                this.renderCalendar();
            } else {
                const errorMessage = await response.text();
                alert(`Error saving dates: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error saving dates:', error);
            alert('An error occurred while saving dates.');
        }
    }
}

const calendar = new Calendar();

const logoutButton = document.querySelector('.logout-button');
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});