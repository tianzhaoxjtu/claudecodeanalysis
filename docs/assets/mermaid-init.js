(function () {
  function normalizeLabel(text) {
    return String(text || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  function createHost(stage) {
    stage.innerHTML = "";
    const host = document.createElement("div");
    host.className = "diagram-render-host";
    stage.appendChild(host);
    return host;
  }

  function createErrorBox(message) {
    const box = document.createElement("p");
    box.className = "diagram-error";
    box.textContent = message;
    return box;
  }

  function parseFlowchart(source) {
    const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
    const nodes = new Map();
    const edges = [];
    const groups = [];
    const groupMap = new Map();
    let currentGroup = "未分组";

    function ensureGroup(name) {
      if (!groupMap.has(name)) {
        const group = { name, nodes: [] };
        groupMap.set(name, group);
        groups.push(group);
      }
      return groupMap.get(name);
    }

    function ensureNode(id, label) {
      if (!nodes.has(id)) {
        nodes.set(id, {
          id,
          label: normalizeLabel(label || id),
          group: currentGroup,
        });
        ensureGroup(currentGroup).nodes.push(id);
      } else if (label && nodes.get(id).label === id) {
        nodes.get(id).label = normalizeLabel(label);
      }
      return nodes.get(id);
    }

    ensureGroup(currentGroup);

    lines.forEach((line) => {
      if (line.startsWith("flowchart")) return;
      if (line.startsWith("subgraph ")) {
        const raw = line.replace(/^subgraph\s+/, "");
        const quoted = raw.match(/\["([^"]+)"\]/);
        currentGroup = normalizeLabel(quoted ? quoted[1] : raw);
        ensureGroup(currentGroup);
        return;
      }
      if (line === "end") {
        currentGroup = "未分组";
        ensureGroup(currentGroup);
        return;
      }

      const nodePattern = /([A-Za-z0-9_]+)\["([^"]+)"\]/g;
      let nodeMatch;
      while ((nodeMatch = nodePattern.exec(line))) {
        ensureNode(nodeMatch[1], nodeMatch[2]);
      }

      const normalized = line.replace(nodePattern, "$1");
      const edgeMatch = normalized.match(/^([A-Za-z0-9_]+)\s*(?:-->|---|-.->|==>|===)\s*(?:\|([^|]+)\|\s*)?([A-Za-z0-9_]+)$/);
      if (edgeMatch) {
        const from = ensureNode(edgeMatch[1]);
        const to = ensureNode(edgeMatch[3]);
        edges.push({
          from: from.id,
          to: to.id,
          label: normalizeLabel(edgeMatch[2] || ""),
        });
      }
    });

    return { groups, nodes, edges };
  }

  function renderFlowchartFallback(source) {
    const parsed = parseFlowchart(source);
    const root = document.createElement("div");
    root.className = "diagram-fallback flowchart-fallback";

    parsed.groups
      .filter((group) => group.nodes.length)
      .forEach((group) => {
        const groupEl = document.createElement("section");
        groupEl.className = "fallback-group";

        const title = document.createElement("h5");
        title.className = "fallback-group-title";
        title.textContent = group.name;
        groupEl.appendChild(title);

        const nodeList = document.createElement("div");
        nodeList.className = "fallback-node-list";

        group.nodes.forEach((nodeId) => {
          const node = parsed.nodes.get(nodeId);
          const card = document.createElement("div");
          card.className = "fallback-node-card";
          card.textContent = node.label;
          nodeList.appendChild(card);
        });

        groupEl.appendChild(nodeList);
        root.appendChild(groupEl);
      });

    if (parsed.edges.length) {
      const edgeBlock = document.createElement("div");
      edgeBlock.className = "fallback-edge-list";

      parsed.edges.forEach((edge) => {
        const item = document.createElement("div");
        item.className = "fallback-edge-item";

        const from = document.createElement("span");
        from.className = "edge-endpoint";
        from.textContent = parsed.nodes.get(edge.from).label;

        const arrow = document.createElement("span");
        arrow.className = "edge-arrow";
        arrow.textContent = "→";

        const to = document.createElement("span");
        to.className = "edge-endpoint";
        to.textContent = parsed.nodes.get(edge.to).label;

        item.appendChild(from);
        item.appendChild(arrow);
        item.appendChild(to);

        if (edge.label) {
          const label = document.createElement("span");
          label.className = "edge-label";
          label.textContent = edge.label;
          item.appendChild(label);
        }

        edgeBlock.appendChild(item);
      });

      root.appendChild(edgeBlock);
    }

    return root;
  }

  function parseSequence(source) {
    const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
    const participants = [];
    const participantMap = new Map();
    const events = [];

    function ensureParticipant(id, label) {
      if (!participantMap.has(id)) {
        const entry = { id, label: normalizeLabel(label || id) };
        participantMap.set(id, entry);
        participants.push(entry);
      }
      return participantMap.get(id);
    }

    lines.forEach((line) => {
      if (line.startsWith("sequenceDiagram")) return;

      const participantMatch = line.match(/^participant\s+([A-Za-z0-9_]+)(?:\s+as\s+(.+))?$/);
      if (participantMatch) {
        ensureParticipant(participantMatch[1], participantMatch[2]);
        return;
      }

      const messageMatch = line.match(/^([A-Za-z0-9_]+)\s*(-{1,2}>>)\s*([A-Za-z0-9_]+):\s*(.+)$/);
      if (messageMatch) {
        ensureParticipant(messageMatch[1]);
        ensureParticipant(messageMatch[3]);
        events.push({
          type: "message",
          from: messageMatch[1],
          to: messageMatch[3],
          arrow: messageMatch[2],
          text: normalizeLabel(messageMatch[4]),
        });
        return;
      }

      const altMatch = line.match(/^alt\s+(.+)$/);
      if (altMatch) {
        events.push({ type: "note", text: "条件分支: " + normalizeLabel(altMatch[1]) });
        return;
      }

      if (line === "end") {
        events.push({ type: "note", text: "条件分支结束" });
      }
    });

    return { participants, events, participantMap };
  }

  function renderSequenceFallback(source) {
    const parsed = parseSequence(source);
    const root = document.createElement("div");
    root.className = "diagram-fallback sequence-fallback";

    const header = document.createElement("div");
    header.className = "sequence-participants";
    parsed.participants.forEach((participant) => {
      const badge = document.createElement("div");
      badge.className = "sequence-participant";
      badge.textContent = participant.label;
      header.appendChild(badge);
    });
    root.appendChild(header);

    const body = document.createElement("div");
    body.className = "sequence-events";

    parsed.events.forEach((event) => {
      const row = document.createElement("div");
      row.className = "sequence-row";

      if (event.type === "note") {
        row.classList.add("sequence-note");
        row.textContent = event.text;
        body.appendChild(row);
        return;
      }

      const from = document.createElement("span");
      from.className = "sequence-endpoint";
      from.textContent = parsed.participantMap.get(event.from).label;

      const arrow = document.createElement("span");
      arrow.className = "sequence-arrow";
      arrow.textContent = event.arrow.includes("--") ? "⇢" : "→";

      const to = document.createElement("span");
      to.className = "sequence-endpoint";
      to.textContent = parsed.participantMap.get(event.to).label;

      const text = document.createElement("span");
      text.className = "sequence-text";
      text.textContent = event.text;

      row.appendChild(from);
      row.appendChild(arrow);
      row.appendChild(to);
      row.appendChild(text);
      body.appendChild(row);
    });

    root.appendChild(body);
    return root;
  }

  function renderFallback(stage, source, reason) {
    const host = createHost(stage);
    const diagramSource = String(source || "").trim();

    let fallback;
    if (diagramSource.startsWith("sequenceDiagram")) {
      fallback = renderSequenceFallback(diagramSource);
    } else if (diagramSource.startsWith("flowchart")) {
      fallback = renderFlowchartFallback(diagramSource);
    } else {
      fallback = createErrorBox("当前图表使用了站点内置回退渲染未覆盖的语法。");
    }

    host.appendChild(fallback);
    if (reason) {
      stage.dataset.renderMode = reason;
    }
  }

  async function renderWithMermaid(stage, source, index) {
    const host = createHost(stage);
    const mermaid = window.mermaid;
    const result = await mermaid.render("cc-diagram-" + index, source);
    host.innerHTML = result.svg;
    if (typeof result.bindFunctions === "function") {
      result.bindFunctions(host);
    }
    stage.dataset.renderMode = "mermaid";
  }

  async function renderDiagram(stage, index) {
    const sourceNode = stage.querySelector(".mermaid-source");
    if (!sourceNode) return;
    const source = sourceNode.textContent.trim();

    if (window.mermaid && typeof window.mermaid.render === "function") {
      try {
        await renderWithMermaid(stage, source, index);
        return;
      } catch (error) {
        console.warn("Mermaid render failed for one diagram, falling back to local renderer.", error);
      }
    }

    renderFallback(stage, source, window.mermaid ? "fallback-after-error" : "fallback-offline");
  }

  async function renderAllDiagrams() {
    const stages = Array.from(document.querySelectorAll("[data-diagram]"));
    if (!stages.length) return;

    if (window.mermaid && typeof window.mermaid.initialize === "function") {
      window.mermaid.initialize({
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
    }

    for (let i = 0; i < stages.length; i += 1) {
      await renderDiagram(stages[i], i);
    }
  }

  if (document.readyState === "complete") {
    renderAllDiagrams();
  } else {
    window.addEventListener("load", renderAllDiagrams);
  }
})();
