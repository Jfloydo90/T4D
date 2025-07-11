Actors.registerSheet("T4D", FourthDomainAIBIOSheet, {
  types: ["character", "npc"],
  makeDefault: true
});

Actors.unregisterSheet("core", ActorSheet, { types: ["character", "npc"] });
