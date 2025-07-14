// Import your classes
import { T4DActor, T4DActorSheet } from "./actor.mjs";

Hooks.once("init", () => {
  console.log("T4D system initializing...");

  // Register your custom Actor document class
  CONFIG.Actor.documentClass = T4DActor;

  // Label types
  CONFIG.Actor.typeLabels = {
    character: "Character",
    npc: "NPC",
  };

  // Register your custom sheet
  foundry.documents.collections.Actors.registerSheet("T4D", T4DActorSheet, {
    types: ["character", "npc"],
    makeDefault: true,
  });

  // Unregister the default sheet
  foundry.documents.collections.Actors.unregisterSheet(
    "core",
    foundry.applications.sheets.ActorSheet,
    {
      types: ["character", "npc"],
    }
  );
});
