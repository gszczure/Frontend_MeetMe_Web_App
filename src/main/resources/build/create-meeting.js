let token = localStorage.getItem("token");
let isProcessing = false;

// TODO sprawdzic blad jak w[isze start time a potem duration na none ustawie i stworze spotkanie
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDates = new Set();
        this.isApplyAllClicked = false;
        this.init()
    }

    init() {
        this.renderCalendar();
        this.attachEventListeners();
        this.initMobileButton();
    }

    renderCalendar() {
        const grid = document.getElementById("calendarGrid");
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        document.getElementById("currentMonth").textContent = new Date(currentYear, currentMonth).toLocaleString("en-US", {
            month: "long",
            year: "numeric",
        });

        grid.innerHTML = "";

        const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        weekdays.forEach((day) => {
            const dayEl = document.createElement("div");
            dayEl.className = "weekday";
            dayEl.textContent = day;
            grid.appendChild(dayEl);
        });

        const firstDay = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement("div");
            emptyDay.className = "date disabled";
            grid.appendChild(emptyDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateEl = document.createElement("div");
            dateEl.className = "date";
            dateEl.textContent = day;

            const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day
                .toString()
                .padStart(2, "0")}`;

            const dayDate = new Date(dateString);

            if (dayDate < today) {
                dateEl.classList.add("past-date");
            } else {
                dateEl.addEventListener("click", () => this.toggleDate(dateString));
            }

            if (this.selectedDates.has(dateString)) {
                dateEl.classList.add("selected");
            }

            grid.appendChild(dateEl);
        }
    }


    toggleDate(dateString) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const selectedDate = new Date(dateString);

        if (selectedDate < currentDate) {
            return;
        }

        if (this.selectedDates.has(dateString)) {
            this.selectedDates.delete(dateString);
        } else {
            this.selectedDates.add(dateString);
        }
        this.renderCalendar();
        this.renderSelectedDates();
    }

    renderSelectedDates() {
        const container = document.getElementById("selectedDatesList");
        container.innerHTML = "";

        if (this.isApplyAllClicked) {
            // Formularz dla wszystkich zaznaczonych dat – pole start time opakowane w kontener z animacją
            const applyAllForm = document.createElement("div");
            applyAllForm.className = "apply-all-form";
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
      `
            container.appendChild(applyAllForm);
        } else {
            // Formularze indywidualne dla każdej daty
            ;[...this.selectedDates].sort().forEach((dateString) => {
                const dateInput = document.createElement("div");
                dateInput.className = "date-input";

                const date = new Date(dateString)
                const formattedDate = date.toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
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
        `
                container.appendChild(dateInput);
            })
        }

        const button = document.querySelector(".apply-all");
        button.textContent = this.isApplyAllClicked
            ? "Set different times for each date"
            : "Apply same time to all dates";
    }

    attachEventListeners() {
        document.getElementById("prevMonth").addEventListener("click", () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById("nextMonth").addEventListener("click", () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.querySelector(".apply-all").addEventListener("click", () => {
            this.isApplyAllClicked = !this.isApplyAllClicked;
            this.renderSelectedDates();
        });


        document.getElementById("save&create-button").addEventListener("click", async () => {
            if (isProcessing) return;

            isProcessing = true;
            try {
                const meetingName = document.getElementById("meeting-name").value.trim();
                const comment = document.getElementById("meeting-description").value.trim();

                if (!meetingName) {
                    showAlert("Meeting name cannot be empty!");
                    isProcessing = false;
                    return;
                }

                if (this.selectedDates.size === 0) {
                    showAlert("Please select at least one date.");
                    isProcessing = false;
                    return;
                }

                const isValid = await this.validateSelection();
                if (!isValid) {
                    isProcessing = false;
                    return;
                }

                const meeting = await this.createMeeting();
                if (!meeting) {
                    isProcessing = false;
                    return;
                }

                showAlert(`Meeting created successfully! Share this code with others: ${meeting.code}`);
                window.location.href = "index.html";
            } finally {
                isProcessing = false;
            }
        })

        // Obsługa zmiany w polach select – animacja ukrywania/pokazywania pola start time
        document.getElementById("selectedDatesList").addEventListener("change", (event) => {
            if (event.target.tagName === "SELECT") {
                let associatedContainer;
                if (event.target.id === "durationForAllDates") {
                    associatedContainer = document.getElementById("timeForAllDatesContainer");
                } else {
                    const date = event.target.dataset.date;
                    associatedContainer = document.getElementById(`startTimeContainer-${date}`);
                }
                if (associatedContainer) {
                    if (event.target.value === "All Day" || event.target.value === "None") {
                        associatedContainer.classList.add("hidden");
                        // Czyszczenie pola start time
                        const timeInput = associatedContainer.querySelector("input");
                        if (timeInput) timeInput.value = "";
                    } else {
                        associatedContainer.classList.remove("hidden");
                    }
                }
            }
        })
    }

    async validateSelection() {
        if (this.isApplyAllClicked) {
            const durationForAll = document.getElementById("durationForAllDates").value;
            if (!durationForAll) {
                showAlert("Please select a duration for all dates.");
                return false;
            }
            if (["1", "2", "3"].includes(durationForAll)) {
                const startTime = document.getElementById("timeForAllDates").value;
                if (!startTime) {
                    showAlert("Please select a start time when choosing a numeric duration.");
                    return false;
                }
            }
        } else {
            for (const date of this.selectedDates) {
                const durationSelect = document.getElementById(`duration-${date}`);
                if (!durationSelect || !durationSelect.value) {
                    showAlert(`Please select a duration for ${date}.`);
                    return false;
                }
                if (["1", "2", "3"].includes(durationSelect.value)) {
                    const startTimeInput = document.getElementById(`startTime-${date}`);
                    if (!startTimeInput || !startTimeInput.value) {
                        showAlert(`Please select a start time for ${date} when choosing a numeric duration.`);
                        return false;
                    }
                }
            }
        }

        return true;
    }

    async createMeeting() {
        const meetingName = document.getElementById("meeting-name").value.trim();
        const meetingDescription = document.getElementById("meeting-description").value.trim();

        if (!meetingName) {
            showAlert("Meeting name cannot be empty!");
            return null;
        }

        if (!token) {
            document.getElementById("login-overlay").style.display = "flex";
            setupLoginForm();
            isProcessing = false;
            return;
        }

        let dateRanges = [];
        if (this.isApplyAllClicked) {
            const startTime = document.getElementById("timeForAllDates").value;
            const duration = document.getElementById("durationForAllDates").value;

            dateRanges = [...this.selectedDates].map((date) => ({
                startDate: date,
                startTime: startTime || null,
                duration: duration || null,
            }));
        } else {
            dateRanges = [...this.selectedDates].map((date) => {
                const startTimeInput = document.getElementById(`startTime-${date}`);
                const durationSelect = document.getElementById(`duration-${date}`);
                return {
                    startDate: date,
                    startTime: startTimeInput ? startTimeInput.value : null,
                    duration: durationSelect ? durationSelect.value : null,
                };
            });
        }

        try {
            const response = await fetch("https://backendmeetingapp-1.onrender.com/api/meetings/create", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: meetingName,
                    comment: meetingDescription,
                    dateRanges: dateRanges,
                }),
            })

            if (response.ok) {
                const data = await response.json();
                const meetingLink = `https://backendmeetingapp-1.onrender.com/api/meetings/join/${data.code}`

                try {
                    await navigator.clipboard.writeText(meetingLink);
                } catch (clipboardError) {
                    CopyTextForIphone(meetingLink);
                }

                showNotification("Meeting created successfully! The link has been copied to your clipboard.")

                setTimeout(() => {
                    //TODO przeslac code dalej zeby odrazu przenioslo do date-chose
                    window.location.href = "index.html";
                }, 3000);

            } else {
                showAlert("Failed to create meeting.");
                return null;
            }
        } catch (error) {
            console.error("Error:", error);
            showAlert("An error occurred while creating the meeting.");
            return null;
        }
    }

    initMobileButton() {
        const desktopButton = document.getElementById("save&create-button");
        const mobileButton = document.querySelector(".mobile-footer-button");

        if (desktopButton && mobileButton) {
            mobileButton.addEventListener("click", (e) => {
                e.preventDefault();
                desktopButton.click();
            })
        }
    };
}

// Funkcja do kopiowania w Safari na telefonach bo clipboard nie dziala
function CopyTextForIphone(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
}

const calendar = new Calendar();

const logoutButton = document.querySelector(".logout-button");
logoutButton.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
})

// Logowanie
async function handleLogin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username && password) {
        try {
            const response = await fetch("https://backendmeetingapp-1.onrender.com/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            })

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.token);
                localStorage.setItem("userId", data.userId);

                document.getElementById("login-overlay").style.display = "none";

                token = data.token;

                setTimeout(() => {
                    document.getElementById("save&create-button").click();
                },3000);
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
            const response = await fetch("https://backendmeetingapp-1.onrender.com/api/auth/guest-login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ firstName, lastName }),
            })

            if (response.ok) {
                const data = await response.json()
                localStorage.setItem("token", data.token)
                localStorage.setItem("userId", data.userId)
                localStorage.setItem("isGuest", "true")

                document.getElementById("login-overlay").style.display = "none";

                token = data.token;

                setTimeout(() => {
                    document.getElementById("save&create-button").click();
                }, 500);
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

// TODO przeniesc to do osobnego js z osobnym css do wygladu do panelu pseudo logowania
function setupLoginForm() {
    const showLoginFormLink = document.getElementById("show-login-form");
    const showGuestLoginLink = document.getElementById("show-guest-login");
    const loginFormContainer = document.getElementById("login-form-container");
    const guestLoginContainer = document.getElementById("guest-login-container");
    const loginButton = document.getElementById("login-button-auth");
    const guestLoginButton = document.getElementById("login-button");
    const closeLoginOverlay = document.getElementById("close-login-overlay");
    const loginOverlay = document.getElementById("login-overlay");

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

    closeLoginOverlay.addEventListener("click", () => {
        loginOverlay.style.display = "none";
    });


    loginButton.addEventListener("click", handleLogin);
    guestLoginButton.addEventListener("click", handleGuestLogin);
}
setupLoginForm();

