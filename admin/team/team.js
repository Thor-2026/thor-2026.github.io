// ======================================
// THOR DISPLAY CMS
// Team Management
// ======================================

let roles = [];
let users = [];
let selectedUser = null;

// --------------------------------------
// Initialize
// --------------------------------------

async function initTeam() {

    await loadRoles();
    await loadUsers();

    bindTeamEvents();

}

// --------------------------------------
// Load Roles
// --------------------------------------

async function loadRoles() {

    const { data, error } = await supabaseClient
        .from("roles")
        .select("*")
        .order("id");

    if (error) {

        console.error("Roles:", error);
        return;

    }

    roles = data || [];

    populateRoleSelect(
        document.getElementById("newRole")
    );

    populateRoleSelect(
        document.getElementById("editRole")
    );

}

function populateRoleSelect(select) {

    if (!select) return;

    select.innerHTML = "";

    roles.forEach(role => {

        const option = document.createElement("option");

        option.value = role.id;
        option.textContent = role.name;

        select.appendChild(option);

    });

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
// Render Users
// --------------------------------------

function renderUsers() {

    const table = document.getElementById("usersTable");

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

        <tr
            class="team-row"
            data-id="${user.id}"
        >

            <td>${user.full_name || ""}</td>

            <td>${user.username || ""}</td>

            <td>${user.roles?.name || "-"}</td>

            <td>

                <span class="${user.active ? "status-active" : "status-disabled"}">

                    ${user.active ? "🟢 Active" : "⚪ Disabled"}

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

    document.addEventListener("click", handleDocumentClick);

    document
        .getElementById("closeEditor")
        ?.addEventListener(
            "click",
            closeUserEditor
        );

    document
        .getElementById("saveUserBtn")
        ?.addEventListener(
            "click",
            saveUser
        );

    document
        .getElementById("deleteUserBtn")
        ?.addEventListener(
            "click",
            deleteUser
        );

}

// --------------------------------------
// Global Click Handler
// --------------------------------------

function handleDocumentClick(e) {

    const row = e.target.closest(".team-row");

    if (row) {

        openUser(row.dataset.id);

        return;

    }

}

// --------------------------------------
// Open Editor
// --------------------------------------

function openUser(id) {

    const user = users.find(u => u.id === id);

    if (!user) return;

    selectedUser = user;

    document.getElementById("editFullName").value =
        user.full_name || "";

    document.getElementById("editUsername").value =
        user.username || "";

    document.getElementById("editRole").value =
        user.role_id || "";

    document.getElementById("editStatus").value =
        String(user.active);

    document
        .getElementById("userEditor")
        ?.classList.add("open");

}

// --------------------------------------
// Close Editor
// --------------------------------------

function closeUserEditor() {

    selectedUser = null;

    document
        .getElementById("userEditor")
        ?.classList.remove("open");

}

// --------------------------------------
// Save User
// --------------------------------------

async function saveUser() {

    if (!selectedUser) return;

    const full_name =
        document.getElementById("editFullName").value.trim();

    const username =
        document.getElementById("editUsername").value.trim();

    const role_id =
        Number(
            document.getElementById("editRole").value
        );

    const active =
        document.getElementById("editStatus").value === "true";

    const { error } = await supabaseClient
        .from("profiles")
        .update({

            full_name,
            username,
            role_id,
            active

        })
        .eq("id", selectedUser.id);

    if (error) {

        console.error(error);
        alert(error.message);

        return;

    }

    closeUserEditor();

    await loadUsers();

}

// --------------------------------------
// Delete User
// --------------------------------------

async function deleteUser() {

    if (!selectedUser) return;

    const confirmed = confirm(
        "Delete this user?"
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
        .from("profiles")
        .delete()
        .eq("id", selectedUser.id);

    if (error) {

        console.error(error);
        alert(error.message);

        return;

    }

    closeUserEditor();

    await loadUsers();

}
