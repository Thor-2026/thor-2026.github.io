// ======================================
// THOR DISPLAY CMS
// Team Management (Final Connected Version)
// ======================================

let roles = [];
let users = [];
let selectedUser = null;

// ======================================
// INIT
// ======================================

async function initTeam() {

    await loadRoles();
    await loadUsers();

    bindTeamEvents();
    bindTabs();

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

    populateRoleSelect(document.getElementById("newRole"));
    populateRoleSelect(document.getElementById("editRole"));

}

function populateRoleSelect(select) {

    if (!select) return;

    select.innerHTML = `<option value="">Select role</option>`;

    roles.forEach(role => {

        const option = document.createElement("option");

        option.value = role.id;
        option.textContent = role.name;

        select.appendChild(option);

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

        console.error("Users:", error);
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
                <td colspan="5">No users found</td>
            </tr>
        `;

        return;

    }

    table.innerHTML = users.map(u => `

        <tr class="team-row" data-id="${u.id}">

            <td>${u.full_name || ""}</td>
            <td>${u.username || ""}</td>
            <td>${u.roles?.name || "-"}</td>

            <td>
                <span class="${u.active ? "status-active" : "status-disabled"}">
                    ${u.active ? "Active" : "Disabled"}
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

    document.getElementById("saveUserBtn")
        ?.addEventListener("click", saveUser);

    document.getElementById("createUserBtn")
        ?.addEventListener("click", createUser);

    document.getElementById("resetPasswordBtn")
        ?.addEventListener("click", resetPassword);

}

// ======================================
// TAB SYSTEM
// ======================================

function bindTabs() {

    document.querySelectorAll(".tab").forEach(tab => {

        tab.addEventListener("click", () => {

            document.querySelectorAll(".tab")
                .forEach(t => t.classList.remove("active"));

            tab.classList.add("active");

            const target = tab.dataset.tab;

            switchView(target);

        });

    });

}

function switchView(view) {

    const views = {

        users: "usersView",
        permissions: "permissionsView",
        activity: "activityView"

    };

    Object.values(views).forEach(id => {

        const el = document.getElementById(id);

        if (el) el.style.display = "none";

    });

    const active = document.getElementById(views[view]);

    if (active) active.style.display = "block";

}

// ======================================
// CLICK HANDLER
// ======================================

function handleGlobalClick(e) {

    const row = e.target.closest(".team-row");

    if (row) {

        openUser(row.dataset.id);

    }

}

// ======================================
// USER EDITOR
// ======================================

function openUser(id) {

    const user = users.find(u => u.id === id);

    if (!user) return;

    selectedUser = user;

    document.getElementById("editFullName").value = user.full_name || "";
    document.getElementById("editUsername").value = user.username || "";
    document.getElementById("editRole").value = user.role_id || "";
    document.getElementById("editStatus").value = String(user.active);

    document.getElementById("userEditor")
        ?.classList.add("open");

}

function closeUserEditor() {

    selectedUser = null;

    document.getElementById("userEditor")
        ?.classList.remove("open");

}

// ======================================
// SAVE USER (CONNECTED)
// ======================================

async function saveUser() {

    if (!selectedUser) return;

    const payload = {

        full_name: document.getElementById("editFullName").value.trim(),
        username: document.getElementById("editUsername").value.trim(),
        role_id: Number(document.getElementById("editRole").value),
        active: document.getElementById("editStatus").value === "true"

    };

    const { error } = await supabaseClient
        .from("profiles")
        .update(payload)
        .eq("id", selectedUser.id);

    if (error) {

        console.error(error);
        alert(error.message);
        return;

    }

    closeUserEditor();
    await loadUsers();

}

// ======================================
// CREATE USER (UI ONLY)
// ======================================

async function createUser() {

    const full_name =
        document.getElementById("newFullName").value.trim();

    const username =
        document.getElementById("newUsername").value.trim();

    const role_id =
        document.getElementById("newRole").value;

    if (!full_name || !username) {

        alert("Fill required fields");
        return;

    }

    // UI ONLY (no edge function yet)
    const tempPassword = Math.random()
        .toString(36)
        .slice(-10);

    document.getElementById("newUserPassword").innerText =
        `Temp password: ${tempPassword}`;

    // Simulate adding locally (not DB yet)
    users.unshift({

        id: Date.now().toString(),
        full_name,
        username,
        role_id,
        active: true,
        roles: roles.find(r => r.id == role_id)

    });

    renderUsers();

    document.getElementById("newFullName").value = "";
    document.getElementById("newUsername").value = "";
    document.getElementById("newRole").value = "";

}

// ======================================
// RESET PASSWORD (PLACEHOLDER)
// ======================================

function resetPassword() {

    if (!selectedUser) return;

    alert("Reset password will be implemented via Edge Function later.");

}

// ======================================
// EXPORT INIT
// ======================================

window.initTeam = initTeam;
