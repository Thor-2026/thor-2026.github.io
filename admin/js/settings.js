// ======================================
// THOR DISPLAY CMS
// Settings Manager
// ======================================

async function initSettingsPage() {

    const displayTitle =
        document.getElementById("displayTitle");

    const refreshMinutes =
        document.getElementById("refreshMinutes");

    const announcementSeconds =
        document.getElementById("announcementSeconds");

    const clockFormat =
        document.getElementById("clockFormat");

    const temperatureUnit =
        document.getElementById("temperatureUnit");

    const saveButton =
        document.getElementById("saveSettings");

    const newPassword =
        document.getElementById("newPassword");

    const confirmPassword =
        document.getElementById("confirmPassword");

    const changePasswordBtn =
        document.getElementById("changePasswordBtn");

    if (!displayTitle) return;

    // ======================================
    // Load Settings
    // ======================================

    async function loadSettings() {

        const { data, error } =
            await supabaseClient

                .from("settings")

                .select("*")

                .eq("id", 1)

                .single();

        if (error) {

            console.error(error);

            return;

        }

        displayTitle.value =
            data.display_title || "SHIFT SCHEDULE";

        refreshMinutes.value =
            data.refresh_minutes;

        announcementSeconds.value =
            data.announcement_seconds;

        clockFormat.value =
            data.clock_format;

        temperatureUnit.value =
            data.temperature_unit;

    }

    // ======================================
    // Save Settings
    // ======================================

    saveButton.onclick = async () => {

        const { error } =
            await supabaseClient

                .from("settings")

                .update({

                    display_title:
                        displayTitle.value,

                    refresh_minutes:
                        Number(refreshMinutes.value),

                    announcement_seconds:
                        Number(announcementSeconds.value),

                    clock_format:
                        clockFormat.value,

                    temperature_unit:
                        temperatureUnit.value,

                    updated_at:
                        new Date().toISOString()

                })

                .eq("id", 1);

        if (error) {

            alert(error.message);

            return;

        }

        if (window.logActivity) {

            await logActivity(

                "Updated system settings",

                "settings"

            );

        }

        alert("Settings saved successfully.");

    };

    // ======================================
    // Change Password
    // ======================================

    changePasswordBtn.onclick = async () => {

        if (newPassword.value.length < 8) {

            alert("Password must be at least 8 characters.");

            return;

        }

        if (newPassword.value !== confirmPassword.value) {

            alert("Passwords do not match.");

            return;

        }

        const { error } =
            await supabaseClient.auth.updateUser({

                password:
                    newPassword.value

            });

        if (error) {

            alert(error.message);

            return;

        }

        const {

            data: {

                user

            }

        } = await supabaseClient.auth.getUser();

        await supabaseClient

            .from("profiles")

            .update({

                must_change_password: false

            })

            .eq("id", user.id);

        if (window.logActivity) {

            await logActivity(

                "Changed own password",

                "settings"

            );

        }

        newPassword.value = "";

        confirmPassword.value = "";

        alert("Password changed successfully.");

    };

    await loadSettings();

}

window.initSettingsPage = initSettingsPage;
