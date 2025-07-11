import { FourthDomainActor } from "./actor.mjs";

// ===== STATIC TABLES =====
const ApTable = [
  '1','2','3','4','5','7','9','11','13','15','18','21','24','27','30','34','38','42','46','50',
  '55','60','65','70','75','81','87','93','99','105','112','119','126','133','140','148','156','164',
  '172','180','189','198','207','216','225','235','245','255','265','275','286','297','308','319',
  '330','342','354','366','378','390','403','416','429','442','455','469','483','497','511','525',
  '540','555','570','585','600','616','632','648','664','680','697','714','731','748','765','783',
  '801','819','837','855','874','893','912','931','950'
];

const HumanAppTable = [
  'Revolting','Hideous','Hideous','Hideous','Ugly','Ugly','Ugly','Ugly',
  'Unattractive','Unattractive','Unattractive','Unattractive',
  'Average','Average','Average','Average',
  'Attractive','Attractive','Attractive','Attractive',
  'Beautiful','Beautiful','Beautiful','Beautiful',
  'Gorgeous','Gorgeous','Gorgeous','Perfection'
];

const LikeTable = [
  'Corrupt Shell','Fragmented Data','Fragmented Data','Fragmented Data',
  'Uncanny Static','Uncanny Static','Uncanny Static','Uncanny Static',
  'Broken Render','Broken Render','Unattractive','Broken Render',
  'Baseline Interface','Baseline Interface','Baseline Interface','Baseline Interface',
  'Adaptive Persona','Adaptive Persona','Adaptive Persona','Adaptive Persona',
  'Emotive Resonance','Emotive Resonance','Emotive Resonance','Emotive Resonance',
  'Enthralling Projection','Enthralling Projection','Enthralling Projection','Divine Algorithm'
];

export class FourthDomainAIBIOSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["the-fourth-domain", "sheet", "actor"],
      template: "systems/the-fourth-domain/templates/sheets/actor-FoundryAIBIO.html",
      width: 800,
      height: 1000
    });
  }

  getData() {
    const data = super.getData();
    const system = this.actor.system;

    // Compute Appearance Descriptor
    const appScore = parseInt(system.attributes?.appearance?.score || 3);
    const appIndex = Math.max(0, appScore - 3);
    system.attributes.appearance.desc = HumanAppTable[appIndex] || "Unknown";

    // Compute Likeness Descriptor
    const likeScore = parseInt(system.attributesAI?.secondary?.LIKE?.score || 3);
    const likeIndex = Math.max(0, likeScore - 3);
    system.attributesAI.secondary.LIKE.desc = LikeTable[likeIndex] || "Unknown";

    // Compute AP thresholds
    const statToAPT = {
      STR: "STRAPT", DEX: "DEXAPT", CON: "CONAPT",
      INT: "INTAPT", FOC: "FOCAPT", CHA: "CHAAPT",
      PRC: "PRCAPT", SEN: "SENAPT", ARC: "ARCAPT",
      LOG: "LOGAPT", COR: "CORAPT", SOCIAL: "SOCIALAPT"
    };

    for (let [stat, field] of Object.entries(statToAPT)) {
      const val = parseInt(system.attributes?.primary?.[stat]?.score || 1);
      system.attributes.primary[field] = ApTable[val - 1] || "1";
    }

    // Compute Bio Modifiers and APN
    const bioStats = ["STR","DEX","CON","INT","FOC","CHA"];
    for (let stat of bioStats) {
      const score = parseInt(system.attributes.primary[stat]?.score || 1);
      const temp = parseInt(system.attributes.primary[stat]?.temp || 0);
      const mod = Math.floor(score / 5) - 2 + temp;
      system.attributes.primary[stat + "Mod"] = mod;
      system.attributes.primary[stat + "APN"] = mod + 3;
    }

    // Compute AI Modifiers and APN
    const aiStats = ["PRC","SEN","ARC","LOG","COR","SOCIAL"];
    for (let stat of aiStats) {
      const score = parseInt(system.attributesAI.primary[stat]?.score || 1);
      const temp = parseInt(system.attributesAI.primary[stat]?.temp || 0);
      const mod = Math.floor(score / 5) - 2 + temp;
      system.attributesAI.primary[stat + "Mod"] = mod;
      system.attributesAI.primary[stat + "APN"] = mod + 3;
    }

    // Compute Bio Gear Sums
    system.gear = {};
    system.gear.itemTotal = system.items?.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0) || 0;
    system.gear.weaponTotal = system.weapons?.reduce((sum, w) => sum + (parseFloat(w.weight) || 0), 0) || 0;
    system.gear.armorTotal = system.armor?.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0) || 0;
    system.gear.carriedWeight = system.gear.itemTotal + system.gear.weaponTotal + system.gear.armorTotal;
    system.gear.readiedTotal = [
      ...(system.items ?? []),
      ...(system.weapons ?? []),
      ...(system.armor ?? [])
    ].filter(e => e.readied).length;

    // Compute AI Gear Sums
    system.gearAI = {};
    system.gearAI.itemTotal = system.itemsAI?.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0) || 0;
    system.gearAI.weaponTotal = system.weaponsAI?.reduce((sum, w) => sum + (parseFloat(w.weight) || 0), 0) || 0;
    system.gearAI.armorTotal = system.armorAI?.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0) || 0;
    system.gearAI.carriedWeight = system.gearAI.itemTotal + system.gearAI.weaponTotal + system.gearAI.armorTotal;
    system.gearAI.readiedTotal = [
      ...(system.itemsAI ?? []),
      ...(system.weaponsAI ?? []),
      ...(system.armorAI ?? [])
    ].filter(e => e.readied).length;

    // Bio Encumbrance (based on STR)
    const strScore = parseInt(system.attributes?.primary?.STR?.score || 1);
    const baseEnc = ((Math.floor(strScore / 5) - 2) + 5);
    system.gear.encumbranceThresholds = {
      light: baseEnc,
      moderate: baseEnc * 2,
      heavy: baseEnc * 3,
      max: baseEnc * 4,
      pushDrag: baseEnc * 5
    };

    // AI Encumbrance (based on PRC)
    const prcScore = parseInt(system.attributesAI?.primary?.PRC?.score || 1);
    const baseEncAI = ((Math.floor(prcScore / 5) - 2) + 5);
    system.gearAI.thresholds = {
      light: baseEncAI,
      moderate: baseEncAI * 2,
      heavy: baseEncAI * 3,
      max: baseEncAI * 4,
      pushDrag: baseEncAI * 5
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

    // Queue
    const queue = Math.floor((cor + sen) / 2);
    const queueTemp = parseInt(system.attributesAI.secondary?.QueueTemp || 0);
    const queueMod = Math.floor(queue / 5) - 2 + queueTemp;
    system.attributesAI.secondary.QUEUE = queue;
    system.attributesAI.secondary.QueueMod = queueMod;

    // Learning
    const lea = Math.floor((cor + log) / 2);
    const leaTemp = parseInt(system.attributesAI.secondary?.LeaTemp || 0);
    const leaMod = Math.floor(lea / 5) - 2 + leaTemp;
    system.attributesAI.secondary.LEA = lea;
    system.attributesAI.secondary.LeaMod = leaMod;

    // Cycles
    const cyc = Math.floor((prcA + sen) / 2);
    const cycTemp = parseInt(system.attributesAI.secondary?.CycTemp || 0);
    const cycMod = Math.floor(cyc / 5) - 2 + cycTemp;
    system.attributesAI.secondary.CYC = cyc;
    system.attributesAI.secondary.CycMod = cycMod;

    // Latency
    const latnTemp = parseInt(system.attributesAI.secondary?.LatnTemp || 0);
    const latn = cyc * 2 + latnTemp;
    system.attributesAI.secondary.LATN = latn;

    // Compute Bio Saving Throws
    system.saves = system.saves || {};

    const con = parseInt(system.attributes.primary?.CON?.score || 1);
    const cha = parseInt(system.attributes.primary?.CHA?.score || 1);

    system.saves.PHYS = Math.floor((strB + con) / 4) + parseInt(system.saves?.PhysTemp || 0);
    system.saves.MENT = Math.floor((int + foc) / 4) + parseInt(system.saves?.MentTemp || 0);
    system.saves.EVAS = Math.floor((foc + dex) / 4) + parseInt(system.saves?.EvasTemp || 0);
    system.saves.SOC = Math.floor((cha + int) / 4) + parseInt(system.saves?.SocTemp || 0);

    // Compute Bio Status
    system.status = system.status || {};
    system.status.hp = system.status.hp || {};
    system.status.mp = system.status.mp || {};

    system.status.hp.max = Math.floor((strB + con) / 2) + parseInt(system.status.hp?.temp || 0);
    system.status.hp.min = (system.saves.PHYS || 0) * -1;

    system.status.mp.max = Math.floor((con + foc) / 2) + parseInt(system.status.mp?.temp || 0);
    system.status.mp.min = (system.saves.MENT || 0) * -1;
    // Compute AI Saving Throws
    system.vitalsAI = system.vitalsAI || {};
    system.vitalsAI.saves = system.vitalsAI.saves || {};

    const prcA = parseInt(system.attributesAI.primary?.PRC?.score || 1);
    const sen = parseInt(system.attributesAI.primary?.SEN?.score || 1);
    const arc = parseInt(system.attributesAI.primary?.ARC?.score || 1);
    const log = parseInt(system.attributesAI.primary?.LOG?.score || 1);
    const cor = parseInt(system.attributesAI.primary?.COR?.score || 1);
    const social = parseInt(system.attributesAI.primary?.SOCIAL?.score || 1);

    system.vitalsAI.saves.OVER = Math.floor((prcA + arc) / 4) + parseInt(system.vitalsAI.saves?.OverTemp || 0);
    system.vitalsAI.saves.INTE = Math.floor((log + cor) / 4) + parseInt(system.vitalsAI.saves?.InteTemp || 0);
    system.vitalsAI.saves.BYPA = Math.floor((cor + sen) / 4) + parseInt(system.vitalsAI.saves?.BypaTemp || 0);
    system.vitalsAI.saves.FIR = Math.floor((social + log) / 4) + parseInt(system.vitalsAI.saves?.FirTemp || 0);

    // Compute AI Status
    system.vitalsAI.status = system.vitalsAI.status || {};
    system.vitalsAI.status.IP = system.vitalsAI.status.IP || {};
    system.vitalsAI.status.PP = system.vitalsAI.status.PP || {};

    system.vitalsAI.status.IP.max = Math.floor((prcA + arc) / 2) + parseInt(system.vitalsAI.status.IP?.temp || 0);
    system.vitalsAI.status.IP.min = (system.vitalsAI.saves.OVER || 0) * -1;

    system.vitalsAI.status.PP.max = Math.floor((arc + cor) / 2) + parseInt(system.vitalsAI.status.PP?.temp || 0);
    system.vitalsAI.status.PP.min = (system.vitalsAI.saves.INTE || 0) * -1;

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Skill rolls
    html.find(".roll-skill").click(async ev => {
      const dataset = ev.currentTarget.dataset;
      const roll = await new Roll(dataset.roll).roll({ async: true });
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${dataset.label}`
      });
    });

    // Weapon rolls
    html.find(".roll-weapon").click(async ev => {
      const dataset = ev.currentTarget.dataset;
      const roll = await new Roll(dataset.roll).roll({ async: true });
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${dataset.label}`
      });
    });

    // Save rolls
    html.find(".roll-save").click(async ev => {
      const dataset = ev.currentTarget.dataset;
      const roll = await new Roll(dataset.roll).roll({ async: true });
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${dataset.label}`
      });
    });

    // Nanite rolls
    html.find(".roll-nanite").click(async ev => {
      const dataset = ev.currentTarget.dataset;
      const roll = await new Roll(dataset.roll).roll({ async: true });
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${dataset.label}`
      });
    });
    // Bio Initiative roll
    html.find(".roll-init").click(async ev => {
      // Prompt for Action Speed
      const actionSpeed = await new Promise(resolve => {
        new Dialog({
          title: "Action Speed",
          content: `
            <div>
              <label>Enter Action Speed modifier:</label>
              <input id="actionSpeed" type="number" value="0"/>
            </div>`,
          buttons: {
            ok: {
              label: "OK",
              callback: html => resolve(Number(html.find("#actionSpeed").val() || 0))
            }
          },
          default: "ok"
        }).render(true);
      });

      // Build roll formula
      const initMod = getProperty(this.actor.system, "attributes.secondary.INITMod") || 0;
      const rollFormula = `2d4 - ${initMod} + ${actionSpeed}`;

      // Roll
      const roll = await new Roll(rollFormula).roll({ async: true });

      // Send to chat
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Initiative Roll"
      });

      // Optionally add to combat tracker
      this.actor.combat?.setInitiative(roll.total);
    });

    // AI Initiative roll
    html.find(".roll-ai-init").click(async ev => {
      // Prompt for Action Cycles
      const actionCycles = await new Promise(resolve => {
        new Dialog({
          title: "Action Cycles",
          content: `
            <div>
              <label>Enter Action Cycles modifier:</label>
              <input id="actionCycles" type="number" value="0"/>
            </div>`,
          buttons: {
            ok: {
              label: "OK",
              callback: html => resolve(Number(html.find("#actionCycles").val() || 0))
            }
          },
          default: "ok"
        }).render(true);
      });

      // Get AI Queue modifier
      const queueMod = getProperty(this.actor.system, "attributesAI.secondary.QueueMod") || 0;

      // Build roll formula
      const rollFormula = `2d4 - ${queueMod} + ${actionCycles}`;

      // Roll
      const roll = await new Roll(rollFormula).roll({ async: true });

      // Send to chat
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "AI Initiative Roll"
      });

      // Optionally set initiative
      if (this.actor.combat) {
        this.actor.combat.setInitiative(roll.total);
      }
    });
  }
}

Hooks.once("init", () => {

  CONFIG.Actor.documentClass = FourthDomainActor;

  CONFIG.Actor.typeLabels = {
    character: "Character",
    npc: "NPC"
  };

  Actors.registerSheet("the-fourth-domain", FourthDomainAIBIOSheet, {
    types: ["character"],
    makeDefault: true
  });

  Actors.unregisterSheet("core", ActorSheet, { types: ["character"] });
});
