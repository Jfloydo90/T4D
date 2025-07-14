import { T4DActor } from "./actor.mjs";
import { FourthDomainAIBIOSheet } from "./actor.mjs";

Hooks.once("init", () => {
  console.log("T4D system initializing...");

  CONFIG.Actor.documentClass = T4DActor;

  CONFIG.Actor.typeLabels = {
    character: "Character",
    npc: "NPC",
  };

  Actors.registerSheet("t4d", FourthDomainAIBIOSheet, {
    types: ["character", "npc"],
    makeDefault: true,
  });

  Actors.unregisterSheet("core", ActorSheet, { types: ["character", "npc"] });
});
