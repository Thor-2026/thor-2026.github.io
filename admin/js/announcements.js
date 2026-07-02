// ======================================
// THOR DISPLAY CMS
// Announcements Manager
// ======================================

let editingId = null;

async function initAnnouncementsPage() {

    const title = document.getElementById("title");
    const message = document.getElementById("message");
    const enabled = document.getElementById("enabled");
    const sortOrder = document.getElementById("sortOrder");

    const saveBtn = document.getElementById("saveAnnouncement");
    const cancelBtn = document.getElementById("cancelEdit");
    const list = document.getElementById("announcementList");

    if (!title || !message || !enabled || !sortOrder || !saveBtn || !list) {
        return;
    }

    async function loadAnnouncements() {

        list.innerHTML = "Loading...";

        const { data, error } = await supabaseClient
            .from("announcements")
            .select("*")
            .order("sort_order", { ascending: true });

        if (error) {

            list.innerHTML = error.message;
            return;

        }

        list.innerHTML = "";

        data.forEach(item => {

            const row = document.createElement("div");

            row.className = "announcementRow";

            row.innerHTML = `

                <div style="flex:1">

                    <strong>${item.title}</strong>

                    <br>

                    ${item.message}

                    <br><br>

                    <small>

                    Enabled:
                    ${item.enabled ? "✅ Yes" : "❌ No"}

                    |

                    Sort:
                    ${item.sort_order}

                    </small>

                </div>

                <button class="editBtn">
                    ✏ Edit
                </button>

                <button class="deleteBtn">
                    🗑 Delete
                </button>

            `;

            row.querySelector(".editBtn").onclick = () => {

                editingId = item.id;

                title.value = item.title;
                message.value = item.message;
                enabled.checked = item.enabled;
                sortOrder.value = item.sort_order;

                cancelBtn.style.display = "inline-block";

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            };

            row.querySelector(".deleteBtn").onclick = async () => {

                if (!confirm("Delete this announcement?"))
                    return;

                await supabaseClient
                    .from("announcements")
                    .delete()
                    .eq("id", item.id);

                loadAnnouncements();

            };

            list.appendChild(row);

        });

    }

    saveBtn.onclick = async () => {

        if (title.value.trim() === "" || message.value.trim() === "") {

            alert("Please enter Title and Message.");

            return;

        }

        const payload = {

            title: title.value,

            message: message.value,

            enabled: enabled.checked,

            sort_order: Number(sortOrder.value)

        };

        let error;

        if (editingId === null) {

            ({ error } = await supabaseClient
                .from("announcements")
                .insert(payload));

        } else {

            ({ error } = await supabaseClient
                .from("announcements")
                .update(payload)
                .eq("id", editingId));

        }

        if (error) {

            alert(error.message);

            return;

        }

        editingId = null;

        title.value = "";
        message.value = "";
        enabled.checked = true;
        sortOrder.value = 1;

        cancelBtn.style.display = "none";

        loadAnnouncements();

    };

    cancelBtn.onclick = () => {

        editingId = null;

        title.value = "";
        message.value = "";
        enabled.checked = true;
        sortOrder.value = 1;

        cancelBtn.style.display = "none";

    };

    loadAnnouncements();

}

