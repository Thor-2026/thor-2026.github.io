function initSchedulePage() {

    const fileInput = document.getElementById("scheduleFile");

    if (!fileInput) return;

    const preview = document.getElementById("preview");

    const uploadBtn = document.getElementById("uploadBtn");

    const status = document.getElementById("status");

    const currentSchedule =
        document.getElementById("currentSchedule");

    currentSchedule.src =
        supabaseClient.storage
        .from("display")
        .getPublicUrl("schedule/current.png")
        .data.publicUrl +
        "?t=" + Date.now();

    let selectedFile = null;

    fileInput.onchange = () => {

        selectedFile = fileInput.files[0];

        preview.src =
            URL.createObjectURL(selectedFile);

        preview.style.display = "block";

    };

    uploadBtn.onclick = async () => {

        if (!selectedFile) return;

        status.innerHTML = "Uploading...";

        const { error } =
        await supabaseClient.storage

        .from("display")

        .upload(
            "schedule/current.png",
            selectedFile,
            { upsert:true }
        );

        if(error){

            status.innerHTML=error.message;

            return;

        }

        status.innerHTML="✅ Uploaded";

        currentSchedule.src=
        currentSchedule.src.split("?")[0]+
        "?t="+Date.now();

    };

}
