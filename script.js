// indexpage
// =======================
// HOME PAGE LOGIC
// =======================

// Run only if homepage
if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {

  const searchBtn = document.getElementById("search-btn")
  const viewAllBtn = document.getElementById("view-all-btn")

  // SEARCH FUNCTION
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {

      const city = document.getElementById("city").value
      const area = document.getElementById("area").value
      const subject = document.getElementById("subject").value
      const className = document.getElementById("class").value
      const board = document.getElementById("board").value
      const mode = document.getElementById("mode").value

      // Store search data
      const searchData = {
        city,
        area,
        subject,
        className,
        board,
        mode
      }

      localStorage.setItem("searchData", JSON.stringify(searchData))

      // Redirect
      window.location.href = "findTutor.html"
    })
  }

  // VIEW ALL BUTTON
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => {
      window.location.href = "findTutor.html"
    })
  }

}

// NAVBAR TOGGLE
const menuToggle = document.getElementById("menu-toggle")
const navLinks = document.getElementById("nav-links")

if(menuToggle){
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active")
  })
}