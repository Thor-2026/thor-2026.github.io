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
let selectedUser = null;
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

    selectedUser =
        permissionUsers.find(
            x => x.id === userId
        );

    if (!selectedUser) return;

    document.getElementById(
        "selectedUserName"
    ).textContent = selectedUser.full_name;

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
