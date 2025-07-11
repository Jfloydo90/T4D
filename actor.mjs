Actors.registerSheet("the-fourth-domain", FourthDomainAIBIOSheet, {
  types: ["Character", "NPC"],
  makeDefault: true
});

Actors.unregisterSheet("core", ActorSheet, { types: ["Character", "NPC"] });
