console.log("It's alive!");

function $$ (selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

/* 
// This provides an array of all navigation links.
let navLinks = $$("nav a");

// print host address within a string
console.log("The host address is: " + location.host);

let currentLink = navLinks.find(a => a.host === location.host && a.pathname === location.pathname)
console.log("current link is: " + currentLink);

// The chaining operator `?.` is a safe way to add the class to the current link.
currentLink?.classList.add("current");
 */

let pages = [
    {url: "", title: " Home "},
    {url: "publications/", title: " Publications "}
]

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    nav.insertAdjacentHTML("beforeend", `<a href="${ url }">${ title }</a>`);
}
