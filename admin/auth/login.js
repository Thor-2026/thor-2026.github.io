const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

loginBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        message.innerText = "Please enter your email and password.";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerText = "Signing in...";

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        message.innerText = error.message;
        loginBtn.disabled = false;
        loginBtn.innerText = "Login";
        return;
    }

    window.location.href = "dashboard.html";

});
