async function loadPage(page){

    const response = await fetch(
        "../views/" + page + ".html"
    );

    const html = await response.text();

    document.getElementById("pageContent").innerHTML = html;

}

loadPage("dashboard");

document.querySelectorAll(".menu").forEach(button=>{

button.onclick=()=>{

document.querySelectorAll(".menu").forEach(m=>{

m.classList.remove("active");

});

button.classList.add("active");

loadPage(button.dataset.page);

};

});
