async function loadPage(page) {

    try {

        const response = await fetch("views/" + page + ".html");

        if (!response.ok) {
            throw new Error("Could not load " + page);
        }

        const html = await response.text();

        document.getElementById("pageContent").innerHTML = html;

    } catch (err) {

        document.getElementById("pageContent").innerHTML =
            "<h2>Error loading page</h2><p>" + err.message + "</p>";

        console.error(err);

    }

}

loadPage("dashboard");

document.querySelectorAll(".menu").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".menu").forEach(m => m.classList.remove("active"));

        button.classList.add("active");

        //loadPage(button.dataset.page);
        loadPage(button.dataset.page).then(() => {

    if (button.dataset.page === "schedule") {

        initSchedulePage();

    }

});

    });

});

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";

    });

}
