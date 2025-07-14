export class T4DActor extends Actor {
  prepareData() {
    super.prepareData();
    const system = this.system;

    // === BIO ATTRIBUTES ===
    if (!system.attributes) system.attributes = {};

    // BIO Primary
    if (!system.attributes.primary) {
      system.attributes.primary = {
        STR: { score: 10 },
        DEX: { score: 10 },
        CON: { score: 10 },
        INT: { score: 10 },
        FOC: { score: 10 },
        CHA: { score: 10 },
      };
    }
    const bioPrimaryKeys = ["STR", "DEX", "CON", "INT", "FOC", "CHA"];
    for (let attr of bioPrimaryKeys) {
      const data = system.attributes.primary[attr];
      if (data) {
        if (data.label === undefined) data.label = attr;
        if (data.mod === undefined) data.mod = 0;
        if (data.apToNext === undefined) data.apToNext = 0;
        if (data.apTotal === undefined) data.apTotal = 0;
        if (data.temp === undefined) data.temp = 0;
      }
    }

    // BIO Secondary
    if (!system.attributes.secondary) {
      system.attributes.secondary = {
        APPEAR: { score: 3 },
        INIT: { score: 0 },
        EDU: { score: 0 },
        SPD: { score: 0 },
        MVMT: { score: 0 },
      };
    }
    const bioSecondaryKeys = ["INIT", "EDU", "SPD", "MVMT", "APPEAR"];
    for (let attr of bioSecondaryKeys) {
      const data = system.attributes.secondary[attr];
      if (data) {
        if (data.label === undefined) data.label = attr;
        if (data.mod === undefined) data.mod = 0;
        if (data.temp === undefined) data.temp = 0;
      }
    }

    // Appearance
    // Appearance Descriptor
    {
      const appScore = parseInt(system.attributes.secondary.APPEAR.score || 3);
      const appIndex = Math.max(0, appScore - 3);
      system.attributes.secondary.APPEAR.desc =
        this.constructor.HumanAppTable?.[appIndex] || "Unknown";
    }

    // === AI ATTRIBUTES ===
    if (!system.attributesAI) system.attributesAI = {};

    // AI Primary
    if (!system.attributesAI.primary) {
      system.attributesAI.primary = {
        PRC: { score: 10 },
        SEN: { score: 10 },
        ARC: { score: 10 },
        LOG: { score: 10 },
        COR: { score: 10 },
        SOCIAL: { score: 10 },
      };
    }
    const aiPrimaryKeys = ["PRC", "SEN", "ARC", "LOG", "COR", "SOCIAL"];
    for (let attr of aiPrimaryKeys) {
      const data = system.attributesAI.primary[attr];
      if (data) {
        if (data.label === undefined) data.label = attr;
        if (data.mod === undefined) data.mod = 0;
        if (data.apToNext === undefined) data.apToNext = 0;
        if (data.apTotal === undefined) data.apTotal = 0;
        if (data.temp === undefined) data.temp = 0;
      }
    }

    // AI Secondary (mirroring BIO Secondary)
    if (!system.attributesAI.secondary) {
      system.attributesAI.secondary = {
        LIKE: { score: 3 },
        QUEUE: { score: 0 },
        LEA: { score: 0 },
        CYC: { score: 0 },
        LATN: { score: 0 },
      };
    }
    const aiSecondaryKeys = ["LIKE", "QUEUE", "LEA", "CYC", "LATN"];
    for (let attr of aiSecondaryKeys) {
      const data = system.attributesAI.secondary[attr];
      if (data) {
        if (data.label === undefined) data.label = attr;
        if (data.mod === undefined) data.mod = 0;
        if (data.temp === undefined) data.temp = 0;
      }
    }

    // Likeness Descriptor (if you still want it)
    const likeScore = parseInt(system.attributesAI.secondary.LIKE.score || 3);
    const likeIndex = Math.max(0, likeScore - 3);
    system.attributesAI.secondary.LIKE.desc =
      this.constructor.LikeTable?.[likeIndex] || "Unknown";

    // === Compute BIO AP thresholds ===
    const statToAPT = {
      STR: "STRAPT",
      DEX: "DEXAPT",
      CON: "CONAPT",
      INT: "INTAPT",
      FOC: "FOCAPT",
      CHA: "CHAAPT",
    };
    for (let [stat, field] of Object.entries(statToAPT)) {
      const val = parseInt(system.attributes?.primary?.[stat]?.score || 1);
      system.attributes.primary[field] =
        this.constructor.ApTable?.[val - 1] || "1";
    }

    // === Compute BIO Modifiers and AP to Next ===
    const bioStats = ["STR", "DEX", "CON", "INT", "FOC", "CHA"];
    for (let stat of bioStats) {
      const score = parseInt(system.attributes.primary[stat]?.score || 1);
      const temp = parseInt(system.attributes.primary[stat]?.temp || 0);
      const mod = Math.floor(score / 5) - 2 + temp;
      system.attributes.primary[stat + "Mod"] = mod;
      system.attributes.primary[stat + "APN"] = mod + 3;
    }

    // === Compute AI Modifiers and AP to Next ===
    const aiStats = ["PRC", "SEN", "ARC", "LOG", "COR", "SOCIAL"];
    for (let stat of aiStats) {
      const score = parseInt(system.attributesAI.primary[stat]?.score || 1);
      const temp = parseInt(system.attributesAI.primary[stat]?.temp || 0);
      const mod = Math.floor(score / 5) - 2 + temp;
      system.attributesAI.primary[stat + "Mod"] = mod;
      system.attributesAI.primary[stat + "APN"] = mod + 3;
    }

    // === Compute Gear Weight Totals ===
    system.gear = {};
    const items = Array.isArray(system.items) ? system.items : [];
    const weapons = Array.isArray(system.weapons) ? system.weapons : [];
    const armor = Array.isArray(system.armor) ? system.armor : [];

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
    system.gear.readiedTotal = [...items, ...weapons, ...armor].filter(
      (e) => e.readied
    ).length;

    // === Compute AI Gear Sums ===
    system.gearAI = {};

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

    system.gearAI.readiedTotal = [...itemsAI, ...weaponsAI, ...armorAI].filter(
      (e) => e.readied
    ).length;

    // === Compute BIO Encumbrance Thresholds (based on STR) ===
    const strScore = parseInt(system.attributes?.primary?.STR?.score || 1);
    const baseEnc = Math.floor(strScore / 5) - 2 + 5;
    system.gear.encumbranceThresholds = {
      light: baseEnc,
      moderate: baseEnc * 2,
      heavy: baseEnc * 3,
      max: baseEnc * 4,
      pushDrag: baseEnc * 5,
    };

    // === AI Encumbrance (based on PRC) ===
    const prcScore = parseInt(system.attributesAI?.primary?.PRC?.score || 1);
    const baseEncAI = Math.floor(prcScore / 5) - 2 + 5;
    system.gearAI.thresholds = {
      light: baseEncAI,
      moderate: baseEncAI * 2,
      heavy: baseEncAI * 3,
      max: baseEncAI * 4,
      pushDrag: baseEncAI * 5,
    };

    // === Compute BIO Derived Secondary Attributes ===
    system.attributes.secondary = system.attributes.secondary || {};

    // Extract relevant primary scores
    const foc = parseInt(system.attributes.primary?.FOC?.score || 1);
    const dex = parseInt(system.attributes.primary?.DEX?.score || 1);
    const int = parseInt(system.attributes.primary?.INT?.score || 1);
    const strB = parseInt(system.attributes.primary?.STR?.score || 1);

    // Initiative
    const initScore = Math.floor((foc + dex) / 2);
    const initTemp = parseInt(system.attributes.secondary?.INIT?.temp || 0);
    const initMod = Math.floor(initScore / 5) - 2 + initTemp;
    system.attributes.secondary.INIT.score = initScore;
    system.attributes.secondary.INIT.mod = initMod;

    // Education
    const eduScore = Math.floor((foc + int) / 2);
    const eduTemp = parseInt(system.attributes.secondary?.EDU?.temp || 0);
    const eduMod = Math.floor(eduScore / 5) - 2 + eduTemp;
    system.attributes.secondary.EDU.score = eduScore;
    system.attributes.secondary.EDU.mod = eduMod;

    // Speed
    const spdScore = Math.floor((strB + dex) / 2);
    const spdTemp = parseInt(system.attributes.secondary?.SPD?.temp || 0);
    const spdMod = Math.floor(spdScore / 5) - 2 + spdTemp;
    system.attributes.secondary.SPD.score = spdScore;
    system.attributes.secondary.SPD.mod = spdMod;

    // === Movement ===
    {
      const mvmtTemp = parseInt(system.attributes.secondary?.MVMT?.temp || 0);
      const mvmtScore = spdScore * 2;
      system.attributes.secondary.MVMT.score = mvmtScore;
      system.attributes.secondary.MVMT.mod = mvmtTemp;
    }

    // === AI Derived Secondary Attributes ===
    system.attributesAI.secondary = system.attributesAI.secondary || {};

    // AI Primary Scores
    const cor = parseInt(system.attributesAI.primary?.COR?.score || 1);
    const sen = parseInt(system.attributesAI.primary?.SEN?.score || 1);
    const log = parseInt(system.attributesAI.primary?.LOG?.score || 1);
    const prcA = parseInt(system.attributesAI.primary?.PRC?.score || 1);
    const arc = parseInt(system.attributesAI.primary?.ARC?.score || 1);
    const social = parseInt(system.attributesAI.primary?.SOCIAL?.score || 1);

    // Queue
    {
      const queueScore = Math.floor((cor + sen) / 2);
      const queueTemp = parseInt(
        system.attributesAI.secondary?.QUEUE?.temp || 0
      );
      const queueMod = Math.floor(queueScore / 5) - 2 + queueTemp;
      system.attributesAI.secondary.QUEUE.score = queueScore;
      system.attributesAI.secondary.QUEUE.mod = queueMod;
    }

    // Learning
    {
      const leaScore = Math.floor((cor + log) / 2);
      const leaTemp = parseInt(system.attributesAI.secondary?.LEA?.temp || 0);
      const leaMod = Math.floor(leaScore / 5) - 2 + leaTemp;
      system.attributesAI.secondary.LEA.score = leaScore;
      system.attributesAI.secondary.LEA.mod = leaMod;
    }

    // Cycles
    {
      const cycScore = Math.floor((prcA + sen) / 2);
      const cycTemp = parseInt(system.attributesAI.secondary?.CYC?.temp || 0);
      const cycMod = Math.floor(cycScore / 5) - 2 + cycTemp;
      system.attributesAI.secondary.CYC.score = cycScore;
      system.attributesAI.secondary.CYC.mod = cycMod;
    }

    // Latency
    {
      const latnTemp = parseInt(system.attributesAI.secondary?.LATN?.temp || 0);
      const latnScore = cycScore * 2;
      system.attributesAI.secondary.LATN.score = latnScore;
      system.attributesAI.secondary.LATN.mod = latnTemp;
    }

    // === BIO Saving Throws ===
    system.saves = system.saves || {};

    const con = parseInt(system.attributes.primary?.CON?.score || 1);
    const cha = parseInt(system.attributes.primary?.CHA?.score || 1);

    system.saves.PHYS =
      Math.floor((strB + con) / 4) + parseInt(system.saves?.PhysTemp || 0);
    system.saves.MENT =
      Math.floor((int + foc) / 4) + parseInt(system.saves?.MentTemp || 0);
    system.saves.EVAS =
      Math.floor((foc + dex) / 4) + parseInt(system.saves?.EvasTemp || 0);
    system.saves.SOC =
      Math.floor((cha + int) / 4) + parseInt(system.saves?.SocTemp || 0);

    // === Compute BIO Status ===
    system.status = system.status || {};
    system.status.hp = system.status.hp || {};
    system.status.mp = system.status.mp || {};

    // HP
    {
      const hpTemp = parseInt(system.status.hp?.temp || 0);
      system.status.hp.max = Math.floor((strB + con) / 2) + hpTemp;
      system.status.hp.min = (system.saves.PHYS || 0) * -1;
    }

    // MP
    {
      const mpTemp = parseInt(system.status.mp?.temp || 0);
      system.status.mp.max = Math.floor((con + foc) / 2) + mpTemp;
      system.status.mp.min = (system.saves.MENT || 0) * -1;
    }

    // === Compute AI Saving Throws ===
    system.vitalsAI = system.vitalsAI || {};
    system.vitalsAI.saves = system.vitalsAI.saves || {};

    {
      const overTemp = parseInt(system.vitalsAI.saves?.OverTemp || 0);
      const inteTemp = parseInt(system.vitalsAI.saves?.InteTemp || 0);
      const bypaTemp = parseInt(system.vitalsAI.saves?.BypaTemp || 0);
      const firTemp = parseInt(system.vitalsAI.saves?.FirTemp || 0);

      system.vitalsAI.saves.OVER = Math.floor((prcA + arc) / 4) + overTemp;
      system.vitalsAI.saves.INTE = Math.floor((log + cor) / 4) + inteTemp;
      system.vitalsAI.saves.BYPA = Math.floor((cor + sen) / 4) + bypaTemp;
      system.vitalsAI.saves.FIR = Math.floor((social + log) / 4) + firTemp;
    }

    // === Compute AI Status ===
    system.vitalsAI.status = system.vitalsAI.status || {};
    system.vitalsAI.status.IP = system.vitalsAI.status.IP || {};
    system.vitalsAI.status.PP = system.vitalsAI.status.PP || {};

    // IP
    {
      const ipTemp = parseInt(system.vitalsAI.status.IP?.temp || 0);
      system.vitalsAI.status.IP.max = Math.floor((prcA + arc) / 2) + ipTemp;
      system.vitalsAI.status.IP.min = (system.vitalsAI.saves.OVER || 0) * -1;
    }

    // PP
    {
      const ppTemp = parseInt(system.vitalsAI.status.PP?.temp || 0);
      system.vitalsAI.status.PP.max = Math.floor((arc + cor) / 2) + ppTemp;
      system.vitalsAI.status.PP.min = (system.vitalsAI.saves.INTE || 0) * -1;
    }

    // === Mark attributes that support rolls ===
    system.attributes.secondary = system.attributes.secondary || {};
    system.attributes.secondary.INIT = system.attributes.secondary.INIT || {};
    system.attributes.secondary.INIT.hasRoll = true;

    system.attributesAI.secondary = system.attributesAI.secondary || {};
    system.attributesAI.secondary.QUEUE =
      system.attributesAI.secondary.QUEUE || {};
    system.attributesAI.secondary.QUEUE.hasRoll = true;

    // === Populate labels for BIO Skills ===
    const bioSkillGroups = [
      system.skills?.combat,
      system.skills?.detection,
      system.skills?.trainingPackages,
    ];
    for (const group of bioSkillGroups) {
      if (!Array.isArray(group)) continue;
      for (const skill of group) {
        skill.label = skill.label || skill.name || "Skill";
        skill.attribute = skill.attribute || "DEX"; // Default BIO attribute
      }
    }

    // === Populate labels for AI Skills ===
    const aiSkillGroups = [
      system.skillsAI?.combat,
      system.skillsAI?.detection,
      system.skillsAI?.trainingPackages,
    ];
    for (const group of aiSkillGroups) {
      if (!Array.isArray(group)) continue;
      for (const skill of group) {
        skill.label = skill.label || skill.name || "Skill";
        skill.attribute = skill.attribute || "PRC"; // Default AI attribute
      }
    }
  }

  // === Static lookup tables ===
  static ApTable = [
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

export class T4DActorSheet extends foundry.documents.api.DocumentSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["t4d", "sheet", "actor"],
      template: "systems/T4D/templates/sheets/actor-FoundryAIBIO.html",
      width: 800,
      height: 1000,
    });
  }

  getData() {
    const data = super.getData();
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

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

  // =====================
  // Skill Rolls
  // =====================

  /**
   * Handle rolling a Bio Skill
   */
  async _onSkillRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = parseInt(button.dataset.index);
    const actor = this.actor;

    const skill = getProperty(actor.system, group)?.[index];
    if (!skill) {
      ui.notifications.error(
        `Could not find skill in ${group} at index ${index}.`
      );
      return;
    }

    const attribute = skill.attribute || "DEX";
    const attrMod =
      getProperty(actor.system.attributes.primary, `${attribute}Mod`) ?? 0;
    const stressPenalty = actor.system.stress?.penalty ?? 0;

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

    const formula = `1d20 + ${skill.level} + ${attrMod} + ${stressPenalty} + ${otherMod}`;
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

    const skill = getProperty(actor.system, group)?.[index];
    if (!skill) {
      ui.notifications.error(
        `Could not find AI skill in ${group} at index ${index}.`
      );
      return;
    }

    const attribute = skill.attribute || "PRC";
    const attrMod =
      getProperty(actor.system.attributesAI.primary, `${attribute}Mod`) ?? 0;
    const fragmentPenalty = actor.system.vitalsAI?.fragmentation?.penalty ?? 0;

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

    const formula = `1d20 + ${skill.level} + ${attrMod} + ${fragmentPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${skill.label} AI Skill Check`,
    });
  }

  // =====================
  // Save Rolls
  // =====================

  /**
   * Handle rolling a Bio Save
   */
  async _onSaveRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const label = button.dataset.label;
    const actor = this.actor;

    const saveKey = label?.toUpperCase();
    const saveValue = actor.system.saves?.[saveKey];

    if (saveValue === undefined) {
      ui.notifications.error(`Could not find Bio save: ${label}`);
      return;
    }

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

    const formula = `1d20 + ${saveValue} + ${stressPenalty} + ${otherMod}`;
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

    const saveKey = label?.toUpperCase();
    const saveValue = actor.system.vitalsAI.saves?.[saveKey];

    if (saveValue === undefined) {
      ui.notifications.error(`Could not find AI save: ${label}`);
      return;
    }

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

    const formula = `1d20 + ${saveValue} + ${fragmentPenalty} + ${otherMod}`;
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

    // Determine attribute
    let attribute = "DEX";
    if (weapon.skill === "Simple") attribute = "STR";

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
      flavor: `${weapon.name} Attack`,
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

    // Determine attribute
    let attribute = "PRC";
    if (weapon.skill === "Simple") attribute = "COR";

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
      flavor: `${weapon.name} AI Attack`,
    });
  }

  /**
   * Handle rolling a Nanite Roll
   */
  async _onNaniteRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const { label } = button.dataset;
    const actor = this.actor;

    // Prompt for die type
    const dieType = await new Promise((resolve) => {
      new Dialog({
        title: `Choose Die Type for ${label}`,
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
        title: `Other Modifiers: ${label}`,
        content: `<p>Enter any additional modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
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
      flavor: `${label} Nanite Roll`,
    });
  }

  /**
   * Handle rolling a Nanite Reaction (Bio)
   */
  async _onNaniteReactionRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const { group, index } = button.dataset;
    const actor = this.actor;
    const idx = Number(index);

    const reaction = getProperty(actor.system, group)?.[idx];
    if (!reaction) {
      ui.notifications.error(
        `Could not find reaction in ${group} at index ${idx}.`
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
        content: `<p>Enter any other modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
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

    const formula = `1d20 + ${reaction.level} + ${attrMod} + ${stressPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${reaction.name} Nanite Reaction`,
    });
  }

  /**
   * Handle rolling an AI Nanite Reaction
   */
  async _onAINaniteReactionRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const { group, index } = button.dataset;
    const actor = this.actor;
    const idx = Number(index);

    const reaction = getProperty(actor.system, group)?.[idx];
    if (!reaction) {
      ui.notifications.error(
        `Could not find AI reaction in ${group} at index ${idx}.`
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

    // Prompt for other modifiers
    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${reaction.name}`,
        content: `<p>Enter any other modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
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

    const formula = `1d20 + ${reaction.level} + ${attrMod} + ${fragmentationPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${reaction.name} AI Nanite Reaction`,
    });
  }

  // Handle rolling Bio Initiative
  async _onInitRoll(event) {
    event.preventDefault();
    const actor = this.actor;

    const actionSpeed = await new Promise((resolve) => {
      new Dialog({
        title: "Action Speed Modifier",
        content: `<p>Enter any action speed modifier:</p>
                <input type="number" name="actionSpeed" value="0"/>`,
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

    const initMod =
      getProperty(actor.system, "attributes.secondary.INITMod") ?? 0;

    // Lower is better: subtract INITMod, add action speed
    const formula = `2d4 - ${initMod} + ${actionSpeed}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: "Initiative Roll",
    });

    const combatant = game.combat?.combatants?.find(
      (c) => c.actorId === actor.id
    );
    if (combatant) {
      await combatant.update({ initiative: roll.total });
    }
  }

  // Handle rolling AI Initiative (Queue Roll)
  async _onQueueRoll(event) {
    event.preventDefault();
    const actor = this.actor;

    const actionCycles = await new Promise((resolve) => {
      new Dialog({
        title: "Action Cycles Modifier",
        content: `<p>Enter any action cycles modifier:</p>
                <input type="number" name="actionCycles" value="0"/>`,
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
      getProperty(actor.system, "attributesAI.secondary.QUEUEMod") ?? 0;

    // Lower is better: subtract QUEUEMod, add action cycles
    const formula = `2d4 - ${queueMod} + ${actionCycles}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: "AI Initiative (Queue) Roll",
    });

    const combatant = game.combat?.combatants?.find(
      (c) => c.actorId === actor.id
    );
    if (combatant) {
      await combatant.update({ initiative: roll.total });
    }
  }
}
