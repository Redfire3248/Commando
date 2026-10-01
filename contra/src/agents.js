// The five agents. Everyone carries the same rifle; agents differ in health, speed and one ability.
// Art comes from assets/agents.png (sliced into the 'agents' sheet, see CG.DATA.art.agents); without it the old
// commandos are used, recoloured per agent.
//   hp        hearts
//   speed     run speed multiplier
//   ability   name, what it does (shown in the agent picker), cooldown in ms
CG.AGENTS = [
  {
    id: 'razor', name: 'RAZOR', role: 'Heavy gunner', color: '#ff8a3c', hp: 6, speed: 0.94, fallback: 'commandos', fallbackWho: 1,
    ability: { name: 'Bullet Storm', desc: 'For 5 seconds: double fire rate and a three-way spread.', cd: 18000, dur: 5000 },
  },
  {
    id: 'nova', name: 'NOVA', role: 'Field medic', color: '#3fd8c8', hp: 5, speed: 1, fallback: 'commandos_2', fallbackWho: 0,
    ability: { name: 'Mend', desc: 'Heals you and every teammate nearby by 3 hearts.', cd: 16000, range: 650, heal: 3 },
  },
  {
    id: 'kite', name: 'KITE', role: 'Scout', color: '#58e05a', hp: 4, speed: 1.16, fallback: 'commandos_3', fallbackWho: 0,
    ability: { name: 'Phase Dash', desc: 'Dash forward untouchable, cutting through every enemy in the way.', cd: 6000, dist: 430, damage: 3 },
  },
  {
    id: 'brick', name: 'BRICK', role: 'Breacher', color: '#5aa2ff', hp: 8, speed: 0.9, fallback: 'commandos', fallbackWho: 0,
    ability: { name: 'Aegis', desc: 'A shield dome for 5 seconds: nothing can hurt you.', cd: 20000, dur: 5000 },
  },
  {
    id: 'volt', name: 'VOLT', role: 'Tech marksman', color: '#c878ff', hp: 5, speed: 1, fallback: 'commandos_4', fallbackWho: 0,
    ability: { name: 'Chain Arc', desc: 'Lightning jumps between up to 5 enemies on screen.', cd: 12000, targets: 5, damage: 4 },
  },
];
CG.AGENT = {};
CG.AGENTS.forEach((a) => { CG.AGENT[a.id] = a; });
