(function () {
  function buildMermaidHosts() {
    const stages = Array.from(document.querySelectorAll("[data-diagram]"));
    const nodes = [];

    stages.forEach((stage) => {
      if (stage.dataset.rendered === "true") return;
      const source = stage.querySelector(".mermaid-source");
      if (!source) return;

      const host = document.createElement("div");
      host.className = "mermaid-host mermaid";
      host.textContent = source.textContent.trim();

      stage.innerHTML = "";
      stage.appendChild(host);
      stage.dataset.rendered = "true";
      nodes.push(host);
    });

    return { stages, nodes };
  }

  async function renderMermaid() {
    const stages = document.querySelectorAll("[data-diagram]");
    if (!stages.length || !window.mermaid) return;

    const mermaid = window.mermaid;
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      securityLevel: "strict",
      suppressErrorRendering: true,
      fontFamily: "\"PingFang SC\", \"Hiragino Sans GB\", \"Noto Sans CJK SC\", \"Source Han Sans SC\", sans-serif",
      themeVariables: {
        primaryColor: "#fffdf8",
        primaryTextColor: "#1d1b18",
        primaryBorderColor: "#8f3b1b",
        lineColor: "#6c655d",
        secondaryColor: "#f1eadb",
        tertiaryColor: "#f4d8c9",
        noteBkgColor: "#f7f1e7",
        noteTextColor: "#1d1b18",
        actorBorder: "#1f5d57",
        actorBkg: "#eef7f5",
        actorTextColor: "#1d1b18",
      },
    });

    const built = buildMermaidHosts();
    if (!built.nodes.length) return;

    try {
      await mermaid.run({ nodes: built.nodes });
      document.documentElement.dataset.mermaid = "ok";
    } catch (error) {
      console.warn("Mermaid render failed.", error);
      document.documentElement.dataset.mermaid = "error";
      built.stages.forEach((stage) => {
        stage.innerHTML = '<p class="diagram-error">图表渲染失败。请确认当前环境可访问 Mermaid CDN，然后刷新页面重试。</p>';
      });
    }
  }

  if (document.readyState === "complete") {
    renderMermaid();
  } else {
    window.addEventListener("load", renderMermaid);
  }
})();
