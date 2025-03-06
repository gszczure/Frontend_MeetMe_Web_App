fetch("header.html")
    .then((response) => response.text())
    .then((data) => {
        document.getElementById("header-container").innerHTML = data;
        initMenu();
        checkToken();
    })
    .catch((error) => console.error("Error loading header:", error));

function initMenu() {
    document.querySelector(".hamburger-menu").addEventListener("click", function () {
        document.body.classList.add("menu-open");
    });

    document.querySelector(".overlay").addEventListener("click", function () {
        document.body.classList.remove("menu-open");
    });

    document.querySelector(".close-menu").addEventListener("click", function () {
        document.body.classList.remove("menu-open");
    });
}

function checkToken() {
    const token = localStorage.getItem("token");

    const logoutButtons = document.querySelectorAll(".logout");

    if (token) {
        logoutButtons.forEach(btn => {
            btn.style.display = "block";
            btn.addEventListener("click", logout);
        });
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
