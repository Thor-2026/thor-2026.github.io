// admin/team/permissions.js
// PART 1 OF 3

// ======================================
// THOR DISPLAY CMS
// Permissions Management
// ======================================

const MODULES = [
    "dashboard",
    "schedule",
    "announcements",
    "branding",
    "weather",
    "ticker",
    "settings",
    "team",
    "labels",
    "activity"
];

let permissionUsers = [];
let selectedPermissionUser = null;
let permissionRows = [];

// ======================================
// INIT
// ======================================

async function initPermissions() {

    await loadPermissionUsers();

    bindPermissionEvents();

}

// ======================================
// LOAD USERS
// ======================================

async function loadPermissionUsers() {

    const { data, error } = await supabaseClient
        .from("profiles")
        .select(`
            id,
            full_name,
            username,
            active
        `)
        .eq("active", true)
        .order("full_name");

    if (error) {

        console.error(error);

        return;

    }

    permissionUsers = data || [];

    renderPermissionUsers();

}

// ======================================
// RENDER USER LIST
// ======================================

function renderPermissionUsers() {

    const container =
        document.getElementById("permissionsUserList");

    if (!container) return;

    if (!permissionUsers.length) {

        container.innerHTML = `
            <div class="empty-state">
                No users found.
            </div>
        `;

        return;

    }

    container.innerHTML = permissionUsers.map(user => `

        <div
            class="permission-user"
            data-id="${user.id}">

            <strong>${user.full_name || ""}</strong>

            <br>

            <small>${user.username || ""}</small>

        </div>

    `).join("");

}

// ======================================
// EVENTS
// ======================================

function bindPermissionEvents() {

    document.addEventListener(
        "click",
        permissionClickHandler
    );

    document
        .getElementById("savePermissionsBtn")
        ?.addEventListener(
            "click",
            savePermissions
        );

}

// admin/team/permissions.js
// PART 2 OF 3

// ======================================
// CLICK HANDLER
// ======================================

function permissionClickHandler(e) {

    const card = e.target.closest(".permission-user");

    if (!card) return;

    document
        .querySelectorAll(".permission-user")
        .forEach(x => x.classList.remove("active"));

    card.classList.add("active");

    openUserPermissions(card.dataset.id);

}

// ======================================
// LOAD USER PERMISSIONS
// ======================================

async function openUserPermissions(userId) {

    selectedPermissionUser =
        permissionUsers.find(u => u.id === userId);

    if (!selectedPermissionUser) return;

    document.getElementById(
        "selectedPermissionUserName"
    ).textContent = selectedPermissionUser.full_name;

    const { data, error } =
        await supabaseClient
            .from("permissions")
            .select("*")
            .eq("user_id", userId);

    if (error) {

        console.error(error);

        return;

    }

    permissionRows = data || [];

    renderPermissionsTable();

}

// ======================================
// TABLE
// ======================================

function renderPermissionsTable() {

    const table =
        document.getElementById("permissionsTable");

    if (!table) return;

    table.innerHTML = MODULES.map(module => {

        const row =
            permissionRows.find(
                p => p.module === module
            );

        return `

        <tr data-module="${module}">

            <td>${capitalizeModule(module)}</td>

            <td>
                <input
                    class="perm-view"
                    type="checkbox"
                    ${row?.can_view ? "checked" : ""}>
            </td>

            <td>
                <input
                    class="perm-create"
                    type="checkbox"
                    ${row?.can_create ? "checked" : ""}>
            </td>

            <td>
                <input
                    class="perm-edit"
                    type="checkbox"
                    ${row?.can_edit ? "checked" : ""}>
            </td>

            <td>
                <input
                    class="perm-delete"
                    type="checkbox"
                    ${row?.can_delete ? "checked" : ""}>
            </td>

        </tr>

        `;

    }).join("");

}

// admin/team/permissions.js
// PART 3 OF 3

// ======================================
// SAVE PERMISSIONS
// ======================================

async function savePermissions() {

    if (!selectedPermissionUser) {

        alert("Select a user first.");

        return;

    }

    const rows = document.querySelectorAll(
        "#permissionsTable tr"
    );

    for (const row of rows) {

        const module = row.dataset.module;

        const payload = {

            user_id: selectedPermissionUser.id,

            module,

            can_view:
                row.querySelector(".perm-view").checked,

            can_create:
                row.querySelector(".perm-create").checked,

            can_edit:
                row.querySelector(".perm-edit").checked,

            can_delete:
                row.querySelector(".perm-delete").checked

        };

        const existing = permissionRows.find(
            p => p.module === module
        );

        let error = null;

        if (existing) {

            ({ error } = await supabaseClient
                .from("permissions")
                .update(payload)
                .eq("id", existing.id));

        } else {

            ({ error } = await supabaseClient
                .from("permissions")
                .insert(payload));

        }

        if (error) {

            console.error(error);

            alert(error.message);

            return;

        }

    }

    await logActivity(

        `Updated permissions for ${selectedPermissionUser.username}`,

        "permissions"

    );

    alert("Permissions saved.");

    await openUserPermissions(selectedPermissionUser.id);

}

// ======================================
// HELPERS
// ======================================

function capitalizeModule(text) {

    return text.charAt(0).toUpperCase() +
        text.slice(1);

}

// ======================================
// EXPORTS
// ======================================

window.initPermissions = initPermissions;
window.loadPermissionUsers = loadPermissionUsers;
window.openUserPermissions = openUserPermissions;
window.savePermissions = savePermissions;
