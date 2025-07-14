export class T4DActor extends Actor {
  prepareData() {
    super.prepareData();
    const system = this.system;

    // Compute Appearance Descriptor
    const appScore = parseInt(system.attributes?.appearance?.score || 3);
    const appIndex = Math.max(0, appScore - 3);
    system.attributes.appearance.desc =
      this.constructor.HumanAppTable[appIndex] || "Unknown";

    // Compute Likeness Descriptor
    const likeScore = parseInt(
      system.attributesAI?.secondary?.LIKE?.score || 3
    );
    const likeIndex = Math.max(0, likeScore - 3);
    system.attributesAI.secondary.LIKE.desc =
      this.constructor.LikeTable[likeIndex] || "Unknown";

    // Compute AP thresholds
    const statToAPT = {
      STR: "STRAPT",
      DEX: "DEXAPT",
      CON: "CONAPT",
      INT: "INTAPT",
      FOC: "FOCAPT",
      CHA: "CHAAPT",
      PRC: "PRCAPT",
      SEN: "SENAPT",
      ARC: "ARCAPT",
      LOG: "LOGAPT",
      COR: "CORAPT",
      SOCIAL: "SOCIALAPT",
    };

    for (let [stat, field] of Object.entries(statToAPT)) {
      const val = parseInt(system.attributes?.primary?.[stat]?.score || 1);
      system.attributes.primary[field] =
        this.constructor.ApTable[val - 1] || "1";
    }

    // Compute Bio Modifiers and APN
    const bioStats = ["STR", "DEX", "CON", "INT", "FOC", "CHA"];
    for (let stat of bioStats) {
      const score = parseInt(system.attributes.primary[stat]?.score || 1);
      const temp = parseInt(system.attributes.primary[stat]?.temp || 0);
      const mod = Math.floor(score / 5) - 2 + temp;
      system.attributes.primary[stat + "Mod"] = mod;
      system.attributes.primary[stat + "APN"] = mod + 3;
    }

    // Compute AI Modifiers and APN
    const aiStats = ["PRC", "SEN", "ARC", "LOG", "COR", "SOCIAL"];
    for (let stat of aiStats) {
      const score = parseInt(system.attributesAI.primary[stat]?.score || 1);
      const temp = parseInt(system.attributesAI.primary[stat]?.temp || 0);
      const mod = Math.floor(score / 5) - 2 + temp;
      system.attributesAI.primary[stat + "Mod"] = mod;
      system.attributesAI.primary[stat + "APN"] = mod + 3;
    }

    // Compute Bio Gear Sums
    system.gear = {};
    system.gear.itemTotal =
      system.items?.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0) ||
      0;
    system.gear.weaponTotal =
      system.weapons?.reduce(
        (sum, w) => sum + (parseFloat(w.weight) || 0),
        0
      ) || 0;
    system.gear.armorTotal =
      system.armor?.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0) ||
      0;
    system.gear.carriedWeight =
      system.gear.itemTotal + system.gear.weaponTotal + system.gear.armorTotal;
    system.gear.readiedTotal = [
      ...(system.items ?? []),
      ...(system.weapons ?? []),
      ...(system.armor ?? []),
    ].filter((e) => e.readied).length;

    // Compute AI Gear Sums
    system.gearAI = {};
    system.gearAI.itemTotal =
      system.itemsAI?.reduce(
        (sum, i) => sum + (parseFloat(i.weight) || 0),
        0
      ) || 0;
    system.gearAI.weaponTotal =
      system.weaponsAI?.reduce(
        (sum, w) => sum + (parseFloat(w.weight) || 0),
        0
      ) || 0;
    system.gearAI.armorTotal =
      system.armorAI?.reduce(
        (sum, a) => sum + (parseFloat(a.weight) || 0),
        0
      ) || 0;
    system.gearAI.carriedWeight =
      system.gearAI.itemTotal +
      system.gearAI.weaponTotal +
      system.gearAI.armorTotal;
    system.gearAI.readiedTotal = [
      ...(system.itemsAI ?? []),
      ...(system.weaponsAI ?? []),
      ...(system.armorAI ?? []),
    ].filter((e) => e.readied).length;

    // Bio Encumbrance (based on STR)
    const strScore = parseInt(system.attributes?.primary?.STR?.score || 1);
    const baseEnc = Math.floor(strScore / 5) - 2 + 5;
    system.gear.encumbranceThresholds = {
      light: baseEnc,
      moderate: baseEnc * 2,
      heavy: baseEnc * 3,
      max: baseEnc * 4,
      pushDrag: baseEnc * 5,
    };

    // AI Encumbrance (based on PRC)
    const prcScore = parseInt(system.attributesAI?.primary?.PRC?.score || 1);
    const baseEncAI = Math.floor(prcScore / 5) - 2 + 5;
    system.gearAI.thresholds = {
      light: baseEncAI,
      moderate: baseEncAI * 2,
      heavy: baseEncAI * 3,
      max: baseEncAI * 4,
      pushDrag: baseEncAI * 5,
    };

    // Compute Bio Secondary Attributes
    system.attributes.secondary = system.attributes.secondary || {};

    const foc = parseInt(system.attributes.primary?.FOC?.score || 1);
    const dex = parseInt(system.attributes.primary?.DEX?.score || 1);
    const int = parseInt(system.attributes.primary?.INT?.score || 1);
    const strB = parseInt(system.attributes.primary?.STR?.score || 1);

    // Initiative
    const init = Math.floor((foc + dex) / 2);
    const initTemp = parseInt(system.attributes.secondary?.INITTemp || 0);
    const initMod = Math.floor(init / 5) - 2 + initTemp;
    system.attributes.secondary.INIT = init;
    system.attributes.secondary.INITMod = initMod;

    // Education
    const edu = Math.floor((foc + int) / 2);
    const eduTemp = parseInt(system.attributes.secondary?.EDUTemp || 0);
    const eduMod = Math.floor(edu / 5) - 2 + eduTemp;
    system.attributes.secondary.EDU = edu;
    system.attributes.secondary.EDUMod = eduMod;

    // Speed
    const spd = Math.floor((strB + dex) / 2);
    const spdTemp = parseInt(system.attributes.secondary?.SPDTemp || 0);
    const spdMod = Math.floor(spd / 5) - 2 + spdTemp;
    system.attributes.secondary.SPD = spd;
    system.attributes.secondary.SPDMod = spdMod;

    // Movement
    const mvmtTemp = parseInt(system.attributes.secondary?.MVMTTemp || 0);
    const mvmt = spd * 2 + mvmtTemp;
    system.attributes.secondary.MVMT = mvmt;

    // Compute AI Secondary Attributes
    system.attributesAI.secondary = system.attributesAI.secondary || {};

    const cor = parseInt(system.attributesAI.primary?.COR?.score || 1);
    const sen = parseInt(system.attributesAI.primary?.SEN?.score || 1);
    const log = parseInt(system.attributesAI.primary?.LOG?.score || 1);
    const prcA = parseInt(system.attributesAI.primary?.PRC?.score || 1);
    const arc = parseInt(system.attributesAI.primary?.ARC?.score || 1);
    const social = parseInt(system.attributesAI.primary?.SOCIAL?.score || 1);

    // Queue
    const queue = Math.floor((cor + sen) / 2);
    const queueTemp = parseInt(system.attributesAI.secondary?.QueueTemp || 0);
    const queueMod = Math.floor(queue / 5) - 2 + queueTemp;
    system.attributesAI.secondary.QUEUE = queue;
    system.attributesAI.secondary.QUEUEMod = queueMod;

    // Learning
    const lea = Math.floor((cor + log) / 2);
    const leaTemp = parseInt(system.attributesAI.secondary?.LeaTemp || 0);
    const leaMod = Math.floor(lea / 5) - 2 + leaTemp;
    system.attributesAI.secondary.LEA = lea;
    system.attributesAI.secondary.LEAMod = leaMod;

    // Cycles
    const cyc = Math.floor((prcA + sen) / 2);
    const cycTemp = parseInt(system.attributesAI.secondary?.CycTemp || 0);
    const cycMod = Math.floor(cyc / 5) - 2 + cycTemp;
    system.attributesAI.secondary.CYC = cyc;
    system.attributesAI.secondary.CYCMod = cycMod;

    // Latency
    const latnTemp = parseInt(system.attributesAI.secondary?.LatnTemp || 0);
    const latn = cyc * 2 + latnTemp;
    system.attributesAI.secondary.LATN = latn;

    // Compute Bio Saving Throws
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

    // Compute Bio Status
    system.status = system.status || {};
    system.status.hp = system.status.hp || {};
    system.status.mp = system.status.mp || {};

    system.status.hp.max =
      Math.floor((strB + con) / 2) + parseInt(system.status.hp?.temp || 0);
    system.status.hp.min = (system.saves.PHYS || 0) * -1;

    system.status.mp.max =
      Math.floor((con + foc) / 2) + parseInt(system.status.mp?.temp || 0);
    system.status.mp.min = (system.saves.MENT || 0) * -1;

    // Compute AI Saving Throws
    system.vitalsAI = system.vitalsAI || {};
    system.vitalsAI.saves = system.vitalsAI.saves || {};

    system.vitalsAI.saves.OVER =
      Math.floor((prcA + arc) / 4) +
      parseInt(system.vitalsAI.saves?.OverTemp || 0);
    system.vitalsAI.saves.INTE =
      Math.floor((log + cor) / 4) +
      parseInt(system.vitalsAI.saves?.InteTemp || 0);
    system.vitalsAI.saves.BYPA =
      Math.floor((cor + sen) / 4) +
      parseInt(system.vitalsAI.saves?.BypaTemp || 0);
    system.vitalsAI.saves.FIR =
      Math.floor((social + log) / 4) +
      parseInt(system.vitalsAI.saves?.FirTemp || 0);

    // Compute AI Status
    system.vitalsAI.status = system.vitalsAI.status || {};
    system.vitalsAI.status.IP = system.vitalsAI.status.IP || {};
    system.vitalsAI.status.PP = system.vitalsAI.status.PP || {};

    system.vitalsAI.status.IP.max =
      Math.floor((prcA + arc) / 2) +
      parseInt(system.vitalsAI.status.IP?.temp || 0);
    system.vitalsAI.status.IP.min = (system.vitalsAI.saves.OVER || 0) * -1;

    system.vitalsAI.status.PP.max =
      Math.floor((arc + cor) / 2) +
      parseInt(system.vitalsAI.status.PP?.temp || 0);
    system.vitalsAI.status.PP.min = (system.vitalsAI.saves.INTE || 0) * -1;

    // Add hasRoll
    system.attributes.secondary = system.attributes.secondary || {};
    system.attributes.secondary.INIT = system.attributes.secondary.INIT || {};
    system.attributes.secondary.INIT.hasRoll = true;

    system.attributesAI.secondary = system.attributesAI.secondary || {};
    system.attributesAI.secondary.QUEUE =
      system.attributesAI.secondary.QUEUE || {};
    system.attributesAI.secondary.QUEUE.hasRoll = true;

    // Populate labels for Bio Skills
    const bioSkillGroups = [
      system.skills?.combat,
      system.skills?.detection,
      system.skills?.trainingPackages,
    ];
    for (let group of bioSkillGroups) {
      if (!group) continue;
      for (let skill of group) {
        skill.label = skill.label || skill.name || "Skill";
        skill.attribute = skill.attribute || "DEX"; // Default attribute for new skills
      }
    }

    // Populate labels for AI Skills
    const aiSkillGroups = [
      system.skillsAI?.combat,
      system.skillsAI?.detection,
      system.skillsAI?.trainingPackages,
    ];
    for (let group of aiSkillGroups) {
      if (!group) continue;
      for (let skill of group) {
        skill.label = skill.label || skill.name || "Skill";
        skill.attribute = skill.attribute || "PRC"; // Default attribute for AI skills
      }
    }
  }

  // Static lookup tables
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

export class FourthDomainAIBIOSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
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

    // Roll Listeners
    html.find(".roll-skill").click(this._onSkillRoll.bind(this));
    html.find(".roll-ai-skill").click(this._onAISkillRoll.bind(this));
    html.find(".roll-save").click(this._onSaveRoll.bind(this));
    html.find(".roll-ai").click(this._onAISaveRoll.bind(this));
    html.find(".roll-init").click(this._onInitRoll.bind(this));
    html.find(".roll-ai-init").click(this._onQueueRoll.bind(this));
    html.find(".roll-weapon").click(this._onWeaponRoll.bind(this));
    html.find(".roll-ai-weapon").click(this._onAIWeaponRoll.bind(this));
    html
      .find(".roll-nanite, .roll-ai-nanite")
      .click(this._onNaniteRoll.bind(this));
    html
      .find(".roll-nanite-reaction")
      .click(this._onNaniteReactionRoll.bind(this));
    html.find(".roll-ai-nanite").click(this._onAINaniteReactionRoll.bind(this));
  }

  // Skill rolls
  //Handle rolling a Bio skill
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
      getProperty(actor.system.attributes.primary, attribute + "Mod") || 0;
    const stressPenalty = actor.system.stress?.penalty || 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${skill.label}`,
        content: `<p>Enter any other modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) => {
              resolve(parseInt(html.find("[name=otherMod]").val()) || 0);
            },
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

  //Handle rolling an AI skill
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

    const attribute = skill.attribute || "PRC"; // Default AI attribute
    const attrMod =
      getProperty(actor.system.attributesAI.primary, attribute + "Mod") || 0;
    const fragmentPenalty = actor.system.vitalsAI?.fragmentation?.penalty || 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${skill.label}`,
        content: `<p>Enter any other modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) => {
              resolve(parseInt(html.find("[name=otherMod]").val()) || 0);
            },
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

  //Handle rolling a Bio save
  async _onSaveRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const label = button.dataset.label;
    const actor = this.actor;

    // Convert label to uppercase property (e.g., "PHYS")
    const saveKey = label?.toUpperCase();
    const saveValue = actor.system.saves?.[saveKey];

    if (saveValue === undefined) {
      ui.notifications.error(`Could not find Bio save: ${label}`);
      return;
    }

    const stressPenalty = actor.system.stress?.penalty || 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${label} Save`,
        content: `<p>Enter any other modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) => {
              resolve(parseInt(html.find("[name=otherMod]").val()) || 0);
            },
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

  //Handle rolling an AI save
  async _onAISaveRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const label = button.dataset.label;
    const actor = this.actor;

    // Convert label to uppercase property (e.g., "OVER")
    const saveKey = label?.toUpperCase();
    const saveValue = actor.system.vitalsAI.saves?.[saveKey];

    if (saveValue === undefined) {
      ui.notifications.error(`Could not find AI save: ${label}`);
      return;
    }

    const fragmentPenalty = actor.system.vitalsAI?.fragmentation?.penalty || 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${label} Save`,
        content: `<p>Enter any other modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) => {
              resolve(parseInt(html.find("[name=otherMod]").val()) || 0);
            },
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

  //Handle rolling a Bio Weapon attack
  async _onWeaponRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = parseInt(button.dataset.index);
    const actor = this.actor;

    const weapon = getProperty(actor.system, group)?.[index];
    if (!weapon) {
      ui.notifications.error(
        `Could not find weapon in ${group} at index ${index}.`
      );
      return;
    }

    // Determine attribute based on weapon.skill
    let attribute = "DEX";
    if (weapon.skill === "Projectile") attribute = "DEX";
    else if (weapon.skill === "Simple") attribute = "STR";

    const attrMod =
      getProperty(actor.system.attributes.primary, attribute + "Mod") || 0;
    const stressPenalty = actor.system.stress?.penalty || 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${weapon.name}`,
        content: `<p>Enter any other modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) => {
              resolve(parseInt(html.find("[name=otherMod]").val()) || 0);
            },
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

  //Handle rolling an AI Weapon attack
  async _onAIWeaponRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = parseInt(button.dataset.index);
    const actor = this.actor;

    const weapon = getProperty(actor.system, group)?.[index];
    if (!weapon) {
      ui.notifications.error(
        `Could not find AI weapon in ${group} at index ${index}.`
      );
      return;
    }

    // Determine attribute based on weapon.skill
    let attribute = "DEX";
    if (weapon.skill === "Projectile") attribute = "DEX";
    else if (weapon.skill === "Simple") attribute = "STR";

    const attrMod =
      getProperty(actor.system.attributesAI.primary, attribute + "Mod") || 0;
    const fragmentationPenalty =
      actor.system.vitalsAI?.fragmentation?.penalty || 0;

    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${weapon.name}`,
        content: `<p>Enter any other modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) => {
              resolve(parseInt(html.find("[name=otherMod]").val()) || 0);
            },
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

    const formula = `1d20 + ${weapon.atkBonus} + ${attrMod} + ${fragmentationPenalty} + ${otherMod}`;

    const roll = await new Roll(formula).roll({ async: true });
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${weapon.name} AI Attack`,
    });
  }

  //Handle rolling a Nanite Roll
  async _onNaniteRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const dataset = button.dataset;
    const actor = this.actor;

    // Prompt for base die type
    const dieType = await new Promise((resolve) => {
      new Dialog({
        title: `Choose Die Type for ${dataset.label}`,
        content: `
        <p>Select Nanite potency:</p>
        <select name="die">
          <option value="1d4">Minor (1d4)</option>
          <option value="5d4">Major (5d4)</option>
        </select>`,
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
        title: `Other Modifiers: ${dataset.label}`,
        content: `<p>Enter any additional modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) =>
              resolve(parseInt(html.find("[name=otherMod]").val()) || 0),
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
      flavor: `${dataset.label} Nanite Roll`,
    });
  }

  // Handle rolling a Nanite Reaction (Bio)
  async _onNaniteReactionRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group;
    const index = parseInt(button.dataset.index);
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

    // Prompt for Other Modifiers
    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${reaction.name}`,
        content: `<p>Enter any other modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
        buttons: {
          ok: {
            label: "OK",
            callback: (html) =>
              resolve(parseInt(html.find("[name=otherMod]").val()) || 0),
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

    // Attribute mod
    const attrMod =
      getProperty(actor.system.attributes.primary, attribute + "Mod") || 0;

    // Stress penalty
    const stressPenalty = actor.system.stress?.penalty || 0;

    const formula = `1d20 + ${reaction.level} + ${attrMod} + ${stressPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${reaction.name} Nanite Reaction`,
    });
  }

  // Handle rolling an AI Nanite Reaction
  async _onAINaniteReactionRoll(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const group = button.dataset.group; // e.g., "naniteAI.basicReactions" or "naniteAI.advancedReactions"
    const index = parseInt(button.dataset.index);
    const actor = this.actor;

    // Retrieve the reaction
    const reaction = getProperty(actor.system, group)?.[index];
    if (!reaction) {
      ui.notifications.error(
        `Could not find AI reaction in ${group} at index ${index}.`
      );
      return;
    }

    // Prompt user for which attribute modifier to use
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

    if (attribute === null) return;

    const attrMod =
      getProperty(actor.system.attributesAI.primary, `${attribute}Mod`) || 0;
    const fragmentationPenalty =
      actor.system.vitalsAI?.fragmentation?.penalty || 0;

    // Prompt for other modifiers
    const otherMod = await new Promise((resolve) => {
      new Dialog({
        title: `Other Modifiers: ${reaction.name}`,
        content: `<p>Enter any other modifiers:</p>
                <input type="number" name="otherMod" value="0"/>`,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) => {
              resolve(parseInt(html.find("[name=otherMod]").val()) || 0);
            },
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

    // Build formula and roll
    const formula = `1d20 + ${reaction.level} + ${attrMod} + ${fragmentationPenalty} + ${otherMod}`;
    const roll = await new Roll(formula).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `${reaction.name} Nanite Reaction`,
    });
  }

  //Handle rolling Bio Initiative
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
            callback: (html) => {
              resolve(parseInt(html.find("[name=actionSpeed]").val()) || 0);
            },
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
      getProperty(actor.system, "attributes.secondary.INITMod") || 0;

    // Lower is better, so subtract INITMod, add action speed penalty
    const formula = `2d4 - ${initMod} + ${actionSpeed}`;

    const roll = await new Roll(formula).roll({ async: true });
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: "Initiative Roll",
    });

    // Optionally set initiative if in combat
    const combatant = game.combat?.combatants?.find(
      (c) => c.actorId === actor.id
    );
    if (combatant) {
      await combatant.update({ initiative: roll.total });
    }
  }

  //Handle rolling AI Initiative (Queue Roll)
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
            callback: (html) => {
              resolve(parseInt(html.find("[name=actionCycles]").val()) || 0);
            },
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
      getProperty(actor.system, "attributesAI.secondary.QUEUEMod") || 0;

    // Lower is better: subtract QUEUEMod, add action cycles penalty
    const formula = `2d4 - ${queueMod} + ${actionCycles}`;

    const roll = await new Roll(formula).roll({ async: true });
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: "AI Initiative (Queue) Roll",
    });

    // Optionally set initiative if in combat
    const combatant = game.combat?.combatants?.find(
      (c) => c.actorId === actor.id
    );
    if (combatant) {
      await combatant.update({ initiative: roll.total });
    }
  }
}
