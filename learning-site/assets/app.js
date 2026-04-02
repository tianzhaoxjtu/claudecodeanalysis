(function () {
  const currentPage = document.body.dataset.page;
  document.querySelectorAll(".topnav a").forEach((link) => {
    if (link.dataset.page === currentPage) {
      link.classList.add("active");
    }
  });

  const toc = document.getElementById("toc");
  if (toc) {
    const headings = Array.from(document.querySelectorAll("main h2, main h3"));
    if (headings.length) {
      const ul = document.createElement("ul");
      headings.forEach((heading) => {
        if (!heading.id) return;
        const li = document.createElement("li");
        if (heading.tagName === "H3") {
          li.style.marginLeft = "0.7rem";
        }
        const a = document.createElement("a");
        a.href = "#" + heading.id;
        a.textContent = heading.textContent;
        li.appendChild(a);
        ul.appendChild(li);
      });
      toc.appendChild(ul);
    }
  }

  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  if (!input || !results || !window.SEARCH_INDEX) return;

  const renderResults = (items) => {
    results.innerHTML = "";
    if (!items.length) {
      results.style.display = "none";
      return;
    }
    items.slice(0, 6).forEach((item) => {
      const a = document.createElement("a");
      a.href = item.url;
      a.innerHTML = "<strong>" + item.title + "</strong><br><span>" + item.keywords.join(" / ") + "</span>";
      results.appendChild(a);
    });
    results.style.display = "block";
  };

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      renderResults([]);
      return;
    }
    const matches = window.SEARCH_INDEX.filter((item) => {
      return item.title.toLowerCase().includes(query) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(query));
    });
    renderResults(matches);
  });

  document.addEventListener("click", (event) => {
    const withinSearch = event.target.closest(".search-box");
    if (!withinSearch) {
      results.style.display = "none";
    }
  });
})();
