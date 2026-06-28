const SUPABASE_URL = "https://ggohaurqbsyamznzuuaf.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZpHvrV-a_BmznhfbVupvxQ_b5NKYPYk";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
const fileInput = document.getElementById("scheduleFile");
const preview = document.getElementById("preview");
const uploadBtn = document.getElementById("uploadBtn");
const status = document.getElementById("status");

let selectedFile = null;

fileInput.addEventListener("change", () => {

    selectedFile = fileInput.files[0];

    if (!selectedFile) return;

    preview.src = URL.createObjectURL(selectedFile);
    preview.style.display = "block";

});

uploadBtn.addEventListener("click", async () => {

    if (!selectedFile) {
        alert("Please choose an image.");
        return;
    }

    status.innerHTML = "Uploading...";

    const { error } = await supabase.storage
        .from("display")
        .upload("schedule/current.png", selectedFile, {
            upsert: true
        });

    if (error) {

        status.innerHTML = "❌ " + error.message;
        return;

    }

    status.innerHTML = "✅ Upload Successful";

});
