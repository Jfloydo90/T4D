// actor.mjs (This is the T4DActor class, the one that extends Actor, NOT the sheet class)

export class T4DActor extends Actor {
  prepareData() {
    super.prepareData();
    const system = this.system ?? {};

    console.log("==== T4DActor prepareData ====");
    console.log("System (at start of prepareData):", system); // Log the whole system object

    // === BIO ATTRIBUTES ===
    system.attributes ??= {};

    // BIO Primary Attributes
    system.attributes.primary ??= {};
    const bioPrimaryKeys = ["STR", "DEX", "CON", "INT", "FOC", "CHA"];
    for (const attr of bioPrimaryKeys) {
      system.attributes.primary[attr] = foundry.utils.mergeObject(
        {
          label: attr,
          score: 1,
          mod: 0,
          temp: 0,
          apToNext: 0,
          apTotal: 1,
        },
        system.attributes.primary?.[attr] ?? {},
        { overwrite: false }
      );
    }

    // BIO Secondary Attributes
    system.attributes.secondary ??= {};
    const bioSecondaryKeys = ["INIT", "EDU", "SPD", "MVMT"];
    for (const attr of bioSecondaryKeys) {
      system.attributes.secondary[attr] = foundry.utils.mergeObject(
        {
          label: attr,
          score: 0,
          mod: 0,
          temp: 0,
        },
        system.attributes.secondary?.[attr] ?? {},
        { overwrite: false }
      );
    }

    const appearance = (system.attributes.appearance ??= {});

    // If no value, default to 3
    let rawAppearanceScore = appearance.score ?? 3;

    // Parse to integer
    rawAppearanceScore = parseInt(rawAppearanceScore) || 3;

    // Clamp between 3 and 30
    appearance.score = Math.max(3, Math.min(rawAppearanceScore, 30));

    // Lookup description
    const appIndex = Math.min(
      Math.max(0, appearance.score - 3),
      (this.constructor.HumanAppTable?.length ?? 1) - 1
    );
    appearance.desc = this.constructor.HumanAppTable?.[appIndex] || "Unknown";

    // === AI ATTRIBUTES ===
    system.attributesAI ??= {};

    // AI Primary Attributes
    system.attributesAI.primary ??= {};
    const aiPrimaryKeys = ["PRC", "SEN", "ARC", "LOG", "COR", "SOCIAL"];
    for (const attr of aiPrimaryKeys) {
      system.attributesAI.primary[attr] = foundry.utils.mergeObject(
        {
          label: attr,
          score: 10,
          mod: 0,
          apToNext: 0,
          apTotal: 0,
          temp: 0,
        },
        system.attributesAI.primary?.[attr] ?? {},
        { overwrite: false }
      );
    }

    // AI Secondary Attributes
    system.attributesAI.secondary ??= {};
    const aiSecondaryKeys = ["QUEUE", "LEARNING", "CYCLES", "LATENCY"];
    for (const attr of aiSecondaryKeys) {
      system.attributesAI.secondary[attr] = foundry.utils.mergeObject(
        {
          label: attr,
          score: 0,
          mod: 0,
          temp: 0,
        },
        system.attributesAI.secondary?.[attr] ?? {},
        { overwrite: false }
      );
    }

    // AI Likeness
    const like = (system.attributesAI.secondary.LIKE ??= {});

    // If no score, default to 3
    let rawLikeScore = like.score ?? 3;

    // Parse and clamp
    rawLikeScore = parseInt(rawLikeScore) || 3;
    like.score = Math.max(3, Math.min(rawLikeScore, 30));

    // Description
    const likeIndex = Math.min(
      Math.max(0, like.score - 3),
      (this.constructor.LikeTable?.length ?? 1) - 1
    );
    like.desc = this.constructor.LikeTable?.[likeIndex] || "Unknown";

    // === Compute BIO AP thresholds ===
    const statToAPT = {
      STR: "STRAPT",
      DEX: "DEXAPT",
      CON: "CONAPT",
      INT: "INTAPT",
      FOC: "FOCAPT",
      CHA: "CHAAPT",
    };

    for (const [stat, field] of Object.entries(statToAPT)) {
      const val =
        parseInt(system.attributes.primary?.[stat]?.score ?? "1") || 1;
      system.attributes.primary[field] =
        this.constructor.ApTable?.[Math.max(0, val - 1)] ?? "1";
    }

    // === Compute Bio Modifiers and AP to Next ===
    const bioStats = ["STR", "DEX", "CON", "INT", "FOC", "CHA"];
    for (const stat of bioStats) {
      let rawScore = system.attributes.primary?.[stat]?.score ?? "1";
      let rawTemp = system.attributes.primary?.[stat]?.temp ?? "0";

      const score = parseInt(rawScore) || 1;
      const temp = parseInt(rawTemp) || 0;
      const mod = Math.floor(score / 5) - 2 + temp;

      const data = system.attributes.primary[stat];
      data.mod = mod;
      data.apToNext = mod + 3;

      system.attributes.primary[`${stat}Mod`] = mod;
      system.attributes.primary[`${stat}APN`] = mod + 3;
    }

    // === Compute AI Modifiers and AP to Next ===
    const aiStats = ["PRC", "SEN", "ARC", "LOG", "COR", "SOCIAL"];
    for (const stat of aiStats) {
      const rawScore = system.attributesAI.primary?.[stat]?.score ?? "1";
      const rawTemp = system.attributesAI.primary?.[stat]?.temp ?? "0";

      const score = parseInt(rawScore) || 1;
      const temp = parseInt(rawTemp) || 0;

      const mod = Math.floor(score / 5) - 2 + temp;

      const data = system.attributesAI.primary[stat];
      data.mod = mod;
      data.apToNext = mod + 3;

      system.attributesAI.primary[`${stat}Mod`] = mod;
      system.attributesAI.primary[`${stat}APN`] = mod + 3;
    }

    // === Compute BIO Gear Weight Totals ===
    system.gear ??= {};

    const itemArray = Array.isArray(system.items) ? system.items : [];
    const weaponArray = Array.isArray(system.weapons) ? system.weapons : [];
    const armorArray = Array.isArray(system.armor) ? system.armor : [];

    system.gear.itemTotal = items.reduce(
      (sum, i) => sum + (parseFloat(i.weight) || 0),
      0
    );
    system.gear.weaponTotal = weapons.reduce(
      (sum, w) => sum + (parseFloat(w.weight) || 0),
      0
    );
    system.gear.armorTotal = armor.reduce(
      (sum, a) => sum + (parseFloat(a.weight) || 0),
      0
    );
    system.gear.carriedWeight =
      system.gear.itemTotal + system.gear.weaponTotal + system.gear.armorTotal;

    // For template compatibility
    system.gear.readied ??= {};
    system.gear.readied.total = [...items, ...weapons, ...armor].filter(
      (e) => e?.readied
    ).length;

    // === Compute AI Gear Sums ===
    system.gearAI ??= {};

    const itemsAI = Array.isArray(system.itemsAI) ? system.itemsAI : [];
    const weaponsAI = Array.isArray(system.weaponsAI) ? system.weaponsAI : [];
    const armorAI = Array.isArray(system.armorAI) ? system.armorAI : [];

    system.gearAI.itemTotal = itemsAI.reduce(
      (sum, i) => sum + (parseFloat(i.weight) || 0),
      0
    );
    system.gearAI.weaponTotal = weaponsAI.reduce(
      (sum, w) => sum + (parseFloat(w.weight) || 0),
      0
    );
    system.gearAI.armorTotal = armorAI.reduce(
      (sum, a) => sum + (parseFloat(a.weight) || 0),
      0
    );
    system.gearAI.carriedWeight =
      system.gearAI.itemTotal +
      system.gearAI.weaponTotal +
      system.gearAI.armorTotal;

    // For template compatibility
    system.gearAI.readiedTotal = [...itemsAI, ...weaponsAI, ...armorAI].filter(
      (e) => e?.readied
    ).length;

    // === Compute BIO Encumbrance Thresholds (based on STR) ===
    const strScore =
      parseInt(system.attributes.primary?.STR?.score ?? "1") || 1;
    const baseEnc = Math.floor(strScore / 5) - 2 + 5;

    system.gear.encumbranceThresholds = {
      light: baseEnc,
      moderate: baseEnc * 2,
      heavy: baseEnc * 3,
      max: baseEnc * 4,
      pushDrag: baseEnc * 5,
    };

    // === Compute AI Encumbrance Thresholds (based on PRC) ===
    const prcScore =
      parseInt(system.attributesAI.primary?.PRC?.score ?? "1") || 1;
    const baseEncAI = Math.floor(prcScore / 5) - 2 + 5;

    system.gearAI.thresholds = {
      light: baseEncAI,
      moderate: baseEncAI * 2,
      heavy: baseEncAI * 3,
      max: baseEncAI * 4,
      pushDrag: baseEncAI * 5,
    };

    // === Compute BIO Derived Secondary Attributes ===
    const foc = parseInt(system.attributes.primary?.FOC?.score ?? "1") || 1;
    const dex = parseInt(system.attributes.primary?.DEX?.score ?? "1") || 1;
    const int = parseInt(system.attributes.primary?.INT?.score ?? "1") || 1;
    const strB = parseInt(system.attributes.primary?.STR?.score ?? "1") || 1;

    // Initiative
    {
      const base = Math.floor((foc + dex) / 2);
      const temp =
        parseInt(system.attributes.secondary?.INIT?.temp ?? "0") || 0;
      const mod = Math.floor(base / 5) - 2 + temp;
      const data = system.attributes.secondary.INIT;
      data.score = base;
      data.mod = mod;
    }

    // Education
    {
      const base = Math.floor((foc + int) / 2);
      const temp = parseInt(system.attributes.secondary?.EDU?.temp ?? "0") || 0;
      const mod = Math.floor(base / 5) - 2 + temp;
      const data = system.attributes.secondary.EDU;
      data.score = base;
      data.mod = mod;
    }

    // Speed
    {
      const base = Math.floor((strB + dex) / 2);
      const temp = parseInt(system.attributes.secondary?.SPD?.temp ?? "0") || 0;
      const mod = Math.floor(base / 5) - 2 + temp;
      const data = system.attributes.secondary.SPD;
      data.score = base;
      data.mod = mod;
    }

    // Movement
    {
      const temp =
        parseInt(system.attributes.secondary?.MVMT?.temp ?? "0") || 0;
      const data = system.attributes.secondary.MVMT;
      data.score = system.attributes.secondary.SPD.score * 2;
      data.mod = temp;
    }

    // === AI Derived Secondary Attributes ===
    system.attributesAI.secondary ??= {};

    const cor = parseInt(system.attributesAI.primary?.COR?.score ?? "1") || 1;
    const sen = parseInt(system.attributesAI.primary?.SEN?.score ?? "1") || 1;
    const log = parseInt(system.attributesAI.primary?.LOG?.score ?? "1") || 1;
    const prcA = parseInt(system.attributesAI.primary?.PRC?.score ?? "1") || 1;
    const arc = parseInt(system.attributesAI.primary?.ARC?.score ?? "1") || 1;
    const social =
      parseInt(system.attributesAI.primary?.SOCIAL?.score ?? "1") || 1;

    // Queue
    {
      const base = Math.floor((cor + sen) / 2);
      const temp =
        parseInt(system.attributesAI.secondary?.QUEUE?.temp ?? "0") || 0;
      const mod = Math.floor(base / 5) - 2 + temp;
      const data = system.attributesAI.secondary.QUEUE;
      data.score = base;
      data.mod = mod;
    }

    // Learning
    {
      const base = Math.floor((cor + log) / 2);
      const temp =
        parseInt(system.attributesAI.secondary?.LEARNING?.temp ?? "0") || 0;
      const mod = Math.floor(base / 5) - 2 + temp;
      const data = system.attributesAI.secondary.LEARNING;
      data.score = base;
      data.mod = mod;
    }

    // Cycles
    {
      const base = Math.floor((prcA + sen) / 2);
      const temp =
        parseInt(system.attributesAI.secondary?.CYCLES?.temp ?? "0") || 0;
      const mod = Math.floor(base / 5) - 2 + temp;
      const data = system.attributesAI.secondary.CYCLES;
      data.score = base;
      data.mod = mod;
    }

    // Latency
    {
      const temp =
        parseInt(system.attributesAI.secondary?.LATENCY?.temp ?? "0") || 0;
      const data = system.attributesAI.secondary.LATENCY;
      data.score = system.attributesAI.secondary.CYCLES.score * 2;
      data.mod = temp;
    }

    // === BIO Saving Throws ===
    system.saves ??= {};

    const con = parseInt(system.attributes.primary?.CON?.score ?? "1") || 1;
    const cha = parseInt(system.attributes.primary?.CHA?.score ?? "1") || 1;

    system.saves.PHYSICAL =
      Math.floor((strB + con) / 4) +
      (parseInt(system.saves?.PhysTemp ?? "0") || 0);

    system.saves.MENTAL =
      Math.floor((int + foc) / 4) +
      (parseInt(system.saves?.MentTemp ?? "0") || 0);

    system.saves.EVASION =
      Math.floor((foc + dex) / 4) +
      (parseInt(system.saves?.EvasTemp ?? "0") || 0);

    system.saves.SOCIAL =
      Math.floor((cha + int) / 4) +
      (parseInt(system.saves?.SocTemp ?? "0") || 0);

    // === Compute BIO Status ===
    system.status ??= {};
    system.status.hp ??= {};
    system.status.mp ??= {};

    // HP
    {
      const temp = parseInt(system.status.hp?.temp ?? "0") || 0;
      system.status.hp.max = Math.floor((strB + con) / 2) + temp;
      system.status.hp.min = -1 * (system.saves.PHYSICAL ?? 0);
    }

    // MP
    {
      const temp = parseInt(system.status.mp?.temp ?? "0") || 0;
      system.status.mp.max = Math.floor((con + foc) / 2) + temp;
      system.status.mp.min = -1 * (system.saves.MENTAL ?? 0);
    }

    // === Compute AI Saving Throws ===
    system.vitalsAI ??= {};
    system.vitalsAI.saves ??= {};

    {
      const overTemp = parseInt(system.vitalsAI.saves?.OverTemp ?? "0") || 0;
      const inteTemp = parseInt(system.vitalsAI.saves?.InteTemp ?? "0") || 0;
      const bypaTemp = parseInt(system.vitalsAI.saves?.BypaTemp ?? "0") || 0;
      const firTemp = parseInt(system.vitalsAI.saves?.FirTemp ?? "0") || 0;

      system.vitalsAI.saves.OVER = Math.floor((prcA + arc) / 4) + overTemp;
      system.vitalsAI.saves.INTE = Math.floor((log + cor) / 4) + inteTemp;
      system.vitalsAI.saves.BYPA = Math.floor((cor + sen) / 4) + bypaTemp;
      system.vitalsAI.saves.FIR = Math.floor((social + log) / 4) + firTemp;
    }

    // === Compute AI Status ===
    system.vitalsAI.status ??= {};
    system.vitalsAI.status.IP ??= {};
    system.vitalsAI.status.PP ??= {};

    // IP
    {
      const temp = parseInt(system.vitalsAI.status.IP?.temp ?? "0") || 0;
      system.vitalsAI.status.IP.max = Math.floor((prcA + arc) / 2) + temp;
      system.vitalsAI.status.IP.min = -1 * (system.vitalsAI.saves.OVER ?? 0);
    }

    // PP
    {
      const temp = parseInt(system.vitalsAI.status.PP?.temp ?? "0") || 0;
      system.vitalsAI.status.PP.max = Math.floor((arc + cor) / 2) + temp;
      system.vitalsAI.status.PP.min = -1 * (system.vitalsAI.saves.INTE ?? 0);
    }

    // === Mark attributes that support rolls ===
    system.attributes.secondary ??= {};
    system.attributes.secondary.INIT ??= {};
    system.attributes.secondary.INIT.hasRoll = true;

    system.attributesAI.secondary ??= {};
    system.attributesAI.secondary.QUEUE ??= {};
    system.attributesAI.secondary.QUEUE.hasRoll = true;

    // === Populate labels for BIO Skills ===
    const bioSkillGroups = [
      system.skills?.combat,
      system.skills?.detection,
      system.skills?.trainingPackages,
    ];
    for (const group of bioSkillGroups) {
      if (!group || !Array.isArray(group)) continue;
      for (const skill of group) {
        skill.label ??= skill.name ?? "Skill";
        skill.attribute ??= "DEX";
      }
    }

    // === Populate labels for AI Skills ===
    const aiSkillGroups = [
      system.skillsAI?.combat,
      system.skillsAI?.detection,
      system.skillsAI?.trainingPackages,
    ];
    for (const group of aiSkillGroups) {
      if (!group || !Array.isArray(group)) continue;
      for (const skill of group) {
        skill.label ??= skill.name ?? "Skill";
        skill.attribute ??= "PRC";
      }
    }
  }

  // === Static lookup tables ===
  static ApTable = [
    // Index = attribute score - 1
    "1",
    "2",
    "3",
    "4",
    "5",
    "7",
    "9",
    "11",
    "13",
    "15",
    "18",
    "21",
    "24",
    "27",
    "30",
    "34",
    "38",
    "42",
    "46",
    "50",
    "55",
    "60",
    "65",
    "70",
    "75",
    "81",
    "87",
    "93",
    "99",
    "105",
    "112",
    "119",
    "126",
    "133",
    "140",
    "148",
    "156",
    "164",
    "172",
    "180",
    "189",
    "198",
    "207",
    "216",
    "225",
    "235",
    "245",
    "255",
    "265",
    "275",
    "286",
    "297",
    "308",
    "319",
    "330",
    "342",
    "354",
    "366",
    "378",
    "390",
    "403",
    "416",
    "429",
    "442",
    "455",
    "469",
    "483",
    "497",
    "511",
    "525",
    "540",
    "555",
    "570",
    "585",
    "600",
    "616",
    "632",
    "648",
    "664",
    "680",
    "697",
    "714",
    "731",
    "748",
    "765",
    "783",
    "801",
    "819",
    "837",
    "855",
    "874",
    "893",
    "912",
    "931",
    "950",
  ];

  static HumanAppTable = [
    "Revolting",
    "Hideous",
    "Hideous",
    "Hideous",
    "Ugly",
    "Ugly",
    "Ugly",
    "Ugly",
    "Unattractive",
    "Unattractive",
    "Unattractive",
    "Unattractive",
    "Average",
    "Average",
    "Average",
    "Average",
    "Attractive",
    "Attractive",
    "Attractive",
    "Attractive",
    "Beautiful",
    "Beautiful",
    "Beautiful",
    "Beautiful",
    "Gorgeous",
    "Gorgeous",
    "Gorgeous",
    "Perfection",
  ];

  static LikeTable = [
    "Corrupt Shell",
    "Fragmented Data",
    "Fragmented Data",
    "Fragmented Data",
    "Uncanny Static",
    "Uncanny Static",
    "Uncanny Static",
    "Uncanny Static",
    "Broken Render",
    "Broken Render",
    "Unattractive",
    "Broken Render",
    "Baseline Interface",
    "Baseline Interface",
    "Baseline Interface",
    "Baseline Interface",
    "Adaptive Persona",
    "Adaptive Persona",
    "Adaptive Persona",
    "Adaptive Persona",
    "Emotive Resonance",
    "Emotive Resonance",
    "Emotive Resonance",
    "Emotive Resonance",
    "Enthralling Projection",
    "Enthralling Projection",
    "Enthralling Projection",
    "Divine Algorithm",
  ];
}

// actor.mjs

export class T4DActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["t4d", "sheet", "actor"],
      template: "systems/T4D/templates/sheets/actor-FoundryAIBIO.html",
      width: 800,
      height: 1000,
    });
  }

  /** @override */
  getData() {
    const data = super.getData();
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.options.editable) return;

    // Instead of re-rendering, simply auto-submit changes when inputs lose focus
    html
      .find("input, select, textarea")
      .on("change", this._onChangeInput.bind(this));

    // Your roll handlers
    html.find(".roll-skill").click(this._onSkillRoll.bind(this));
    html.find(".roll-ai-skill").click(this._onAISkillRoll.bind(this));
    html.find(".roll-save").click(this._onSaveRoll.bind(this));
    html.find(".roll-ai").click(this._onAISaveRoll.bind(this));
    html.find(".roll-init").click(this._onInitRoll.bind(this));
    html.find(".roll-ai-init").click(this._onQueueRoll.bind(this));
    html.find(".roll-weapon").click(this._onWeaponRoll.bind(this));
    html.find(".roll-ai-weapon").click(this._onAIWeaponRoll.bind(this));
    html.find(".roll-nanite").click(this._onNaniteRoll.bind(this));
    html
      .find(".roll-nanite-reaction")
      .click(this._onNaniteReactionRoll.bind(this));
    html.find(".roll-ai-nanite").click(this._onAINaniteReactionRoll.bind(this));
  }

  /**
   * Called when an input changes.
   * We submit the form to save data without triggering manual re-render.
   */
  async _onChangeInput(event) {
    event.preventDefault();
    await this.submit();
  }

  /** @override */
  async _updateObject(event, formData) {
    // Apply the update
    await this.object.update(formData);
  }

  /**
   * Handle rolling a Bio Skill
   */
  async _onSkillRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = parseInt(button.dataset.index);
    const actor = this.actor;

    const skillList = getProperty(actor.system, group);
    if (!Array.isArray(skillList)) {
      ui.notifications.error(`Could not find skill group: ${group}`);
      return;
    }
    const skill = skillList[index];
    if (!skill) {
      ui.notifications.error(`Could not find skill at index ${index}.`);
      return;
    }

    const attribute = skill.attribute ?? "DEX";
    const attrMod =
      getProperty(actor.system.attributes.primary, `${attribute}Mod`) ?? 0;
    const stressPenalty = actor.system.stress?.penalty ?? 0;
    const skillLevel = skill.level ?? 0;

    // Prompt for other modifiers
    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${skill.label}`,
        content: `
        <p>Enter any other modifiers:</p>
        <input type="number" name="otherMod" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=otherMod]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });

    if (otherMod === null) return;

    const formula = `1d20 + ${skillLevel} + ${attrMod} + ${stressPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${skill.label} Skill Check`,
    });
  }

  /**
   * Handle rolling an AI Skill
   */
  async _onAISkillRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = parseInt(button.dataset.index);
    const actor = this.actor;

    const skillList = getProperty(actor.system, group);
    if (!Array.isArray(skillList)) {
      ui.notifications.error(`Could not find AI skill group: ${group}`);
      return;
    }
    const skill = skillList[index];
    if (!skill) {
      ui.notifications.error(`Could not find AI skill at index ${index}.`);
      return;
    }

    const attribute = skill.attribute ?? "PRC";
    const attrMod =
      getProperty(actor.system.attributesAI.primary, `${attribute}Mod`) ?? 0;
    const fragmentPenalty = actor.system.vitalsAI?.fragmentation?.penalty ?? 0;
    const skillLevel = skill.level ?? 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${skill.label}`,
        content: `
        <p>Enter any other modifiers:</p>
        <input type="number" name="otherMod" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=otherMod]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });

    if (otherMod === null) return;

    const formula = `1d20 + ${skillLevel} + ${attrMod} + ${fragmentPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${skill.label} AI Skill Check`,
    });
  }

  /**
   * Handle rolling a Bio Save
   */
  async _onSaveRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const label = button.dataset.label;
    const actor = this.actor;

    // Map labels to keys
    const labelMap = {
      Physical: "PHYSICAL",
      Mental: "MENTAL",
      Evasion: "EVASION",
      Social: "SOCIAL",
    };

    const saveKey = labelMap[label];
    if (!saveKey) {
      ui.notifications.error(`Invalid save label: ${label}`);
      return;
    }

    const saveData = actor.system.saves?.[saveKey];
    if (!saveData || saveData.score === undefined) {
      ui.notifications.error(`Could not find Bio save: ${label}`);
      return;
    }

    const saveScore = saveData.score ?? 0;
    const saveTemp = saveData.temp ?? 0;

    const stressPenalty = actor.system.stress?.penalty ?? 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${label} Save`,
        content: `
        <p>Enter any other modifiers:</p>
        <input type="number" name="otherMod" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=otherMod]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });

    if (otherMod === null) return;

    const totalSave = saveScore + saveTemp;
    const formula = `1d20 + ${totalSave} + ${stressPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${label} Save`,
    });
  }

  /**
   * Handle rolling an AI Save
   */
  async _onAISaveRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const label = button.dataset.label;
    const actor = this.actor;

    // Map label text to data keys
    const labelMap = {
      Overload: "OVERLOAD",
      Integrity: "INTEGRITY",
      Bypass: "BYPASS",
      Firewall: "FIREWALL",
    };

    const saveKey = labelMap[label];
    if (!saveKey) {
      ui.notifications.error(`Invalid AI save label: ${label}`);
      return;
    }

    const saveData = actor.system.vitalsAI.saves?.[saveKey];
    if (!saveData || saveData.score === undefined) {
      ui.notifications.error(`Could not find AI save: ${label}`);
      return;
    }

    const saveScore = saveData.score ?? 0;
    const saveTemp = saveData.temp ?? 0;

    const fragmentPenalty = actor.system.vitalsAI?.fragmentation?.penalty ?? 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${label} AI Save`,
        content: `
        <p>Enter any other modifiers:</p>
        <input type="number" name="otherMod" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=otherMod]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });

    if (otherMod === null) return;

    const totalSave = saveScore + saveTemp;
    const formula = `1d20 + ${totalSave} + ${fragmentPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${label} AI Save`,
    });
  }

  /**
   * Handle rolling a Bio Weapon attack
   */
  async _onWeaponRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = Number(button.dataset.index);
    const actor = this.actor;

    const weapon = getProperty(actor.system, group)?.[index];
    if (!weapon) {
      ui.notifications.error(
        `Could not find weapon in ${group} at index ${index}.`
      );
      return;
    }

    // Use selected attribute (default to DEX)
    const attribute = weapon.attribute ?? "DEX";
    const attrMod = actor.system.attributes.primary?.[`${attribute}Mod`] ?? 0;
    const stressPenalty = actor.system.stress?.penalty ?? 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${weapon.name}`,
        content: `
        <p>Enter any other modifiers:</p>
        <input type="number" name="otherMod" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=otherMod]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });

    if (otherMod === null) return;

    const formula = `1d20 + ${weapon.atkBonus} + ${attrMod} + ${stressPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${weapon.name} Attack (${attribute})`,
    });
  }

  /**
   * Handle rolling an AI Weapon attack
   */
  async _onAIWeaponRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = Number(button.dataset.index);
    const actor = this.actor;

    const weapon = getProperty(actor.system, group)?.[index];
    if (!weapon) {
      ui.notifications.error(
        `Could not find AI weapon in ${group} at index ${index}.`
      );
      return;
    }

    // Use selected attribute (default to PRC)
    const attribute = weapon.attribute ?? "PRC";
    const attrMod = actor.system.attributesAI.primary?.[`${attribute}Mod`] ?? 0;
    const fragPenalty = actor.system.vitalsAI?.fragmentation?.penalty ?? 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${weapon.name}`,
        content: `
        <p>Enter any other modifiers:</p>
        <input type="number" name="otherMod" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=otherMod]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });

    if (otherMod === null) return;

    const formula = `1d20 + ${weapon.atkBonus} + ${attrMod} + ${fragPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${weapon.name} AI Attack (${attribute})`,
    });
  }

  /**
   * Handle rolling a Bio Nanite Catalyst
   */
  async _onNaniteRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = Number(button.dataset.index);
    const actor = this.actor;

    const catalyst = getProperty(actor.system, group)?.[index];
    if (!catalyst) {
      ui.notifications.error(
        `Could not find Nanite catalyst in ${group} at index ${index}.`
      );
      return;
    }

    const dieType = catalyst.type ?? "1d4";

    // Prompt for other modifiers
    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${catalyst.name}`,
        content: `
        <p>Enter any additional modifiers:</p>
        <input type="number" name="otherMod" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=otherMod]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });
    if (otherMod === null) return;

    const formula = `${dieType} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${catalyst.name} Nanite Roll (${dieType})`,
    });
  }

  /**
   * Handle rolling an AI Nanite Catalyst
   */
  async _onAINaniteRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = Number(button.dataset.index);
    const actor = this.actor;

    const catalyst = getProperty(actor.system, group)?.[index];
    if (!catalyst) {
      ui.notifications.error(
        `Could not find AI Nanite catalyst in ${group} at index ${index}.`
      );
      return;
    }

    // Prompt for die type
    const dieType = await new Promise((resolve) => {
      new Dialog({
        title: `Choose Die Type for ${catalyst.name}`,
        content: `
        <p>Select Nanite potency:</p>
        <select name="die">
          <option value="1d4">Minor (1d4)</option>
          <option value="5d4">Major (5d4)</option>
        </select>
      `,
        buttons: {
          ok: {
            label: "OK",
            callback: (html) => resolve(html.find("[name=die]").val()),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });
    if (!dieType) return;

    // Prompt for other modifiers
    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${catalyst.name}`,
        content: `
        <p>Enter any additional modifiers:</p>
        <input type="number" name="otherMod" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=otherMod]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });
    if (otherMod === null) return;

    const formula = `${dieType} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${catalyst.name} AI Nanite Roll`,
    });
  }

  /**
   * Handle rolling a Nanite Reaction (Bio)
   */
  async _onNaniteReactionRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = Number(button.dataset.index);
    const actor = this.actor;

    const reaction = getProperty(actor.system, group)?.[index];
    if (!reaction) {
      ui.notifications.error(
        `Could not find reaction in ${group} at index ${index}.`
      );
      return;
    }

    // Prompt user to select attribute
    const attribute = await new Promise((resolve) => {
      new Dialog({
        title: `Select Attribute for ${reaction.name}`,
        content: `
        <p>Choose which attribute applies:</p>
        <select name="attrSelect">
          <option value="STR">Strength</option>
          <option value="DEX">Dexterity</option>
          <option value="CON">Constitution</option>
          <option value="INT">Intelligence</option>
          <option value="FOC">Focus</option>
          <option value="CHA">Charisma</option>
        </select>
      `,
        buttons: {
          ok: {
            label: "OK",
            callback: (html) => resolve(html.find("[name=attrSelect]").val()),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });
    if (!attribute) return;

    // Prompt for other modifiers
    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${reaction.name}`,
        content: `
        <p>Enter any other modifiers:</p>
        <input type="number" name="otherMod" value="0"/>
      `,
        buttons: {
          ok: {
            label: "OK",
            callback: (html) =>
              resolve(Number(html.find("[name=otherMod]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });
    if (otherMod === null) return;

    const attrMod = actor.system.attributes.primary?.[`${attribute}Mod`] ?? 0;
    const stressPenalty = actor.system.stress?.penalty ?? 0;
    const level = reaction.level ?? 0;

    const formula = `1d20 + ${level} + ${attrMod} + ${stressPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${reaction.name} Nanite Reaction (${attribute})`,
    });
  }

  /**
   * Handle rolling an AI Nanite Reaction
   */
  async _onAINaniteReactionRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = Number(button.dataset.index);
    const actor = this.actor;

    const reaction = getProperty(actor.system, group)?.[index];
    if (!reaction) {
      ui.notifications.error(
        `Could not find AI reaction in ${group} at index ${index}.`
      );
      return;
    }

    // Prompt user to select attribute
    const attributeChoices = {
      PRC: "Perception",
      SEN: "Sentience",
      ARC: "Arcanum",
      LOG: "Logic",
      COR: "Core",
      SOCIAL: "Social",
    };

    const attribute = await new Promise((resolve) => {
      new Dialog({
        title: `Select Attribute Modifier: ${reaction.name}`,
        content: `
        <p>Choose the attribute modifier to use:</p>
        <select name="attribute">
          ${Object.entries(attributeChoices)
            .map(([key, label]) => `<option value="${key}">${label}</option>`)
            .join("")}
        </select>
      `,
        buttons: {
          ok: {
            label: "OK",
            callback: (html) => resolve(html.find("[name=attribute]").val()),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });
    if (!attribute) return;

    const attrMod = actor.system.attributesAI.primary?.[`${attribute}Mod`] ?? 0;
    const fragmentationPenalty =
      actor.system.vitalsAI?.fragmentation?.penalty ?? 0;
    const level = reaction.level ?? 0;

    // Prompt for other modifiers
    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${reaction.name}`,
        content: `
        <p>Enter any other modifiers:</p>
        <input type="number" name="otherMod" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=otherMod]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });
    if (otherMod === null) return;

    const formula = `1d20 + ${level} + ${attrMod} + ${fragmentationPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${reaction.name} AI Nanite Reaction (${attribute})`,
    });
  }

  /**
   * Handle rolling Bio Initiative
   */
  async _onInitRoll(event) {
    event.preventDefault();
    const actor = this.actor;

    // Prompt for action speed modifier
    const actionSpeed = await new Promise((resolve) => {
      new Dialog({
        title: "Action Speed Modifier",
        content: `
        <p>Enter any action speed modifier:</p>
        <input type="number" name="actionSpeed" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=actionSpeed]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });
    if (actionSpeed === null) return;

    // You can pick whichever property is your actual data
    const initMod =
      getProperty(actor.system, "attributes.secondary.INITMod") ??
      getProperty(actor.system, "attributes.secondary.INIT.mod") ??
      0;

    const formula = `2d4 - ${initMod} + ${actionSpeed}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: "Initiative Roll (lower is better)",
    });

    const combatant = game.combat?.combatants?.find(
      (c) => c.actorId === actor.id
    );
    if (combatant) {
      await combatant.update({ initiative: roll.total });
    }
  }

  /**
   * Handle rolling AI Initiative (Queue Roll)
   */
  async _onQueueRoll(event) {
    event.preventDefault();
    const actor = this.actor;

    // Prompt for action cycles modifier
    const actionCycles = await new Promise((resolve) => {
      new Dialog({
        title: "Action Cycles Modifier",
        content: `
        <p>Enter any action cycles modifier:</p>
        <input type="number" name="actionCycles" value="0"/>
      `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(Number(html.find("[name=actionCycles]").val()) || 0),
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null),
          },
        },
        default: "ok",
      }).render(true);
    });
    if (actionCycles === null) return;

    const queueMod =
      getProperty(actor.system, "attributesAI.secondary.QUEUEMod") ??
      getProperty(actor.system, "attributesAI.secondary.QUEUE.mod") ??
      0;

    const formula = `2d4 - ${queueMod} + ${actionCycles}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: "AI Initiative (Queue) Roll (lower is better)",
    });

    const combatant = game.combat?.combatants?.find(
      (c) => c.actorId === actor.id
    );
    if (combatant) {
      await combatant.update({ initiative: roll.total });
    }
  }
}
