> [!IMPORTANT]  
> I am continuously working on improving the application code.  
> 

# MeetMeApp

MeetMeApp ([Website](https://meetme-web-q5ol.onrender.com/)) is an app designed to simplify organizing group meetings, making it easier to find a convenient time for all participants. With it, organizing events like social gatherings or trips becomes simpler and more efficient, eliminating the need for multiple messages to coordinate the date.

Below, you'll find details about the features and technologies used in MeetMeApp.

## Features

- **Creating events**: The event creator must provide a mandatory event name and select at least one date for the meeting (the organizer can add an optional comment, but this is not required to create the event). Anyone, whether logged in or using the app as a guest, can create events. To create an event as a guest, it’s enough to provide your first and last name — no registration required. However, guests have certain limitations, which are described below.

- **Unique event links**: After an event is created, it receives a unique link that can be shared with others. People who receive this link can join the event, regardless of whether they are logged in or using the app as a guest. Guests only need to provide their first and last name to join.

- **Voting on dates**: Event participants, after receiving the link, can vote on available dates by choosing one of the options:
    - **Yes** – if they can meet on that date.
    - **If needed** – if they can meet only if necessary.

- **Guest limitations**: Users who access the app as guests have access to fewer features than registered users.
    - They cannot see the list of event participants.
    - They cannot see who and how voted on the event's available dates (e.g., who marked they can meet on a specific date).
    - They have access to their meetings list for 2 hours after voting; after that time, they will no longer be able to edit their votes or view their meetings list.

## Technologies

- **Backend**: The backend code of the app is available on GitHub: [Backend_MeetMe_App](https://github.com/gszczure/Backend_MeetMe_App)
- **Frontend**: The frontend was developed using **CSS**, **HTML**, and **JavaScript**.
- **Authentication**: **JWT (JSON Web Token)** is used for user authentication, ensuring secure session management.
- **Database**: The application uses a **PostgreSQL** database, and user passwords are **hashed** before being saved in the database to provide an additional layer of security.
- **Hosting**:
    - The backend of the application is hosted on the **Render** platform.
    - The database is hosted on the **Railway** platform.

## Performance Notice

- The application may run **slowly on first launch** because the server needs to start up. The waiting time may be up to 4 minutes during login or registration.
- After the server is up and running, the application should work faster.

## Testing and Feedback

The app is in development. Any feedback, suggestions for improvements, changes, or feature removals are welcome.

[Website](https://meetme-web-q5ol.onrender.com/)
