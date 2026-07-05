// ======================================
// THOR DISPLAY CMS
// Announcements Module
// ======================================

let announcements = [];
let announcementIndex = 0;
let announcementTimer = null;

async function loadAnnouncements() {

    const settings = getSettings();

    const { data, error } = await supabaseClient
        .from("announcements")
        .select("*")
        .eq("enabled", true)
        .order("sort_order", { ascending: true });

    if (error) {

        console.error("Announcements:", error);

        return;

    }

    announcements = data || [];

    announcementIndex = 0;

    showAnnouncement();

    if (announcementTimer) {

        clearInterval(announcementTimer);

    }

    announcementTimer = setInterval(

        showAnnouncement,

        settings.announcement_seconds * 1000

    );

}

function showAnnouncement() {

    const list = document.getElementById("announcements");

    if (!list) return;

    if (announcements.length === 0) {

        list.innerHTML = `
            <li>
                <strong>No Announcements</strong><br>
                Everything is up to date.
            </li>
        `;

        return;

    }

    const item = announcements[announcementIndex];

    list.innerHTML = `
        <li>
            <strong style="font-size:22px;color:#FFD54F;">
                ${item.title}
            </strong>

            <br><br>

            <span style="font-size:18px;">
                ${item.message}
            </span>
        </li>
    `;

    announcementIndex++;

    if (announcementIndex >= announcements.length) {

        announcementIndex = 0;

    }

}

function stopAnnouncements() {

    if (announcementTimer) {

        clearInterval(announcementTimer);

        announcementTimer = null;

    }

}
