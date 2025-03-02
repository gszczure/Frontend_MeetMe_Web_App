let notificationTimeout;

function initializeNotification() {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const notificationClose = document.getElementById('notification-close');

    if (!notification || !notificationMessage || !notificationClose) {
        console.error('Notification elements not found. Make sure they are present in the DOM.');
        return;
    }

    window.showNotification = function(message, duration = 3000) {
        clearTimeout(notificationTimeout);

        notificationMessage.textContent = message;
        notification.classList.add('show');

        notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    };

    notificationClose.addEventListener('click', () => {
        notification.classList.remove('show');
    });
}

// Wywołaj inicjalizację po załadowaniu DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNotification);
} else {
    initializeNotification();
}