// ======================================
// THOR DISPLAY CMS
// Activity Log
// ======================================

let activityRows = [];
let filteredRows = [];

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
// LOAD ACTIVITY
// ======================================

async function loadActivity() {

    const { data, error } =
        await supabaseClient
            .from("activity_log")
          /*  .select(`
                *,
                profiles(
                    full_name,
                    username
                )
            `)*/
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

    filteredRows = [...activityRows];

    renderActivity();

}

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

        filteredRows = [...activityRows];

        renderActivity();

        return;

    }

    filteredRows =
        activityRows.filter(row => {

            const user =
                row.profiles?.full_name || "";

            const username =
                row.profiles?.username || "";

            return (

                user.toLowerCase().includes(search)

                ||

                username.toLowerCase().includes(search)

                ||

                (row.module || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (row.action || "")
                    .toLowerCase()
                    .includes(search)

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

    if (!filteredRows.length) {

        table.innerHTML = `
            <tr>
                <td colspan="4">
                    No activity found.
                </td>
            </tr>
        `;

        return;

    }

    table.innerHTML = filteredRows.map(row => `

        <tr>

            <td>

                ${formatDate(row.created_at)}

            </td>

            <td>

                ${row.profiles?.full_name || "-"}

                <br>

                <small>

                    ${row.profiles?.username || ""}

                </small>

            </td>

            <td>

                ${capitalize(row.module || "-")}

            </td>

            <td>

                ${row.action || "-"}

            </td>

        </tr>

    `).join("");

}

// ======================================
// HELPERS
// ======================================

function formatDate(value) {

    if (!value) return "-";

    return new Date(value).toLocaleString();

}

function capitalize(text) {

    if (!text) return "";

    return text.charAt(0).toUpperCase() + text.slice(1);

}

// ======================================
// EXPORT
// ======================================

window.initActivity = initActivity;
