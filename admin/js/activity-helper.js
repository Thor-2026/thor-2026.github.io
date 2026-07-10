// ======================================
// THOR DISPLAY CMS
// Activity Logger
// ======================================

async function logActivity(action, module) {

    try {

        const {

            data: {

                user

            }

        } = await supabaseClient.auth.getUser();

        if (!user) return;

        const { error } = await supabaseClient

            .from("activity_log")

            .insert({

                user_id: user.id,

                module,

                action

            });

        if (error) {

            console.error("Activity Log:", error);

        }

    }

    catch (err) {

        console.error(err);

    }

}

window.logActivity = logActivity;
