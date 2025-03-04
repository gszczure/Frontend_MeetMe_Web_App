let notificationTimeout

function initializeNotification() {
    const notification = document.getElementById("notification")
    const notificationMessage = document.getElementById("notification-message")
    const notificationClose = document.getElementById("notification-close")

    if (!notification || !notificationMessage || !notificationClose) {
        console.error("Notification elements not found. Make sure they are present in the DOM.")
        return
    }

    window.showNotification = (message, duration = 3000, type = "success") => {
        clearTimeout(notificationTimeout)

        notificationMessage.textContent = message

        notification.classList.remove("alert")

        if (type === "alert") {
            notification.classList.add("alert")
        }

        notification.classList.add("show")

        notificationTimeout = setTimeout(() => {
            notification.classList.remove("show")
        }, duration)
    }

    window.showAlert = (message, duration = 4000) => {
        window.showNotification(message, duration, "alert")
    }

    notificationClose.addEventListener("click", () => {
        notification.classList.remove("show")
    })
}

initializeNotification();

