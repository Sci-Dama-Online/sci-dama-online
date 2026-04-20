# How to play — Electro Sci Dama

A two-player game on an 8×8 board. Players take turns moving their chips diagonally and capturing the other player's chips. At the end of the game, **the player with the lower score wins.**

---

## The board

- 8×8 squares, alternating dark green and cream.
- Chips always sit on the **cream (light) squares**.
- Each cream square has a math symbol on it: **+, −, ×, or ÷**. When a chip is sitting on that square the symbol is hidden underneath. When the square is empty the symbol is visible again.
- These symbols are what you'll use for scoring when you capture — more on that below.

## The chips

Each player starts with **12 chips**. Every chip has a value printed on it:

- **P chips** (P2, P4, P6, P8, P10, P12) — values already in pesos.
- **kWh chips** (1KWH, 3KWH, 5KWH, 7KWH, 9KWH, 11KWH) — values in kilowatt-hours.

A kWh chip is worth **1.5 times** its number when counted as pesos. For example, 7KWH is worth 7 × 1.5 = 10.5 P.

Red plays from the bottom of the board, Black plays from the top. Red moves first.

## Starting position

Both sides start with the same arrangement, mirrored 180°. Reading red's side from the **front row** (closer to the middle) to the **back row** (closer to red's edge):

```
front → P10   7KWH  P2    5KWH
         1KWH  P4    11KWH P8
back →   P12   9KWH  P6    3KWH
```

Black is the exact mirror on the opposite side of the board.

## Moving

- All movement is **diagonal, on the light squares only.**
- A regular chip (a "man") moves **one square diagonally forward** — red moves up the board, black moves down.
- You can only move onto an empty square.

## Capturing

- You capture an opponent's chip by **jumping over it** to the empty square on the other side.
- A regular chip can jump **forward or backward** (either direction diagonally), as long as the enemy is on the next square and the square right after is empty.
- **Captures are mandatory.** If you can capture this turn, you must. You're not allowed to make a plain move instead.
- **Multi-jumps are mandatory too.** If your chip lands after a capture and can immediately capture another piece, it has to keep going. A single turn can chain several captures in a row.

## Kings (dama)

- When a regular chip reaches the opposite back row, it becomes a **king** (shown with a gold border on the chip).
- Kings move **any distance diagonally** along an empty path — not just one square.
- Kings capture by flying over an enemy chip (with a clear path to it) and landing on any empty square past it.
- **A king cannot dodge a capture.** If a king jumps and has multiple possible landing squares past the enemy, and at least one of those landings allows another capture, the king must pick a landing that continues the chain.
- If a regular chip becomes a king during a jump (by landing on the back row mid-chain), the chain ends there — the newly-promoted king does not continue capturing that turn.

## Scoring

Every time you capture a chip you add (or subtract!) points from your score. Here's how the score for one capture is figured out:

1. Convert both chips' values to pesos:
   - P chips keep their number.
   - kWh chips multiply by 1.5.
2. Look at the **operation symbol on the square where your chip landed** (one of +, −, ×, ÷).
3. Do the math with your chip's value and the captured chip's value:
   `your_value  OPERATION  captured_value`
4. If **your** capturing chip is a king, multiply the result by 1.5.

That final number gets added to your score. Your opponent's score is **not** directly affected when their piece is taken — their loss comes from not capturing as much as you do.

### Worked examples

- Man **P10** captures P2, lands on **+** → 10 + 2 = **12 points**
- Man **P2** captures P10, lands on **−** → 2 − 10 = **−8 points** (yes, negative!)
- King **P10** captures 7KWH, lands on **+** → (10 + (7×1.5)) × 1.5 = (10 + 10.5) × 1.5 = **30.75 points**
- King **7KWH** captures 5KWH, lands on **×** → (10.5 × 7.5) × 1.5 = **118.125 points**

Notice:
- A bad landing (like getting a minus when you're smaller than the piece you took) can **drop your score below zero**.
- A king capturing a kWh chip effectively stacks two ×1.5 multipliers (one from the kWh conversion, one from the king bonus).

The two score tiles next to the board show the running totals: **Black in the top-left, Red in the bottom-right.**

## Winning the game

The game ends as soon as a player has **no chips left** or **no legal moves on their turn.**

When that happens, **the player with the LOWER total score wins.** If both scores are equal, the game is a tie.

The idea: every capture is a gamble. Landing on a `×` square while you're big and the enemy is big can really hurt your score. Sometimes the smarter play is to capture carefully, or not at all, so your score stays low.

## Turn summary

1. It's your turn. Look for captures — if any of your chips can capture, you must use one of them.
2. Tap one of your chips. Green dots show the squares you can move to.
3. Tap a green-dotted square to make the move.
4. If you captured and can capture again with the same chip, the chip stays selected and you must continue.
5. When your turn is done, it's the other player's turn. Watch the score tiles — they update after every capture.

Have fun. Keep your score low.
