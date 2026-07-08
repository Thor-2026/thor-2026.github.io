// admin/team/activity.js
// PART 1 OF 3

// ======================================
// THOR DISPLAY CMS
// Activity Log
// ======================================

let activityRows = [];
let filteredActivityRows = [];

// ======================================
// INIT
// ======================================

async function initActivity() {

    bindActivityEvents();

    await loadActivity();

}

// ======================================
// EVENTS
// ======================================

function bindActivityEvents() {

    document
        .getElementById("refreshActivityBtn")
        ?.addEventListener(
            "click",
            loadActivity
        );

    document
        .getElementById("activitySearch")
        ?.addEventListener(
            "input",
            filterActivity
        );

}

// ======================================
// LOAD
// ======================================

async function loadActivity() {

    const { data, error } =
        await supabaseClient
            .from("activity_log")
            .select(`
                *,
                profiles!activity_log_user_id_fkey(
                    full_name,
                    username
                )
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(error);

        return;

    }

    activityRows = data || [];

    filteredActivityRows = [...activityRows];

    renderActivity();

}

// admin/team/activity.js
// PART 2 OF 3

// ======================================
// FILTER
// ======================================

function filterActivity() {

    const search =
        document
            .getElementById("activitySearch")
            .value
            .trim()
            .toLowerCase();

    if (!search) {

        filteredActivityRows = [...activityRows];

        renderActivity();

        return;

    }

    filteredActivityRows = activityRows.filter(row => {

        const user =
            row.profiles?.full_name?.toLowerCase() || "";

        const username =
            row.profiles?.username?.toLowerCase() || "";

        const module =
            (row.module || "").toLowerCase();

        const action =
            (row.action || "").toLowerCase();

        return (

            user.includes(search) ||

            username.includes(search) ||

            module.includes(search) ||

            action.includes(search)

        );

    });

    renderActivity();

}

// ======================================
// RENDER
// ======================================

function renderActivity() {

    const table =
        document.getElementById("activityTable");

    if (!table) return;

    if (!filteredActivityRows.length) {

        table.innerHTML = `

            <tr>

                <td colspan="4">

                    No activity found.

                </td>

            </tr>

        `;

        return;

    }

    table.innerHTML = filteredActivityRows.map(row => `

        <tr>

            <td>${formatDate(row.created_at)}</td>

            <td>

                ${row.profiles?.full_name || "-"}

                <br>

                <small>

                    ${row.profiles?.username || ""}

                </small>

            </td>

            <td>${capitalize(row.module)}</td>

            <td>${row.action}</td>

        </tr>

    `).join("");

}

// admin/team/activity.js
// PART 3 OF 3

// ======================================
// HELPERS
// ======================================

function formatDate(value) {

    if (!value) return "-";

    return new Date(value).toLocaleString();

}

function capitalize(text) {

    if (!text) return "-";

    return text.charAt(0).toUpperCase() +
        text.slice(1);

}

// ======================================
// REFRESH
// ======================================

async function refreshActivity() {

    await loadActivity();

}

// ======================================
// EXPORTS
// ======================================

window.initActivity = initActivity;
window.loadActivity = loadActivity;
window.refreshActivity = refreshActivity;
