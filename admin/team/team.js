// ======================================
// THOR DISPLAY CMS
// Team Management
// team.js
// ======================================

let roles = [];
let users = [];
let selectedUser = null;

const TEAM_MODULES = [
    "dashboard",
    "schedule",
    "announcements",
    "branding",
    "weather",
    "ticker",
    "settings",
    "team"
];

// ======================================
// INIT
// ======================================

async function initTeam() {

    await loadRoles();
    await loadUsers();

    bindTabs();
    bindTeamEvents();

    if (typeof initPermissions === "function") {
        await initPermissions();
    }

    if (typeof initActivity === "function") {
        await initActivity();
    }

}

// ======================================
// LOAD ROLES
// ======================================

async function loadRoles() {

    const { data, error } = await supabaseClient
        .from("roles")
        .select("*")
        .order("id");

    if (error) {

        console.error(error);
        return;

    }

    roles = data || [];

    fillRoleSelect(document.getElementById("editRole"));
    fillRoleSelect(document.getElementById("newRole"));

}

function fillRoleSelect(select) {

    if (!select) return;

    select.innerHTML = "";

    roles.forEach(role => {

        const option = document.createElement("option");

        option.value = role.id;
        option.textContent = role.name;

        select.appendChild(option);

    });

}

// ======================================
// LOAD USERS
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

// ======================================
// RENDER USERS
// ======================================

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
            data-id="${user.id}">

            <td>${user.full_name ?? ""}</td>

            <td>${user.username ?? ""}</td>

            <td>${user.roles?.name ?? "-"}</td>

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

    document.addEventListener("click", handleTeamClick);

    document
        .getElementById("newUserBtn")
        ?.addEventListener(
            "click",
            openCreateUser
        );

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
        .getElementById("createUserBtn")
        ?.addEventListener(
            "click",
            createUser
        );

    document
        .getElementById("resetPasswordBtn")
        ?.addEventListener(
            "click",
            resetPassword
        );

}

// ======================================
// TABS
// ======================================

function bindTabs() {

    document.querySelectorAll(".tab").forEach(tab => {

        tab.addEventListener("click", () => {

            document
                .querySelectorAll(".tab")
                .forEach(t => t.classList.remove("active"));

            tab.classList.add("active");

            switchView(tab.dataset.tab);

        });

    });

}

function switchView(view) {

    document
        .querySelectorAll(".team-view")
        .forEach(section => {

            section.style.display = "none";

        });

    if (view === "users") {

        document.getElementById("usersView").style.display = "block";

    }

    if (view === "permissions") {

        document.getElementById("permissionsView").style.display = "block";

    }

    if (view === "activity") {

        document.getElementById("activityView").style.display = "block";

    }

}

// ======================================
// CLICK HANDLER
// ======================================

function handleTeamClick(e) {

    const row = e.target.closest(".team-row");

    if (!row) return;

    openUser(row.dataset.id);

}

// ======================================
// EDIT USER
// ======================================

function openUser(id) {

    selectedUser = users.find(user => user.id === id);

    if (!selectedUser) return;

    document.getElementById("editFullName").value =
        selectedUser.full_name || "";

    document.getElementById("editUsername").value =
        selectedUser.username || "";

    document.getElementById("editRole").value =
        selectedUser.role_id || "";

    document.getElementById("editStatus").value =
        String(selectedUser.active);

    document
        .getElementById("userEditor")
        .classList.add("open");

}

function closeUserEditor() {

    document
        .getElementById("userEditor")
        .classList.remove("open");

}

function openCreateUser() {

    document
        .getElementById("userEditor")
        .classList.add("open");

    document.getElementById("newFullName").value = "";
    document.getElementById("newUsername").value = "";
    document.getElementById("newEmail").value = "";
    document.getElementById("newRole").selectedIndex = 0;

    document.getElementById("newUserPassword").textContent = "";

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

    await logActivity(
        "Updated user",
        "team"
    );

    closeUserEditor();

    await loadUsers();

    if (typeof loadPermissionUsers === "function") {

        await loadPermissionUsers();

    }

}

// ======================================
// CREATE USER
// ======================================

async function createUser() {

    const full_name =
        document.getElementById("newFullName").value.trim();

    const username =
        document.getElementById("newUsername").value.trim();

    const email =
        document.getElementById("newEmail").value.trim();

    const role_id =
        Number(document.getElementById("newRole").value);

    if (!full_name || !username || !email || !role_id) {

        alert("Please complete all fields.");
        return;

    }

    const { data, error } =
        await supabaseClient.functions.invoke("create-user", {

            body: {

                email,
                full_name,
                username,
                role_id

            }

        });

    if (error) {

        console.error(error);

        alert(error.message);

        return;

    }

    document.getElementById("newUserPassword").innerHTML = `

        <strong>Temporary Password</strong><br>
        ${data.password}

    `;

    await logActivity(
        "Created user",
        "team"
    );

    document.getElementById("newFullName").value = "";
    document.getElementById("newUsername").value = "";
    document.getElementById("newEmail").value = "";
    document.getElementById("newRole").selectedIndex = 0;

    await loadUsers();

    if (typeof loadPermissionUsers === "function") {

        await loadPermissionUsers();

    }

}

// ======================================
// RESET PASSWORD
// ======================================

function resetPassword() {

    if (!selectedUser) return;

    alert(
        "Reset Password will be implemented after the Create User Edge Function."
    );

}

// ======================================
// ACTIVITY
// ======================================

async function logActivity(action, module) {

    const {
        data: { user }
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
// EXPORTS
// ======================================

window.initTeam = initTeam;
window.loadUsers = loadUsers;
window.logActivity = logActivity;
window.openUser = openUser;
window.openCreateUser = openCreateUser;
window.closeUserEditor = closeUserEditor;
window.saveUser = saveUser;
window.createUser = createUser;
window.resetPassword = resetPassword;
