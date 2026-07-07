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
    "team"
];

let permissionUsers = [];
let selectedPermissionUser = null;
let permissionRows = [];

// ======================================
// INIT
// ======================================

async function initPermissions() {

    await loadUsers();

    bindPermissionEvents();

}

// ======================================
// LOAD USERS
// ======================================

async function loadUsers() {

    const { data, error } = await supabaseClient
        .from("profiles")
        .select(`
            id,
            full_name,
            username
        `)
        .order("full_name");

    if (error) {

        console.error(error);
        return;

    }

    permissionUsers = data || [];

    renderUserList();

}

// ======================================
// USER LIST
// ======================================

function renderUserList() {

    const list =
        document.getElementById("permissionsUserList");

    if (!list) return;

    list.innerHTML = permissionUsers.map(user => `

        <div
            class="permission-user"
            data-id="${user.id}">

            <strong>

                ${user.full_name || ""}

            </strong>

            <br>

            <small>

                ${user.username}

            </small>

        </div>

    `).join("");

}

// ======================================
// EVENTS
// ======================================

function bindPermissionEvents() {

    document.addEventListener("click", handlePermissionClick);

    document
        .getElementById("savePermissionsBtn")
        ?.addEventListener(
            "click",
            savePermissions
        );

}

// ======================================
// CLICK
// ======================================

function handlePermissionClick(e) {

    const card =
        e.target.closest(".permission-user");

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
        permissionUsers.find(
            x => x.id === userId
        );

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
// RENDER PERMISSIONS TABLE
// ======================================

function renderPermissionsTable() {

    const table =
        document.getElementById("permissionsTable");

    if (!table) return;

    table.innerHTML = MODULES.map(module => {

        const permission =
            permissionRows.find(
                p => p.module === module
            );

        return `

            <tr data-module="${module}">

                <td>

                    ${capitalize(module)}

                </td>

                <td>

                    <input
                        type="checkbox"
                        class="perm-view"
                        ${permission?.can_view ? "checked" : ""}>

                </td>

                <td>

                    <input
                        type="checkbox"
                        class="perm-create"
                        ${permission?.can_create ? "checked" : ""}>

                </td>

                <td>

                    <input
                        type="checkbox"
                        class="perm-edit"
                        ${permission?.can_edit ? "checked" : ""}>

                </td>

                <td>

                    <input
                        type="checkbox"
                        class="perm-delete"
                        ${permission?.can_delete ? "checked" : ""}>

                </td>

            </tr>

        `;

    }).join("");

}

// ======================================
// SAVE
// ======================================

async function savePermissions() {

    if (!selectedPermissionUser) {

        alert("Select a user first.");

        return;

    }

    const rows =
        document.querySelectorAll(
            "#permissionsTable tr"
        );

    for (const row of rows) {

        const module =
            row.dataset.module;

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

        const existing =
            permissionRows.find(
                p => p.module === module
            );

        if (existing) {

            const { error } =
                await supabaseClient
                    .from("permissions")
                    .update(payload)
                    .eq("id", existing.id);

            if (error) {

                console.error(error);

            }

        } else {

            const { error } =
                await supabaseClient
                    .from("permissions")
                    .insert(payload);

            if (error) {

                console.error(error);

            }

        }

    }

    alert("Permissions saved.");

    await openUserPermissions(selectedPermissionUser.id);

}

// ======================================
// HELPERS
// ======================================

function capitalize(text) {

    return text
        .charAt(0)
        .toUpperCase() +
        text.slice(1);

}

// ======================================
// EXPORT
// ======================================

window.initPermissions =
    initPermissions;
