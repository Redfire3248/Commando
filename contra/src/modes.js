// Game modes.
//   STORY  — the campaign against the army (1-5 players, bots help), the stages in CG.DATA.levels
//   DUELS  — two teams fight each other in an arena: 1v1, 2v2 or 3v3. A round ends when one whole team is down;
//            that team's opponents score, then everyone comes back at full health. First to `rounds` wins.
//   CUSTOM — the same fight, with the arena, both team sizes, the rounds, the power-up drops and whether the
//            people in your squad play together or against each other all chosen by the player.
//   FREE-FOR-ALL — everyone against everyone (4 or 6 fighters), back in 1.5 s after a death, first to 10 kills.
//   HORDE  — co-op in an arena: waves of soldiers from both sides, a giant every fifth wave. How far can you get?
// A mode is a plain object: { kind: 'story' } | { kind: 'duels', size } | { kind: 'custom', arena, a, b, rounds, drops, together }
//   | { kind: 'ffa', size } | { kind: 'horde' }
CG.Modes = {
  BOT_AGENTS: ['jax', 'duke'],                     // the bots you add play one of the two basic commandos
  TEAMS: [{ name: 'ALPHA', color: '#4da6ff' }, { name: 'BRAVO', color: '#ff5a4f' }],
  SIZES: [1, 2, 3],
  ROUNDS: [3, 5, 7],
  CUSTOM: { kind: 'custom', arena: 0, a: 2, b: 2, rounds: 5, drops: true, together: true },

  // the strong picks a good bot brings: GHOST (flanks x3, cloak), KITE (three jumps + dash), RAZOR (fast fire + storm),
  // VOLT (stunning arc), HAMMER (stunning pound)
  META: ['ghost', 'kite', 'razor', 'volt', 'hammer'],
  // a bot the game fills in: below Gold JAX or DUKE; through Gold more and more often one of the strong picks;
  // from Platinum up ONLY the strong picks
  botAgent(rr) {
    rr = rr || 0;
    const gold = CG.Ranks.divStart(2, 1), plat = CG.Ranks.divStart(3, 1);
    const strong = rr >= plat ? 1 : Math.max(0, (rr - gold) / (plat - gold));
    const list = Math.random() < strong ? this.META.filter((id) => CG.AGENT[id]) : this.BOT_AGENTS;
    return list[Math.floor(Math.random() * list.length)];
  },
  FFA_KILLS: 10,
  isPvp(m) { return !!m && m.kind !== 'story' && m.kind !== 'horde'; },
  sizes(m) { return m.kind === 'duels' ? [m.size, m.size] : m.kind === 'custom' ? [m.a, m.b] : null; },
  // ranked: duels and free-for-all (story and horde rank too, by how far you get); custom games never
  ranked(m) { return m.kind !== 'custom'; },
  label(m) {
    if (m.kind === 'duels') return m.size + 'v' + m.size + ' DUEL';
    if (m.kind === 'custom') return 'CUSTOM ' + m.a + 'v' + m.b;
    if (m.kind === 'ffa') return 'FREE-FOR-ALL';
    if (m.kind === 'horde') return 'HORDE';
    return 'STORY';
  },
  icon(m) { return m.kind === 'story' || m.kind === 'horde' ? 'story' : m.kind === 'custom' ? 'custom' : 'duels'; },
  sub(m) {
    if (m.kind === 'ffa') return m.size + ' fighters · first to ' + this.FFA_KILLS + ' kills';
    if (m.kind === 'horde') return 'Survive the waves · co-op';
    if (m.kind === 'duels') return 'Rounds · first to ' + CG.DUEL_KILLS;
    if (m.kind === 'custom') return ((CG.DATA.arenas[m.arena] || CG.DATA.arenas[0]).name.replace('ARENA · ', '')) + ' · first to ' + m.rounds;
    return 'The campaign · 8 stages';
  },
  // the match settings every screen gets (an online match stores them, so everyone plays the same arena)
  settings(m) {
    if (m.kind === 'custom') return { arena: m.arena, rounds: m.rounds, drops: !!m.drops, custom: true };
    if (m.kind === 'ffa') return { arena: Math.floor(Math.random() * CG.DATA.arenas.length), rounds: this.FFA_KILLS, drops: true, ffa: true };
    return { arena: Math.floor(Math.random() * CG.DATA.arenas.length), rounds: CG.DUEL_KILLS, drops: true };
  },
  // how many people this mode can take
  capacity(m) { if (m.kind === 'ffa') return m.size; const s = this.sizes(m); return s ? s[0] + s[1] : CG.CONFIG.MAX_PLAYERS; },
  // Put the people into the two teams and fill the empty places with bots. People take turns between the teams
  // (so two friends in a 1v1 fight each other) unless a custom match says the squad plays together.
  teams(m, people, makeBot) {
    if (m.kind === 'ffa') {                         // free-for-all: everyone is their own team
      if (people.length > m.size) throw new Error('Too many players for ' + this.label(m));
      const all = people.slice();
      let n = 0;
      while (all.length < m.size) all.push(makeBot(n++, all.length));
      return all.map((p, i) => Object.assign(p, { team: i }));
    }
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
  key(m) { return m.kind === 'duels' ? 'duel' + m.size : m.kind === 'ffa' ? 'ffa' + m.size : m.kind === 'story' ? 'squad' : m.kind; },
  fromKey(k) {
    let s = /^duel(\d)$/.exec(k || '');
    if (s) return { kind: 'duels', size: +s[1] };
    s = /^ffa(\d)$/.exec(k || '');
    if (s) return { kind: 'ffa', size: +s[1] };
    if (k === 'horde') return { kind: 'horde' };
    return { kind: 'story' };
  },
};
