# Switching on accounts and friends (Firebase)

COMMANDO runs fully offline without this. Doing these steps switches on: an account for each player, a
6-character friend code, friend requests, seeing which friends are online, and friends' best scores.

It is free on Firebase's Spark plan. It takes about ten minutes.

## 1. Create the project

1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. Click **Create a project** (or **Add project**). Name it, for example `gunhollow`.
3. Turn **Google Analytics off** (not needed) and click **Create project**.

## 2. Switch on sign-in

1. In the left menu: **Build → Authentication → Get started**.
2. Open the **Sign-in method** tab.
3. Click **Anonymous**, switch it **on**, **Save**. (This gives every player an account without a password.)
4. Optional: click **Google**, switch it **on**, pick a support email, **Save**. This makes the
   "Keep my account with Google" button work, so a player keeps the same account on another device.

## 3. Create the database

1. Left menu: **Build → Realtime Database → Create Database**.
2. Pick the location closest to your players.
3. Choose **Start in locked mode** and click **Enable**.
4. Note the address shown at the top of the Data tab. It looks like
   `https://gunhollow-default-rtdb.firebaseio.com` (or `...firebasedatabase.app`). You need it in step 5.

## 4. Paste the security rules

Open the **Rules** tab of the Realtime Database, replace everything with this, and click **Publish**:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid",
        "name": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 16" },
        "best": { ".validate": "newData.isNumber()" }
      }
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
    }
  }
}
```

What the rules allow: a player can only change their own profile, a friend code can be claimed once, only
the two people involved can create or remove a friend request, and you can only be added to someone's
friend list if you sent them a request.

## 5. Get your keys and paste them into the game

1. Click the **gear icon → Project settings**.
2. Scroll to **Your apps** and click the **Web** icon (`</>`).
3. Give it a nickname, leave "Firebase Hosting" unticked, click **Register app**.
4. Firebase shows a `firebaseConfig` block. Open `contra/firebase-config.js` and copy these five values
   across, keeping the quotes:

| In `firebase-config.js` | Copy from the `firebaseConfig` block |
|---|---|
| `apiKey` | `apiKey` |
| `authDomain` | `authDomain` |
| `databaseURL` | `databaseURL` (if it is missing, use the address from step 3.4) |
| `projectId` | `projectId` |
| `appId` | `appId` |

These keys are not secret: they only identify the project. The rules from step 4 are what protect the data.

## 6. Try it

1. Start the game (`PLAY.bat`) and open COMMANDO.
2. Click **FRIENDS**. You should see your name and a 6-character code.
3. Open the game again in a private/incognito window (that is a second player). Copy its code, paste it
   into the first window under **Add a friend by code**, and send. Accept it in the second window.
4. Both windows now list each other, with a green dot while the other is open.

## 7. When you put the game on a real website

In **Authentication → Settings → Authorized domains**, add your site's domain (for example
`yourname.github.io`). `localhost` is already on the list.

## If something goes wrong

| What you see on the Friends screen | Cause |
|---|---|
| "Online features are not switched on yet" | The keys in `firebase-config.js` still say `PASTE_...` |
| "Could not connect: ... operation-not-allowed" | Anonymous sign-in is not switched on (step 2) |
| "Could not connect: permission denied" | The rules were not published (step 4) |
| "Could not connect: ... databaseURL" | `databaseURL` is missing or wrong (step 3.4) |

## Not included yet

Playing a stage together over the internet. Two players on one keyboard works now; online co-op needs the
game state synced between the two browsers and is the next step.
