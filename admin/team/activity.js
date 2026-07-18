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

                <td colspan="5">

                    No activity found.

                </td>

            </tr>

        `;

        return;

    }

    // Clear previous rows safely
    table.innerHTML = "";

    filteredActivityRows.forEach(row => {
        const tr = document.createElement("tr");

        const logTime = formatDate(row.created_at);
        const userDisplayName = row.profiles?.full_name || row.profiles?.username || 'User';
        const hasDetails = row.module === 'labels' && row.details;

        // Base structural content columns
        tr.innerHTML = `
            <td>${logTime}</td>
            <td>
                ${row.profiles?.full_name || "-"}
                <br>
                <small>${row.profiles?.username || ""}</small>
            </td>
            <td>${capitalize(row.module)}</td>
            <td>${row.action}</td>
            <td style="text-align: right; width: 120px; white-space: nowrap;" class="action-cell">
                <!-- Button slot injected natively below to bypass inline string token issues -->
            </td>
        `;

        const cell = tr.querySelector(".action-cell");

        if (hasDetails) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn-log-details";
            btn.textContent = "🔎 Details";
            
            // SECURITY ARCHITECTURE FIX: Keep data isolated natively on the DOM element 
            // instead of string-concatenating dynamic payloads into standard onClick attributes
            btn.dataset.jsonPayload = JSON.stringify(row.details);
            btn.dataset.logAction = row.action;
            btn.dataset.logTime = logTime;
            btn.dataset.logUser = userDisplayName;

            btn.addEventListener("click", function() {
                openActivityDetailsModal(
                    this.dataset.jsonPayload,
                    this.dataset.logAction,
                    this.dataset.logTime,
                    this.dataset.logUser
                );
            });

            cell.appendChild(btn);
        } else {
            cell.innerHTML = `<span style="color: #94a3b8; font-style: italic; font-size: 12px;">Standard Log</span>`;
        }

        table.appendChild(tr);
    });

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
// DYNAMIC DETAILS VIEW POPUP HANDLER
// ======================================

window.openActivityDetailsModal = function(detailsString, action, time, user) {
    let details = {};
    try {
        details = JSON.parse(detailsString);
    } catch(e) {
        console.error("Failed to compile target metrics row string", e);
        alert("Failed to read action audit log maps.");
        return;
    }

    const title = document.getElementById("logModalActionTitle");
    const container = document.getElementById("logModalDataBody");
    if (!title || !container) return;

    title.textContent = `Label Audit Action: ${action.toUpperCase()}`;

    // Graceful extraction metrics
    const code = details.part_code || "—";
    const supplier = details.supplier || "—";
    const prevTotal = details.original_total !== undefined ? details.original_total.toLocaleString() : "—";
    const finalTotal = details.calculated_total_saved !== undefined ? details.calculated_total_saved.toLocaleString() : "—";
    const boxCount = details.full_boxes_saved !== undefined ? details.full_boxes_saved.toLocaleString() : "0";
    const looseCount = details.loose_labels_saved !== undefined ? details.loose_labels_saved.toLocaleString() : "0";
    const logNotes = details.notes || "No standard exceptions log summary captured.";

    container.innerHTML = `
        <div style="font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
            👤 User: <strong>${user}</strong> &nbsp;•&nbsp; ⏱️ Handled: <strong>${time}</strong>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 16px;">
            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #cbd5e1;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Target Part Code</div>
                <div style="font-size: 18px; font-weight: 800; color: #1e3a8a; margin-top: 2px;">${code}</div>
            </div>
            <div style="background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #cbd5e1;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Line Supplier</div>
                <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 4px;">${supplier}</div>
            </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; font-size: 14px; font-weight: 600;">
                <span style="color: #64748b;">Previous Total Balance:</span>
                <span style="color: #475569;">${prevTotal} Labels</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 14px; background: #f0f9ff; font-size: 15px; font-weight: 800; align-items: center;">
                <span style="color: #0369a1;">New Saved Balance:</span>
                <div style="text-align: right;">
                    <span style="color: #2563eb; font-size: 16px;">${finalTotal} Labels</span>
                    <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 1px;">(${boxCount} Boxes, ${looseCount} Loose)</div>
                </div>
            </div>
        </div>

        <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 6px; padding: 12px 14px;">
            <div style="font-size: 11px; font-weight: 700; color: #854d0e; text-transform: uppercase; letter-spacing:0.02em;">System Action Notes</div>
            <div style="font-size: 13px; color: #713f12; font-weight: 600; line-height: 1.4; margin-top: 4px; font-style: italic;">"${logNotes}"</div>
        </div>
    `;

    document.getElementById("logDetailsModalContainer").style.display = "block";
};

window.closeLogDetailsModal = function() {
    document.getElementById("logDetailsModalContainer").style.display = "none";
};

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
