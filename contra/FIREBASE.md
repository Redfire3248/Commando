# Online setup (Firebase)

COMMANDO plays offline without any of this. Firebase switches on: **sign in with Google**, friends (6-character
friend codes), party invites, parties, the matchmaking queue, **online co-op matches**, and best scores.

It is free on Firebase's Spark plan.

## Season 3 update — paste the rules again

Season 3 adds callsigns (`usernames`), the shop (`shop`, only the admin's email can change it) and the admin's
access to everyone's coins. Open **Realtime Database → Rules**, replace everything with the rules in step 4
below and click **Publish**. The admin is `redjai1981@gmail.com` (it is written into the rules and into
`CG.Net.ADMIN_EMAILS` in `src/net.js`; change both to move it to another account).

## If your project is already set up (season 1) — do these three things

1. **Turn on Google sign-in.** Firebase console → **Build → Authentication → Sign-in method** → **Google** →
   switch it on, pick a support email → **Save**. (Anonymous sign-in is no longer used by the real game; you
   can leave it on — it is only for testing on your own computer.)
2. **Allow your website.** **Authentication → Settings → Authorized domains → Add domain** →
   `redfire3248.github.io`. (`localhost` is already on the list.)
3. **Replace the database rules** with the ones in step 4 below and click **Publish**. Without the new
   rules, parties and online matches fail with "permission denied".

## Setting up from scratch

### 1. Create the project
1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. **Create a project**, name it (for example `gunhollow`), Google Analytics off, **Create project**.

### 2. Switch on Google sign-in
**Build → Authentication → Get started → Sign-in method → Google** → on, support email, **Save**.
Then **Settings → Authorized domains → Add domain** → your website (for example `yourname.github.io`).

### 3. Create the database
1. **Build → Realtime Database → Create Database**, pick the location closest to your players,
   **Start in locked mode**, **Enable**.
2. Note the address at the top of the Data tab (`https://...firebaseio.com` or `...firebasedatabase.app`).

### 4. Paste the security rules
**Realtime Database → Rules**, replace everything with this, **Publish**:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null && auth.token.email === 'redjai1981@gmail.com'",
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && (auth.uid === $uid || auth.token.email === 'redjai1981@gmail.com')",
        "name": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 16" },
        "username": { ".validate": "newData.isString() && newData.val().matches(/^[A-Za-z0-9_]{3,16}$/)" },
        "best": { ".validate": "newData.isNumber()" },
        "coins": { ".validate": "newData.isNumber() && newData.val() >= 0" },
        "rr": { ".validate": "newData.isNumber() && newData.val() >= 0" }
      }
    },
    "usernames": {
      "$name": {
        ".read": "auth != null",
        ".write": "auth != null && ((!data.exists() && newData.val() === auth.uid) || (data.val() === auth.uid && !newData.exists()))"
      }
    },
    "shop": {
      ".read": "auth != null",
      ".write": "auth != null && auth.token.email === 'redjai1981@gmail.com'"
    },
    "admins": { ".read": "auth != null" },
    "announce": {
      ".read": "auth != null",
      ".write": "auth != null && auth.token.email === 'redjai1981@gmail.com'"
    },
    "codes": {
      "$code": {
        ".read": "auth != null",
        ".write": "auth != null && !data.exists() && newData.val() === auth.uid"
      }
    },
    "requests": {
      "$to": {
        ".read": "auth != null && auth.uid === $to",
        "$from": { ".write": "auth != null && (auth.uid === $from || auth.uid === $to)" }
      }
    },
    "friends": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        "$fid": {
          ".write": "auth != null && (auth.uid === $uid || (auth.uid === $fid && (root.child('requests').child($fid).child($uid).exists() || !newData.exists())))"
        }
      }
    },
    "invites": {
      "$to": {
        ".read": "auth != null && auth.uid === $to",
        "$party": { ".write": "auth != null && (auth.uid === $to || newData.child('from').val() === auth.uid)" }
      }
    },
    "parties": {
      ".read": "auth != null",
      "$party": { ".write": "auth != null" }
    },
    "queue": {
      ".read": "auth != null",
      ".indexOn": ["at"],
      "$party": { ".write": "auth != null" }
    },
    "matches": {
      "$match": { ".read": "auth != null", ".write": "auth != null" }
    }
  }
}
```

What they allow: you can only change your own profile; a friend code can be claimed once; only the two
people involved can create or remove a friend request or friendship; only you can read your invites, and an
invite has to say who sent it. Parties, the queue and matches can be read and written by any signed-in
player (it is a co-op game: everyone in a match writes to it).

### 5. Paste your keys into the game
**Gear icon → Project settings → Your apps → Web (`</>`)**, register the app, then copy these values from the
`firebaseConfig` block into `contra/firebase-config.js` (keep the quotes): `apiKey`, `authDomain`,
`databaseURL` (the address from step 3 if it is missing), `projectId`, `appId`.
These keys are not secret: they only identify the project. The rules protect the data.

## How online play works

- **PLAY ONLINE** makes a party. Invite online friends (they get a JOIN button on their menu), pick your
  agent, and the leader presses **START MATCH** — or **FIND PLAYERS** to be teamed up with other parties
  that are searching (after 30 seconds with nobody else, it starts with just your party). The leader can add
  bots to fill the team.
- The leader's game is the **host**: it runs the enemies, the score and the team's lives. Everybody moves their
  own agent in their own game. If the host leaves, the match ends for everyone.
- The admin panel works online only for the host, and online scores are never saved as bests.

## Testing online on one computer (no Firebase needed)

With the dev server running, open `http://localhost:8080/contra/?guest&fakedb` in **two tabs of the same
browser**. Each tab is a separate test player; they share a pretend database through the browser. In one tab
open PLAY ONLINE, in the other... the invite step needs friends, so the quickest way is the browser console:
see `src/fakedb.js`. (With `?guest` alone, the real Firebase project is used with throwaway test accounts —
that needs Anonymous sign-in switched on.)

## If something goes wrong

| What you see | Cause |
|---|---|
| CONTINUE WITH GOOGLE does nothing / "unauthorized-domain" | Add the website under Authorized domains (step 2) |
| "operation-not-allowed" | Google sign-in is not switched on (step 2) |
| "permission denied" when making a party | The new rules were not published (step 4) |
| The popup is blocked on a phone | The game falls back to a full-page Google sign-in and comes back |
