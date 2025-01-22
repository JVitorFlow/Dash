// Seletores
const sidebar = document.querySelector(".sidebar");
const sidebarBtn = document.querySelector(".bx-menu");
const contentSection = document.querySelector(".content-section");
const header = document.querySelector(".pc-header");

// Evento de Clique para Toggle da Sidebar
sidebarBtn.addEventListener("click", () => {
  sidebar.classList.toggle("close");
  contentSection.classList.toggle("content-section-close");
  header.classList.toggle("pc-header-close");
});

// Evento para expandir e recolher sub-menus
const arrows = document.querySelectorAll(".arrow");
arrows.forEach((arrow) => {
  arrow.addEventListener("click", (e) => {
    const arrowParent = e.target.parentElement.parentElement; // Seleciona o elemento pai do menu
    arrowParent.classList.toggle("showMenu");
  });
});
