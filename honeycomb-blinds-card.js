class HoneycombBlindsCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.cover_top || !config.cover_bottom) {
      throw new Error("You must define 'cover_top' and 'cover_bottom'.");
    }
    this._config = this._normalizeConfig(config);
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    this._render();
  }

  getCardSize() {
    return 3;
  }

  _t(key) {
    const lang = (this._hass && this._hass.locale && this._hass.locale.language) ||
      (this._hass && this._hass.language) || "en";
    const dict = {
      en: {
        open: "Open",
        close: "Close",
        stop: "Stop",
        topmotor: "Top motor",
        bottommotor: "Bottom motor",
        status: "Status",
        preset: "Preset",
        opening: "Opening",
        closing: "Closing",
        open_state: "Open",
        closed_state: "Closed",
        partial: "Partially open",
      },
      nl: {
        open: "Openen",
        close: "Sluiten",
        stop: "Stop",
        topmotor: "Topmotor",
        bottommotor: "Ondermotor",
        status: "Status",
        preset: "Stand",
        opening: "Bezig met openen",
        closing: "Bezig met sluiten",
        open_state: "Open",
        closed_state: "Gesloten",
        partial: "Gedeeltelijk",
      },
    };
    const table = dict[lang] || dict.en;
    return table[key] || key;
  }

  static getConfigElement() {
    return document.createElement("honeycomb-blinds-card-editor");
  }

  static getStubConfig(hass) {
    const covers = Object.keys(hass.states).filter((id) => id.startsWith("cover."));
    return {
      type: "custom:honeycomb-blinds-card",
      name: "Honeycomb Blinds",
      cover_top: covers[0] || "",
      cover_bottom: covers[1] || "",
    };
  }

  _resolveShadeColors() {
    const fallback = { base: "#b9a38b", dark: "#a89178" };
    const input = this._config && this._config.shade_color;
    if (!input) return fallback;

    if (Array.isArray(input) && input.length === 3) {
      const [r, g, b] = input.map((v) => Math.max(0, Math.min(Number(v) || 0, 255)));
      const dark = [r, g, b].map((v) => Math.max(0, Math.round(v * 0.9)));
      return {
        base: `rgb(${r}, ${g}, ${b})`,
        dark: `rgb(${dark[0]}, ${dark[1]}, ${dark[2]})`,
      };
    }

    if (typeof input === "string") {
      const hex = input.trim();
      const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
      if (m) {
        const val = m[1];
        const r = int(val.slice(0, 2));
        const g = int(val.slice(2, 4));
        const b = int(val.slice(4, 6));
        const dark = [r, g, b].map((v) => Math.max(0, Math.round(v * 0.9)));
        return {
          base: `rgb(${r}, ${g}, ${b})`,
          dark: `rgb(${dark[0]}, ${dark[1]}, ${dark[2]})`,
        };
      }
    }

    return fallback;

    function int(h) {
      return parseInt(h, 16);
    }
  }

  _render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --hc-taupe: #b9a38b;
            --hc-taupe-dark: #a89178;
            --hc-black: #111111;
            --hc-rail: 16px;
            --hc-height: 240px;
            --hc-width: 100%;
          }

          ha-card {
            overflow: hidden;
          }

          .card {
            padding: 16px;
          }

          .title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 12px;
          }

          .scene {
            position: relative;
            width: var(--hc-width);
            height: var(--hc-height);
            border-radius: 12px;
            background: #0f0f0f;
            border: 1px solid rgba(0, 0, 0, 0.4);
            overflow: hidden;
            cursor: pointer;
          }

          .window {
            position: absolute;
            inset: 12px;
            border-radius: 10px;
            border: 6px solid var(--hc-black);
            background:
              linear-gradient(160deg, rgba(116, 150, 185, 0.75) 0%, rgba(168, 195, 222, 0.55) 40%, rgba(220, 236, 248, 0.85) 100%),
              linear-gradient(0deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12));
            box-shadow: inset 0 0 34px rgba(0, 0, 0, 0.28);
            z-index: 1;
          }

          .window::before {
            content: "";
            position: absolute;
            inset: 6% 8% 50% 8%;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0));
            border-radius: 10px;
            opacity: 0.7;
          }

          .window::after {
            content: "";
            position: absolute;
            inset: 58% 10% 8% 10%;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
            border-radius: 12px;
            opacity: 0.6;
          }

          .top-box {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 18px;
            background: var(--hc-black);
            z-index: 4;
          }

          .top-rail {
            position: absolute;
            left: 8px;
            right: 8px;
            height: var(--hc-rail);
            background: var(--hc-black);
            border-radius: 8px;
            z-index: 3;
            transform: translateY(var(--top-y, 0px));
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
          }

          .bottom-rail {
            position: absolute;
            left: 8px;
            right: 8px;
            height: calc(var(--hc-rail) + 4px);
            background: var(--hc-black);
            border-radius: 10px;
            z-index: 3;
            transform: translateY(var(--bottom-y, 200px));
            box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.25);
          }

          .shade {
            position: absolute;
            left: 10px;
            right: 10px;
            top: calc(var(--top-y, 0px) + var(--hc-rail));
            height: calc(var(--bottom-y, 200px) - var(--top-y, 0px) - var(--hc-rail));
            background:
              repeating-linear-gradient(
                0deg,
                var(--hc-taupe) 0px,
                var(--hc-taupe) 8px,
                var(--hc-taupe-dark) 8px,
                var(--hc-taupe-dark) 10px
              );
            border-radius: 6px;
            z-index: 2;
            transition: height 0.2s ease, top 0.2s ease;
          }

          .status {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 12px;
            font-size: 0.9rem;
            color: var(--secondary-text-color);
          }

          .status strong {
            color: var(--primary-text-color);
          }

          .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 14px;
          }

          .button {
            position: relative;
            flex: 1 1 120px;
            padding: 10px 14px;
            border-radius: var(--ha-card-border-radius, 12px);
            border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.2));
            background: var(--ha-card-background, var(--card-background-color, #fff));
            color: var(--primary-text-color);
            font-weight: 600;
            cursor: pointer;
            overflow: hidden;
            transition: transform 0.05s ease, box-shadow 0.2s ease;
          }

          .button.selected {
            border-color: var(--primary-color);
            box-shadow: inset 0 0 0 1px var(--primary-color);
            background: var(--ha-card-background, var(--card-background-color, #fff));
          }

          .button:disabled {
            opacity: 0.55;
            cursor: default;
            pointer-events: none;
          }

          .button.selected:disabled {
            border-color: var(--primary-color);
            box-shadow: inset 0 0 0 1px var(--primary-color);
            opacity: 0.7;
          }

          .button ha-ripple {
            color: currentColor;
          }

          .button:active {
            transform: translateY(1px);
          }


          .hint {
            margin-top: 8px;
            font-size: 0.8rem;
            color: var(--secondary-text-color);
          }
        </style>
        <ha-style></ha-style>
        <ha-card>
          <div class="card">
            <div class="title" id="title"></div>
            <div class="scene" id="scene">
              <div class="window"></div>
              <div class="top-box"></div>
              <div class="top-rail"></div>
              <div class="shade"></div>
              <div class="bottom-rail"></div>
            </div>
            <div class="status">
              <div><span id="label-top">Topmotor</span>: <strong id="top-pos">-</strong></div>
              <div><span id="label-bottom">Ondermotor</span>: <strong id="bottom-pos">-</strong></div>
              <div><span id="label-status">Status</span>: <strong id="status-text">-</strong></div>
            </div>
            <div class="actions" id="actions"></div>
          </div>
        </ha-card>
      `;

      this._actionsEl = this.shadowRoot.getElementById("actions");
      this._actionsEl.addEventListener("click", (ev) => {
        const btn = ev.target.closest("button");
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === "open") {
          this._setBoth(this._config.open_top, this._config.open_bottom);
          return;
        }
        if (action === "close") {
          this._setBoth(this._config.close_top, this._config.close_bottom);
          return;
        }
        if (action === "stop") {
          this._stopBoth();
          return;
        }
        if (action === "preset") {
          const idx = Number(btn.dataset.index || -1);
          const preset = this._visiblePresets && this._visiblePresets[idx];
          if (preset) this._setBoth(preset.top, preset.bottom);
        }
      });

      this.shadowRoot.getElementById("scene").addEventListener("click", (ev) => {
        this._onSceneClick(ev);
      });
    }

    const titleEl = this.shadowRoot.getElementById("title");
    if (this._config.name) {
      titleEl.textContent = this._config.name;
      titleEl.style.display = "block";
    } else {
      titleEl.style.display = "none";
    }

    const topEntity = this._hass.states[this._config.cover_top];
    const bottomEntity = this._hass.states[this._config.cover_bottom];

    const topPos = this._getPosition(topEntity, 0);
    const bottomPos = this._getPosition(bottomEntity, 0);

    const height = 240;
    const rail = 16;
    const maxDrop = height - rail;

    let topY = (topPos / 100) * maxDrop;
    let bottomY = (1 - bottomPos / 100) * maxDrop;

    topY = Math.max(0, Math.min(topY, maxDrop));
    bottomY = Math.max(0, Math.min(bottomY, maxDrop));
    if (bottomY < topY) bottomY = topY;

    const scene = this.shadowRoot.getElementById("scene");
    const shades = this._resolveShadeColors();
    scene.style.setProperty("--top-y", `${topY}px`);
    scene.style.setProperty("--bottom-y", `${bottomY}px`);
    scene.style.setProperty("--hc-taupe", shades.base);
    scene.style.setProperty("--hc-taupe-dark", shades.dark);

    this.shadowRoot.getElementById("top-pos").textContent = `${Math.round(topPos)}%`;
    this.shadowRoot.getElementById("bottom-pos").textContent = `${Math.round(bottomPos)}%`;
    this.shadowRoot.getElementById("status-text").textContent = this._statusText(topEntity, bottomEntity, topPos, bottomPos);

    this._renderActions(topPos, bottomPos);

    this.shadowRoot.getElementById("label-top").textContent = this._t("topmotor");
    this.shadowRoot.getElementById("label-bottom").textContent = this._t("bottommotor");
    this.shadowRoot.getElementById("label-status").textContent = this._t("status");
  }

  _normalizeConfig(config) {
    const defaults = {
      name: "",
      tap_action: "nearest",
      open_top: 0,
      open_bottom: 100,
      close_top: 0,
      close_bottom: 0,
      presets: [
        { name: "Midden", top: 46, bottom: 15, enabled: true },
        { name: "Onderkant gesloten", top: 46, bottom: 0, enabled: true },
      ],
      shade_color: "#b9a38b",
    };

    const merged = {
      ...defaults,
      ...config,
    };

    merged.open_top = this._sanitizePosition(merged.open_top, defaults.open_top);
    merged.open_bottom = this._sanitizePosition(merged.open_bottom, defaults.open_bottom);
    merged.close_top = this._sanitizePosition(merged.close_top, defaults.close_top);
    merged.close_bottom = this._sanitizePosition(merged.close_bottom, defaults.close_bottom);

    const rawPresets = Array.isArray(config.presets) ? config.presets : defaults.presets;
    merged.presets = rawPresets.map((preset, idx) => this._normalizePreset(preset, defaults.presets[idx] || {}));

    return merged;
  }

  _normalizePreset(preset, fallback) {
    const base = {
      name: typeof fallback.name === "string" ? fallback.name : this._t("preset"),
      top: this._sanitizePosition(fallback.top, 0),
      bottom: this._sanitizePosition(fallback.bottom, 0),
      enabled: fallback.enabled !== false,
    };

    if (!preset || typeof preset !== "object") return { ...base };
    return {
      name: typeof preset.name === "string" ? preset.name : base.name,
      top: this._sanitizePosition(preset.top, base.top),
      bottom: this._sanitizePosition(preset.bottom, base.bottom),
      enabled: preset.enabled !== false,
    };
  }

  _sanitizePosition(value, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(0, Math.min(Math.round(num), 100));
  }

  _renderActions(currentTop, currentBottom) {
    if (!this._actionsEl) return;
    const presets = Array.isArray(this._config.presets)
      ? this._config.presets.filter((p) => p && p.enabled !== false)
      : [];
    this._visiblePresets = presets;

    const buttons = [
      {
        action: "open",
        label: this._t("open"),
        top: this._config.open_top,
        bottom: this._config.open_bottom,
      },
      { action: "stop", label: this._t("stop") },
      {
        action: "close",
        label: this._t("close"),
        top: this._config.close_top,
        bottom: this._config.close_bottom,
      },
      ...presets.map((preset, index) => ({
        action: "preset",
        label: preset.name || `${this._t("preset")} ${index + 1}`,
        index,
        top: preset.top,
        bottom: preset.bottom,
      })),
    ];

    this._actionsEl.innerHTML = buttons.map((btn) => {
      const selected = this._positionsMatch(currentTop, currentBottom, btn.top, btn.bottom);
      const indexAttr = typeof btn.index === "number" ? ` data-index="${btn.index}"` : "";
      const selectedClass = selected ? " selected" : "";
      const ariaPressed = selected ? "true" : "false";
      const disabledAttr = selected ? " disabled aria-disabled=\"true\"" : "";
      return `<button type="button" class="button${selectedClass}" data-action="${btn.action}" aria-pressed="${ariaPressed}"${disabledAttr}${indexAttr}>${btn.label}<ha-ripple aria-hidden="true"></ha-ripple></button>`;
    }).join("");
  }

  _positionsMatch(currentTop, currentBottom, targetTop, targetBottom) {
    if (typeof targetTop !== "number" || typeof targetBottom !== "number") return false;
    return this._sanitizePosition(currentTop, -1) === this._sanitizePosition(targetTop, -2) &&
      this._sanitizePosition(currentBottom, -1) === this._sanitizePosition(targetBottom, -2);
  }

  _getPosition(entity, fallback) {
    if (!entity) return fallback;
    const pos = entity.attributes && typeof entity.attributes.current_position === "number"
      ? entity.attributes.current_position
      : null;

    if (typeof pos === "number") return Math.max(0, Math.min(pos, 100));
    if (entity.state === "open") return 100;
    if (entity.state === "closed") return 0;
    return fallback;
  }

  _statusText(topEntity, bottomEntity, topPos, bottomPos) {
    if (!topEntity || !bottomEntity) return "-";
    if (topEntity.state === "opening" || bottomEntity.state === "opening") return this._t("opening");
    if (topEntity.state === "closing" || bottomEntity.state === "closing") return this._t("closing");

    const top = typeof topPos === "number" ? topPos : 0;
    const bottom = typeof bottomPos === "number" ? bottomPos : 0;
    const open = top <= 1 && bottom >= 99;
    const closed = top <= 1 && bottom <= 1;

    if (open) return this._t("open_state");
    if (closed) return this._t("closed_state");
    return this._t("partial");
  }

  _onSceneClick(ev) {
    const rect = ev.currentTarget.getBoundingClientRect();
    const y = Math.max(0, Math.min(ev.clientY - rect.top, rect.height));
    const height = 240;
    const rail = 16;
    const maxDrop = height - rail;

    const tapAction = this._config.tap_action || "nearest";

    if (tapAction === "top") {
      const topPos = (y / maxDrop) * 100;
      this._setTop(topPos);
      return;
    }

    if (tapAction === "bottom") {
      const bottomPos = (1 - y / maxDrop) * 100;
      this._setBottom(bottomPos);
      return;
    }

    const topEntity = this._hass.states[this._config.cover_top];
    const bottomEntity = this._hass.states[this._config.cover_bottom];
    const currentTop = this._getPosition(topEntity, 0);
    const currentBottom = this._getPosition(bottomEntity, 0);

    const topY = (currentTop / 100) * maxDrop;
    const bottomY = (1 - currentBottom / 100) * maxDrop;

    const distTop = Math.abs(y - topY);
    const distBottom = Math.abs(y - bottomY);

    if (distTop <= distBottom) {
      const topPos = (y / maxDrop) * 100;
      this._setTop(topPos);
    } else {
      const bottomPos = (1 - y / maxDrop) * 100;
      this._setBottom(bottomPos);
    }
  }

  _setTop(position) {
    const pos = Math.max(0, Math.min(Math.round(position), 100));
    this._hass.callService("cover", "set_cover_position", {
      entity_id: this._config.cover_top,
      position: pos,
    });
  }

  _setBottom(position) {
    const pos = Math.max(0, Math.min(Math.round(position), 100));
    this._hass.callService("cover", "set_cover_position", {
      entity_id: this._config.cover_bottom,
      position: pos,
    });
  }

  _setBoth(topPos, bottomPos) {
    this._setTop(topPos);
    this._setBottom(bottomPos);
  }

  _stopBoth() {
    this._hass.callService("cover", "stop_cover", {
      entity_id: this._config.cover_top,
    });
    this._hass.callService("cover", "stop_cover", {
      entity_id: this._config.cover_bottom,
    });
  }
}

customElements.define("honeycomb-blinds-card", HoneycombBlindsCard);


class HoneycombBlindsCardEditor extends HTMLElement {
  _t(key) {
    const lang = (this._hass && this._hass.locale && this._hass.locale.language) ||
      (this._hass && this._hass.language) || "en";
    const dict = {
      en: {
        name: "Name",
        top_motor: "Top motor",
        bottom_motor: "Bottom motor",
        shade_color: "Shade color",
        open_position: "Open position",
        close_position: "Close position",
        presets: "Extra presets",
        positions: "Positions",
        add_preset: "Add preset",
        new_preset: "New preset",
        top: "Top",
        bottom: "Bottom",
        remove: "Remove",
        preset: "Preset",
      },
      nl: {
        name: "Naam",
        top_motor: "Bovenste motor",
        bottom_motor: "Onderste motor",
        shade_color: "Kleur gordijn",
        open_position: "Openen positie",
        close_position: "Sluiten positie",
        presets: "Extra standen",
        positions: "Posities",
        add_preset: "Stand toevoegen",
        new_preset: "Nieuwe stand",
        top: "Boven",
        bottom: "Onder",
        remove: "Verwijder",
        preset: "Stand",
      },
    };
    const table = dict[lang] || dict.en;
    return table[key] || key;
  }

  setConfig(config) {
    this._config = {
      name: "",
      open_top: 0,
      open_bottom: 100,
      close_top: 0,
      close_bottom: 0,
      presets: [
        { name: "Midden", top: 46, bottom: 15, enabled: true },
        { name: "Onderkant gesloten", top: 46, bottom: 0, enabled: true },
      ],
      shade_color: "#b9a38b",
      ...config,
    };
    if (!Array.isArray(this._config.presets)) this._config.presets = [];
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _formSchema() {
    return [
      { name: "name", label: this._t("name"), selector: { text: {} } },
      { name: "cover_top", label: this._t("top_motor"), selector: { entity: { domain: "cover" } } },
      { name: "cover_bottom", label: this._t("bottom_motor"), selector: { entity: { domain: "cover" } } },
      { name: "shade_color", label: this._t("shade_color"), selector: { color_rgb: {} } },
    ];
  }

  _toColorArray(value) {
    if (Array.isArray(value) && value.length === 3) return value;
    if (typeof value === "string") {
      const m = /^#?([0-9a-fA-F]{6})$/.exec(value.trim());
      if (m) {
        const v = m[1];
        const r = parseInt(v.slice(0, 2), 16);
        const g = parseInt(v.slice(2, 4), 16);
        const b = parseInt(v.slice(4, 6), 16);
        return [r, g, b];
      }
    }
    return [185, 163, 139];
  }

  _formData() {
    return {
      name: this._config.name || "",
      cover_top: this._config.cover_top || "",
      cover_bottom: this._config.cover_bottom || "",
      shade_color: this._toColorArray(this._config.shade_color || "#b9a38b"),
    };
  }

  _resolveShadeColors() {
    const fallback = { base: "#b9a38b", dark: "#a89178" };
    const input = this._config && this._config.shade_color;
    if (!input) return fallback;

    if (Array.isArray(input) && input.length === 3) {
      const [r, g, b] = input.map((v) => Math.max(0, Math.min(Number(v) || 0, 255)));
      const dark = [r, g, b].map((v) => Math.max(0, Math.round(v * 0.9)));
      return {
        base: `rgb(${r}, ${g}, ${b})`,
        dark: `rgb(${dark[0]}, ${dark[1]}, ${dark[2]})`,
      };
    }

    if (typeof input === "string") {
      const hex = input.trim();
      const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
      if (m) {
        const val = m[1];
        const r = int(val.slice(0, 2));
        const g = int(val.slice(2, 4));
        const b = int(val.slice(4, 6));
        const dark = [r, g, b].map((v) => Math.max(0, Math.round(v * 0.9)));
        return {
          base: `rgb(${r}, ${g}, ${b})`,
          dark: `rgb(${dark[0]}, ${dark[1]}, ${dark[2]})`,
        };
      }
    }

    return fallback;

    function int(h) {
      return parseInt(h, 16);
    }
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          .form {
            display: grid;
            gap: 12px;
          }
          .row {
            display: grid;
            gap: 6px;
          }
          .split {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          label {
            font-size: 0.9rem;
            color: var(--secondary-text-color);
          }
          ha-form, ha-textfield {
            width: 100%;
          }
          .preset {
            display: grid;
            grid-template-columns: 1.5fr 0.8fr 0.8fr auto;
            gap: 8px;
            align-items: center;
          }
          .mini {
            padding: 6px 10px;
            border-radius: var(--ha-card-border-radius, 12px);
            border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.2));
            background: var(--card-background-color, #fff);
            cursor: pointer;
          }
        </style>
        <div class="form">
          <ha-form id="ha-form"></ha-form>
          <div class="row">
            <label id="label-positions">Posities</label>
            <div class="split">
              <ha-textfield id="open_top" type="number" min="0" max="100" label=""></ha-textfield>
              <ha-textfield id="close_top" type="number" min="0" max="100" label=""></ha-textfield>
            </div>
            <div class="split">
              <ha-textfield id="open_bottom" type="number" min="0" max="100" label=""></ha-textfield>
              <ha-textfield id="close_bottom" type="number" min="0" max="100" label=""></ha-textfield>
            </div>
          </div>
          <div class="row">
            <label id="label-presets">Extra presets</label>
            <div id="presets"></div>
            <button id="add-preset" class="mini" type="button"></button>
          </div>
        </div>
      `;

      this.shadowRoot.getElementById("ha-form").addEventListener("value-changed", (e) => {
        this._updateConfig(e.detail.value);
      });

      this.shadowRoot.getElementById("open_top").addEventListener("input", (e) => {
        this._updateConfig({ open_top: Number(e.target.value) });
      });
      this.shadowRoot.getElementById("close_top").addEventListener("input", (e) => {
        this._updateConfig({ close_top: Number(e.target.value) });
      });
      this.shadowRoot.getElementById("open_bottom").addEventListener("input", (e) => {
        this._updateConfig({ open_bottom: Number(e.target.value) });
      });
      this.shadowRoot.getElementById("close_bottom").addEventListener("input", (e) => {
        this._updateConfig({ close_bottom: Number(e.target.value) });
      });

      this.shadowRoot.getElementById("add-preset").addEventListener("click", () => {
        const presets = Array.isArray(this._config.presets) ? [...this._config.presets] : [];
        presets.push({ name: this._t("new_preset"), top: 0, bottom: 0, enabled: true });
        this._updateConfig({ presets });
      });
    }

    const form = this.shadowRoot.getElementById("ha-form");
    form.hass = this._hass;
    form.computeLabel = (schema) => schema.label || schema.name;
    form.schema = this._formSchema();
    form.data = this._formData();

    this.shadowRoot.getElementById("open_top").value = this._config.open_top ?? 0;
    this.shadowRoot.getElementById("close_top").value = this._config.close_top ?? 0;
    this.shadowRoot.getElementById("open_bottom").value = this._config.open_bottom ?? 0;
    this.shadowRoot.getElementById("close_bottom").value = this._config.close_bottom ?? 0;

    this.shadowRoot.getElementById("open_top").label = `${this._t("open_position")} (${this._t("top")})`;
    this.shadowRoot.getElementById("close_top").label = `${this._t("close_position")} (${this._t("top")})`;
    this.shadowRoot.getElementById("open_bottom").label = `${this._t("open_position")} (${this._t("bottom")})`;
    this.shadowRoot.getElementById("close_bottom").label = `${this._t("close_position")} (${this._t("bottom")})`;

    this.shadowRoot.getElementById("label-positions").textContent = this._t("positions");
    this.shadowRoot.getElementById("label-presets").textContent = this._t("presets");
    this.shadowRoot.getElementById("add-preset").textContent = this._t("add_preset");

    this._renderPresets();
  }

  _renderPresets() {
    const container = this.shadowRoot.getElementById("presets");
    if (!container) return;
    container.innerHTML = "";
    const presets = Array.isArray(this._config.presets) ? this._config.presets : [];

    presets.forEach((preset, index) => {
      const row = document.createElement("div");
      row.className = "preset";

      const name = document.createElement("ha-textfield");
      name.value = preset.name || this._t("preset");
      name.label = this._t("name");
      name.addEventListener("input", (e) => {
        const next = [...presets];
        next[index] = { ...next[index], name: e.target.value };
        this._updateConfig({ presets: next });
      });

      const top = document.createElement("ha-textfield");
      top.type = "number";
      top.min = "0";
      top.max = "100";
      top.value = preset.top ?? 0;
      top.label = this._t("top");
      top.addEventListener("input", (e) => {
        const next = [...presets];
        next[index] = { ...next[index], top: Number(e.target.value) };
        this._updateConfig({ presets: next });
      });

      const bottom = document.createElement("ha-textfield");
      bottom.type = "number";
      bottom.min = "0";
      bottom.max = "100";
      bottom.value = preset.bottom ?? 0;
      bottom.label = this._t("bottom");
      bottom.addEventListener("input", (e) => {
        const next = [...presets];
        next[index] = { ...next[index], bottom: Number(e.target.value) };
        this._updateConfig({ presets: next });
      });

      const remove = document.createElement("button");
      remove.className = "mini";
      remove.type = "button";
      remove.textContent = this._t("remove");
      remove.addEventListener("click", () => {
        const next = [...presets];
        next.splice(index, 1);
        this._updateConfig({ presets: next });
      });

      row.appendChild(name);
      row.appendChild(top);
      row.appendChild(bottom);
      row.appendChild(remove);
      container.appendChild(row);
    });
  }

  _updateConfig(changes) {
    this._config = { ...this._config, ...changes };
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define("honeycomb-blinds-card-editor", HoneycombBlindsCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "honeycomb-blinds-card",
  name: "Honeycomb Blinds Card",
  description: "Control a two-motor honeycomb blinds (top + bottom).",
});
