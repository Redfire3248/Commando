// The agents. Everyone carries the same rifle; agents differ in health, speed and one ability.
// Art: the five season-2 agents come from assets/agents.png (pixel art, the 'agents' sheet); JAX and DUKE are the
// two original painted commandos from assets/commandos.png (classic: true). Without those sheets the built-in
// pixel soldier is used.
//   hp        hearts
//   speed     run speed multiplier
//   ability   name, what it does (shown in the agent picker), cooldown in ms, and its numbers
CG.AGENTS = [
  {
    id: 'razor', name: 'RAZOR', role: 'Heavy gunner', color: '#ff8a3c', hp: 5, speed: 1, fallback: 'commandos', fallbackWho: 1,
    ability: { name: 'Bullet Storm', desc: '6 seconds of a five-way spray at double speed. Shots punch through the first enemy.', cd: 18000, dur: 6000 },
  },
  {
    id: 'nova', name: 'NOVA', role: 'Field medic', color: '#3fd8c8', hp: 5, speed: 1, fallback: 'commandos_2', fallbackWho: 0,
    ability: { name: 'Mend', desc: 'Heals you and every teammate nearby by 3 hearts, makes them untouchable for a moment, and brings back anyone who is out.', cd: 16000, range: 700, heal: 3 },
  },
  {
    // one dash, and it is the ability: any of eight directions from the held keys (W + SKILL = straight up).
    // The DASH key does the same for KITE; nobody has a separate Tac Dash any more (`dash` stays off).
    id: 'kite', name: 'KITE', role: 'Scout', color: '#58e05a', hp: 5, speed: 1, fallback: 'commandos_3', fallbackWho: 0, dashAbility: true,
    ability: { name: 'Phase Dash', desc: 'Dash in any direction — hold W to go straight up — untouchable, slicing every enemy in the way. A kill halves the cooldown.', cd: 4000, dist: 480, damage: 4 },
  },
  {
    id: 'brick', name: 'BRICK', role: 'Breacher', color: '#5aa2ff', hp: 5, speed: 1, fallback: 'commandos', fallbackWho: 0,
    ability: { name: 'Aegis', desc: 'A shield dome for 5 seconds: shots bounce back at the enemy, and teammates beside you are safe too.', cd: 20000, dur: 5000, range: 170 },
  },
  {
    id: 'volt', name: 'VOLT', role: 'Tech marksman', color: '#c878ff', hp: 5, speed: 1, fallback: 'commandos_4', fallbackWho: 0,
    ability: { name: 'Chain Arc', desc: 'Lightning jumps between up to 6 enemies on screen and stuns them.', cd: 12000, targets: 6, damage: 5, stun: 1600 },
  },
  {
    id: 'jax', name: 'JAX', role: 'Grenadier', color: '#4d8dff', hp: 5, speed: 1, classic: true, fallback: 'commandos', fallbackWho: 0,
    ability: { name: 'Frag Grenade', desc: 'Lob a grenade that blows apart everything around where it lands. Hold UP to throw it straight up: the blast fires you forward (a grenade jump).', cd: 7000, damage: 8, radius: 190 },
  },
  {
    id: 'duke', name: 'DUKE', role: 'Brawler', color: '#ff4d4d', hp: 5, speed: 1, classic: true, fallback: 'commandos', fallbackWho: 1,
    ability: { name: 'Adrenaline', desc: '6 seconds faster with rapid fire, and one heart back.', cd: 15000, dur: 6000 },
  },
  // season 4: art from assets/agents2.png
  {
    id: 'ghost', name: 'GHOST', role: 'Stealth sniper', color: '#ff4a5a', hp: 5, speed: 1, fallback: 'commandos', fallbackWho: 0,
    ability: { name: 'Cloak', desc: 'Vanish for 5 seconds: enemies lose track of you. Your first shot out of the cloak does triple damage.', cd: 14000, dur: 5000 },
  },
  {
    id: 'hammer', name: 'HAMMER', role: 'Demolition', color: '#ffb020', hp: 5, speed: 1, fallback: 'commandos', fallbackWho: 1,
    ability: { name: 'Ground Pound', desc: 'Slam the ground: a shockwave hurts and stuns everything around you. In the air you dive down first.', cd: 12000, damage: 6, radius: 300, stun: 1000 },
  },
  {
    id: 'viper', name: 'VIPER', role: 'Toxic specialist', color: '#9dff4a', hp: 5, speed: 1, fallback: 'commandos_2', fallbackWho: 0,
    ability: { name: 'Toxic Cloud', desc: 'Throw a gas canister: its cloud poisons every enemy inside for 5 seconds.', cd: 14000, dur: 5000, radius: 170 },
  },
  {
    id: 'atlas', name: 'ATLAS', role: 'Cyborg', color: '#5ab8ff', hp: 5, speed: 1, fallback: 'commandos_4', fallbackWho: 0,
    ability: { name: 'Sentry Drone', desc: 'A drone hovers over you for 8 seconds and shoots the nearest enemy.', cd: 18000, dur: 8000 },
  },
];
// Every agent has the same health (5 hearts) and speed; they differ only by their ability and one PASSIVE
// (the game checks `agent.id` where each one applies: entities.js / scenes.js, search for "passive").
CG.PASSIVES = {
  razor:  { name: 'Trigger Discipline', desc: 'Fires 12% faster.' },
  nova:   { name: 'Field Medic', desc: 'Heart pick-ups heal one more heart.' },
  kite:   { name: 'Featherweight', desc: 'A third jump in the air.' },
  brick:  { name: 'Blast Plating', desc: 'Bombs and shockwaves only take one heart.' },
  volt:   { name: 'Overclock', desc: 'Timed power-ups last 50% longer.' },
  jax:    { name: 'Sapper', desc: 'Breaks cover twice as fast.' },
  duke:   { name: 'Bloodlust', desc: 'Every fourth kill gives a heart back.' },
  ghost:  { name: 'Assassin', desc: 'Shots in the back do triple damage instead of double.' },
  hammer: { name: 'Demolisher', desc: 'Double damage to bosses and gun turrets.' },
  viper:  { name: 'Toxic Rounds', desc: 'Every hit poisons: one more damage a second later.' },
  atlas:  { name: 'Scavenger', desc: 'Coins and pick-ups nearby fly to you.' },
};
CG.AGENT = {};
CG.AGENTS.forEach((a) => { CG.AGENT[a.id] = a; a.passive = CG.PASSIVES[a.id]; });
