// ======================================
// THOR DISPLAY CMS
// Change Password
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    document

        .getElementById("changePasswordBtn")

        .addEventListener("click", changePassword);

});

// ======================================
// Change Password
// ======================================

async function changePassword() {

    const newPassword =

        document

            .getElementById("newPassword")

            .value;

    const confirmPassword =

        document

            .getElementById("confirmPassword")

            .value;

    const errorBox =

        document

            .getElementById("passwordError");

    errorBox.textContent = "";

    if (newPassword.length < 8) {

        errorBox.textContent =

            "Password must be at least 8 characters.";

        return;

    }

    if (newPassword !== confirmPassword) {

        errorBox.textContent =

            "Passwords do not match.";

        return;

    }

    const {

        error

    } = await supabaseClient.auth.updateUser({

        password: newPassword

    });

    if (error) {

        errorBox.textContent = error.message;

        return;

    }

    const {

        data: {

            user

        }

    } = await supabaseClient.auth.getUser();

    const { error: profileError } = await supabaseClient

        .from("profiles")

        .update({

            must_change_password: false

        })

        .eq("id", user.id);

    if (profileError) {

        errorBox.textContent = profileError.message;

        return;

    }

    if (window.logActivity) {

        await logActivity(

            "Changed password",

            "authentication"

        );

    }

    window.location.href =

        "dashboard.html";

}
