// The agents. Everyone carries the same rifle; agents differ in health, speed and one ability.
// Art: the five season-2 agents come from assets/agents.png (pixel art, the 'agents' sheet); JAX and DUKE are the
// two original painted commandos from assets/commandos.png (classic: true). Without those sheets the built-in
// pixel soldier is used.
//   hp        hearts
//   speed     run speed multiplier
//   ability   name, what it does (shown in the agent picker), cooldown in ms, and its numbers
CG.AGENTS = [
  {
    id: 'razor', name: 'RAZOR', role: 'Heavy gunner', color: '#ff8a3c', hp: 6, speed: 0.94, fallback: 'commandos', fallbackWho: 1,
    ability: { name: 'Bullet Storm', desc: '6 seconds of a five-way spray at double speed. Shots punch through the first enemy.', cd: 18000, dur: 6000 },
  },
  {
    id: 'nova', name: 'NOVA', role: 'Field medic', color: '#3fd8c8', hp: 5, speed: 1, fallback: 'commandos_2', fallbackWho: 0,
    ability: { name: 'Mend', desc: 'Heals you and every teammate nearby by 3 hearts, makes them untouchable for a moment, and brings back anyone who is out.', cd: 16000, range: 700, heal: 3 },
  },
  {
    // dash: the only agent with the Tac Dash — any of eight directions (hold W / up + DASH to go straight up)
    id: 'kite', name: 'KITE', role: 'Scout', color: '#58e05a', hp: 4, speed: 1.16, fallback: 'commandos_3', fallbackWho: 0, dash: true,
    ability: { name: 'Phase Dash', desc: 'Dash forward untouchable, slicing every enemy in the way. A kill halves the cooldown.', cd: 6000, dist: 480, damage: 4 },
  },
  {
    id: 'brick', name: 'BRICK', role: 'Breacher', color: '#5aa2ff', hp: 8, speed: 0.9, fallback: 'commandos', fallbackWho: 0,
    ability: { name: 'Aegis', desc: 'A shield dome for 5 seconds: shots bounce back at the enemy, and teammates beside you are safe too.', cd: 20000, dur: 5000, range: 170 },
  },
  {
    id: 'volt', name: 'VOLT', role: 'Tech marksman', color: '#c878ff', hp: 5, speed: 1, fallback: 'commandos_4', fallbackWho: 0,
    ability: { name: 'Chain Arc', desc: 'Lightning jumps between up to 6 enemies on screen and stuns them.', cd: 12000, targets: 6, damage: 5, stun: 1600 },
  },
  {
    id: 'jax', name: 'JAX', role: 'Grenadier', color: '#4d8dff', hp: 5, speed: 1, classic: true, fallback: 'commandos', fallbackWho: 0,
    ability: { name: 'Frag Grenade', desc: 'Lob a grenade that blows apart everything around where it lands.', cd: 7000, damage: 8, radius: 190 },
  },
  {
    id: 'duke', name: 'DUKE', role: 'Brawler', color: '#ff4d4d', hp: 6, speed: 1.04, classic: true, fallback: 'commandos', fallbackWho: 1,
    ability: { name: 'Adrenaline', desc: '6 seconds faster with rapid fire, and one heart back.', cd: 15000, dur: 6000 },
  },
  // season 4: art from assets/agents2.png
  {
    id: 'ghost', name: 'GHOST', role: 'Stealth sniper', color: '#ff4a5a', hp: 4, speed: 1.1, fallback: 'commandos', fallbackWho: 0,
    ability: { name: 'Cloak', desc: 'Vanish for 5 seconds: enemies lose track of you. Your first shot out of the cloak does triple damage.', cd: 14000, dur: 5000 },
  },
  {
    id: 'hammer', name: 'HAMMER', role: 'Demolition', color: '#ffb020', hp: 8, speed: 0.88, fallback: 'commandos', fallbackWho: 1,
    ability: { name: 'Ground Pound', desc: 'Slam the ground: a shockwave hurts and stuns everything around you. In the air you dive down first.', cd: 12000, damage: 6, radius: 300, stun: 1000 },
  },
  {
    id: 'viper', name: 'VIPER', role: 'Toxic specialist', color: '#9dff4a', hp: 5, speed: 1.04, fallback: 'commandos_2', fallbackWho: 0,
    ability: { name: 'Toxic Cloud', desc: 'Throw a gas canister: its cloud poisons every enemy inside for 5 seconds.', cd: 14000, dur: 5000, radius: 170 },
  },
  {
    id: 'atlas', name: 'ATLAS', role: 'Cyborg', color: '#5ab8ff', hp: 6, speed: 0.96, fallback: 'commandos_4', fallbackWho: 0,
    ability: { name: 'Sentry Drone', desc: 'A drone hovers over you for 8 seconds and shoots the nearest enemy.', cd: 18000, dur: 8000 },
  },
];
CG.AGENT = {};
CG.AGENTS.forEach((a) => { CG.AGENT[a.id] = a; });
