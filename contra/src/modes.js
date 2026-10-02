// Game modes.
//   STORY  — the campaign against the army (1-5 players, bots help), the stages in CG.DATA.levels
//   DUELS  — two teams fight each other in an arena: 1v1, 2v2 or 3v3. A round ends when one whole team is down;
//            that team's opponents score, then everyone comes back at full health. First to `rounds` wins.
//   CUSTOM — the same fight, with the arena, both team sizes, the rounds, the power-up drops and whether the
//            people in your squad play together or against each other all chosen by the player.
// A mode is a plain object: { kind: 'story' } | { kind: 'duels', size } | { kind: 'custom', arena, a, b, rounds, drops, together }
CG.Modes = {
  BOT_AGENTS: ['jax', 'duke'],                     // bots only ever play the two basic commandos
  TEAMS: [{ name: 'ALPHA', color: '#4da6ff' }, { name: 'BRAVO', color: '#ff5a4f' }],
  SIZES: [1, 2, 3],
  ROUNDS: [3, 5, 7],
  CUSTOM: { kind: 'custom', arena: 0, a: 2, b: 2, rounds: 5, drops: true, together: true },

  botAgent() { return this.BOT_AGENTS[Math.floor(Math.random() * this.BOT_AGENTS.length)]; },
  isPvp(m) { return !!m && m.kind !== 'story'; },
  sizes(m) { return m.kind === 'duels' ? [m.size, m.size] : m.kind === 'custom' ? [m.a, m.b] : null; },
  label(m) {
    if (m.kind === 'duels') return m.size + 'v' + m.size + ' DUEL';
    if (m.kind === 'custom') return 'CUSTOM ' + m.a + 'v' + m.b;
    return 'STORY';
  },
  sub(m) {
    if (m.kind === 'duels') return 'Rounds · first to ' + CG.DUEL_KILLS;
    if (m.kind === 'custom') return ((CG.DATA.arenas[m.arena] || CG.DATA.arenas[0]).name.replace('ARENA · ', '')) + ' · first to ' + m.rounds;
    return 'The campaign · 8 stages';
  },
  // the match settings every screen gets (an online match stores them, so everyone plays the same arena)
  settings(m) {
    if (m.kind === 'custom') return { arena: m.arena, rounds: m.rounds, drops: !!m.drops };
    return { arena: Math.floor(Math.random() * CG.DATA.arenas.length), rounds: CG.DUEL_KILLS, drops: true };
  },
  // how many people this mode can take
  capacity(m) { const s = this.sizes(m); return s ? s[0] + s[1] : CG.CONFIG.MAX_PLAYERS; },
  // Put the people into the two teams and fill the empty places with bots. People take turns between the teams
  // (so two friends in a 1v1 fight each other) unless a custom match says the squad plays together.
  teams(m, people, makeBot) {
    const cap = this.sizes(m), teams = [[], []], together = m.kind === 'custom' && m.together;
    people.forEach((h, i) => {
      let t = together ? 0 : i % 2;
      if (teams[t].length >= cap[t]) t = 1 - t;
      if (teams[t].length >= cap[t]) throw new Error('Too many players for ' + this.label(m));
      teams[t].push(h);
    });
    let n = 0;
    [0, 1].forEach((t) => { while (teams[t].length < cap[t]) teams[t].push(makeBot(n++, t)); });
    return teams[0].map((p) => Object.assign(p, { team: 0 })).concat(teams[1].map((p) => Object.assign(p, { team: 1 })));
  },
  // modes saved as text (the queue, localStorage)
  key(m) { return m.kind === 'duels' ? 'duel' + m.size : m.kind === 'story' ? 'squad' : 'custom'; },
  fromKey(k) { const s = /^duel(\d)$/.exec(k || ''); return s ? { kind: 'duels', size: +s[1] } : { kind: 'story' }; },
};
