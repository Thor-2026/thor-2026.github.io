// admin/team/team.js
// PART 1 OF 3
// Wait for Parts 2 and 3 before replacing the file.

// ======================================
// THOR DISPLAY CMS
// Team Management
// ======================================

let roles = [];
let users = [];
let selectedUser = null;
let editorMode = "edit";

// ======================================
// INIT
// ======================================

async function initTeam() {

    await loadRoles();
    await loadUsers();

    bindTeamEvents();

}

// ======================================
// ROLES
// ======================================

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

    populateRoleSelect(document.getElementById("editRole"));
    populateRoleSelect(document.getElementById("newRole"));

}

function populateRoleSelect(select) {

    if (!select) return;

    select.innerHTML = `<option value="">Select role</option>`;

    roles.forEach(role => {

        select.innerHTML += `
            <option value="${role.id}">
                ${role.name}
            </option>
        `;

    });

}

// ======================================
// USERS
// ======================================

async function loadUsers() {

    const { data, error } = await supabaseClient
        .from("profiles")
        .select(`
            *,
            roles(name)
        `)
        .order("full_name");

    if (error) {

        console.error(error);
        return;

    }

    users = data || [];

    renderUsers();

}

function renderUsers() {

    const table = document.getElementById("usersTable");

    if (!table) return;

    if (!users.length) {

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

        <tr class="team-row" data-id="${user.id}">

            <td>${user.full_name || ""}</td>

            <td>${user.username || ""}</td>

            <td>${user.roles?.name || "-"}</td>

            <td>

                <span class="${user.active ? "status-active" : "status-disabled"}">

                    ${user.active ? "Active" : "Disabled"}

                </span>

            </td>

            <td>➜</td>

        </tr>

    `).join("");

}

// ======================================
// EVENTS
// ======================================

function bindTeamEvents() {

    document.addEventListener("click", handleGlobalClick);

    document.getElementById("closeEditor")
        ?.addEventListener("click", closeUserEditor);

    document.getElementById("newUserBtn")
        ?.addEventListener("click", openCreateUser);

    document.getElementById("saveUserBtn")
        ?.addEventListener("click", saveUser);

    document.getElementById("createUserBtn")
        ?.addEventListener("click", createUser);

    document.getElementById("resetPasswordBtn")
        ?.addEventListener("click", resetPassword);

}

// admin/team/team.js
// PART 2 OF 3

// ======================================
// GLOBAL CLICK
// ======================================

function handleGlobalClick(e) {

    const row = e.target.closest(".team-row");

    if (row) {

        openUser(row.dataset.id);

    }

}

// ======================================
// EDIT USER
// ======================================

function openUser(id) {

    editorMode = "edit";

    const user = users.find(x => x.id === id);

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

    document.getElementById("userEditor")
        ?.classList.add("open");

}

// ======================================
// CREATE USER DRAWER
// ======================================

function openCreateUser() {

    editorMode = "create";

    selectedUser = null;

    document.getElementById("newFullName").value = "";
    document.getElementById("newUsername").value = "";
    document.getElementById("newRole").value = "";

    document.getElementById("newUserPassword").textContent = "";

    document.getElementById("userEditor")
        ?.classList.add("open");

}

function closeUserEditor() {

    document.getElementById("userEditor")
        ?.classList.remove("open");

}

// ======================================
// SAVE USER
// ======================================

async function saveUser() {

    if (!selectedUser) return;

    const payload = {

        full_name:
            document.getElementById("editFullName").value.trim(),

        username:
            document.getElementById("editUsername").value.trim(),

        role_id:
            Number(document.getElementById("editRole").value),

        active:
            document.getElementById("editStatus").value === "true"

    };

    const { error } = await supabaseClient
        .from("profiles")
        .update(payload)
        .eq("id", selectedUser.id);

    if (error) {

        alert(error.message);

        console.error(error);

        return;

    }

    alert("User updated.");

    closeUserEditor();

    await loadUsers();

}

// ======================================
// CREATE USER (UI ONLY)
// ======================================

async function createUser() {

    const fullName =
        document.getElementById("newFullName").value.trim();

    const username =
        document.getElementById("newUsername").value.trim();

    const role =
        document.getElementById("newRole").value;

    if (!fullName || !username || !role) {

        alert("Fill all fields.");

        return;

    }

    const password =
        Math.random()
        .toString(36)
        .substring(2, 10);

    document.getElementById("newUserPassword").innerHTML =

        `Temporary Password:<br><strong>${password}</strong>`;

    alert("Edge Function will create this user later.");

}

// admin/team/team.js
// PART 3 OF 3

// ======================================
// RESET PASSWORD
// ======================================

function resetPassword() {

    if (!selectedUser) {

        alert("Select a user.");

        return;

    }

    alert(
        "Reset Password will be implemented with the Supabase Edge Function."
    );

}

// ======================================
// REFRESH HELPERS
// ======================================

async function refreshPermissionsPage() {

    if (typeof window.loadPermissionUsers === "function") {

        await window.loadPermissionUsers();

    }

}

async function refreshActivityPage() {

    if (typeof window.loadActivity === "function") {

        await window.loadActivity();

    }

}

// ======================================
// ACTIVITY LOGGER
// ======================================

async function logActivity(action, module) {

    const {

        data: {
            user
        }

    } = await supabaseClient.auth.getUser();

    if (!user) return;

    await supabaseClient

        .from("activity_log")

        .insert({

            user_id: user.id,

            action,

            module

        });

}

// ======================================
// REFRESH EVERYTHING
// ======================================

async function refreshAll() {

    await loadUsers();

    await refreshPermissionsPage();

    await refreshActivityPage();

}

// ======================================
// PUBLIC EXPORTS
// ======================================

window.initTeam = initTeam;
window.loadUsers = loadUsers;
window.refreshTeam = refreshAll;
window.logActivity = logActivity;
window.openUser = openUser;
window.closeUserEditor = closeUserEditor;
window.openCreateUser = openCreateUser;
window.saveUser = saveUser;
window.createUser = createUser;
window.resetPassword = resetPassword;
