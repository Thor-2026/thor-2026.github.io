// ======================================
// THOR DISPLAY CMS
// Team Management
// ======================================

let users = [];

// --------------------------------------
// Initialize
// --------------------------------------

async function initTeam() {

    await loadUsers();

    bindTeamEvents();

}

// --------------------------------------
// Load Users
// --------------------------------------

async function loadUsers() {

    const { data, error } = await supabaseClient
        .from("profiles")
        .select(`
            *,
            roles(name)
        `)
        .order("full_name");

    if (error) {

        console.error("Users:", error);

        return;

    }

    users = data || [];

    renderUsers();

}

// --------------------------------------
// Render Table
// --------------------------------------

function renderUsers() {

    const table =
        document.getElementById("usersTable");

    if (!table) return;

    if (users.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No users found.
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML = users.map(user => `

        <tr class="team-row"
            data-id="${user.id}">

            <td>${user.full_name ?? ""}</td>

            <td>${user.username}</td>

            <td>${user.roles?.name ?? "-"}</td>

            <td>

                <span class="${
                    user.active
                    ? "status-active"
                    : "status-disabled"
                }">

                    ${
                        user.active
                        ? "🟢 Active"
                        : "⚪ Disabled"
                    }

                </span>

            </td>

            <td>

                ➜

            </td>

        </tr>

    `).join("");

}

// --------------------------------------
// Events
// --------------------------------------

function bindTeamEvents() {

    document.addEventListener("click", e => {

        const row =
            e.target.closest(".team-row");

        if (!row) return;

        const id = row.dataset.id;

        openUser(id);

    document
.getElementById("closeEditor")
?.addEventListener(

"click",

closeUserEditor

);

    });

}

// --------------------------------------
// User Editor
// --------------------------------------

function openUser(id) {

    const user =
        users.find(x => x.id === id);

    if (!user) return;

    document
        .getElementById("editFullName")
        .value = user.full_name || "";

    document
        .getElementById("editUsername")
        .value = user.username || "";

    document
        .getElementById("editStatus")
        .value = user.active;

    document
        .getElementById("userEditor")
        .classList.add("open");

}

function closeUserEditor(){

    document
        .getElementById("userEditor")
        .classList.remove("open");

}
