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

### Dama Sci-Notation chip values

The Sci-Notation variant uses the same 12-per-side arrangement, but each chip shows a plain number **1 through 12** on its face. The chip's real value — the number used in scoring — is the decimal equivalent of its scientific-notation form.

| Chip label | Scientific notation | Decimal value      |
| ---------- | ------------------- | ------------------ |
| 1          | 1.1 × 10⁻¹          | 0.11               |
| 2          | 2.2 × 10²           | 220                |
| 3          | 3.3 × 10⁻³          | 0.0033             |
| 4          | 4.4 × 10⁴           | 44,000             |
| 5          | 5.5 × 10⁻⁵          | 0.000055           |
| 6          | 6.6 × 10⁶           | 6,600,000          |
| 7          | 7.7 × 10⁻⁷          | 0.00000077         |
| 8          | 8.8 × 10⁸           | 880,000,000        |
| 9          | 9.9 × 10⁻⁹          | 0.0000000099       |
| 10         | 1.01 × 10¹⁰         | 10,100,000,000     |
| 11         | 1.111 × 10⁻¹¹       | 0.00000000001111   |
| 12         | 1.212 × 10¹²        | 1,212,000,000,000  |

Because these values span roughly 10⁻¹¹ to 10¹², scores in Sci-Notation display as `m.mm × 10ⁿ`. Tap any score pill in-match to see the exact decimal.

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

## Dama (promoted chips)

- When a regular chip reaches the opposite back row, it becomes a **dama** (shown with a gold border on the chip).
- A dama moves **any distance diagonally** along an empty path — not just one square.
- A dama captures by flying over an enemy chip (with a clear path to it) and landing on any empty square past it.
- **A dama cannot dodge a capture.** If a dama jumps and has multiple possible landing squares past the enemy, and at least one of those landings allows another capture, the dama must pick a landing that continues the chain.
- **The chain takes priority over promotion.** If a regular chip lands on the opposite back row during a capture and another capture is still available from that square, the chip must keep chaining — still as a regular chip. Promotion only triggers if the chain **ends** with the piece resting on the back row.
- **Passing through doesn't promote.** A chip that touches the back row mid-chain but finishes somewhere else stays a regular chip, and the captures it took in that chain do **not** get any dama bonus.

## Scoring

Every time you capture a chip you add (or subtract!) points from your score. Here's how the score for one capture is figured out:

1. Convert both chips' values to pesos:
   - P chips keep their number.
   - kWh chips multiply by 1.5 (this conversion never changes — it's purely unit conversion).
2. Look at the **operation symbol on the square where your chip landed** (one of +, −, ×, ÷).
3. Do the math with your chip's value and the captured chip's value:
   `your_value  OPERATION  captured_value`
4. Apply the **dama bonus** to the result:
   - Ordinary takes ordinary → × 1 (no bonus).
   - Dama takes an ordinary chip → **× 2**.
   - Ordinary chip takes a dama → **× 2**.
   - Dama takes another dama → **× 4**.

That final number gets added to your score. Your opponent's score is **not** directly affected when their piece is taken — their loss comes from not capturing as much as you do.

### Worked examples

- Ordinary **P10** captures P2, lands on **+** → (10 + 2) × 1 = **12 points**
- Ordinary **P2** captures P10, lands on **−** → (2 − 10) × 1 = **−8 points** (yes, negative!)
- Dama **P10** captures 7KWH, lands on **+** → (10 + (7 × 1.5)) × 2 = (10 + 10.5) × 2 = **41 points**
- Dama **P8** captures Dama P6, lands on **×** → (8 × 6) × 4 = **192 points**

Notice:
- A bad landing (like getting a minus when you're smaller than the piece you took) can **drop your score below zero**.
- The kWh × 1.5 conversion is separate from the dama bonus — both can apply to the same capture without interfering.

The two score tiles next to the board show the running totals: **Black in the top-left, Red in the bottom-right.**

## Ending the game

The game ends when any one of these happens:

- One side has **no chips left.**
- The player whose turn it is has **no legal moves.**
- The **match timer hits 0:00.**

### Banking your remaining chips

As soon as the game ends, every chip still on the board gets **converted to points and added to its owner's score.** The conversion uses the same ideas as capture scoring:

- **P chip** → adds its face value (e.g. P8 = 8 points).
- **kWh chip** → multiplied by 1.5 (e.g. 7kWh = 10.5 points).
- **Dama (promoted chip)** → whatever it's worth gets an extra **× 2** on top.
- **A dama on a kWh chip** → both multipliers stack: value × 1.5 (kWh) × 2 (dama). So a dama 11kWh is worth 11 × 1.5 × 2 = 33 points at the end.

**These points count against you** — so idle chips that never got used are a penalty. The more of your own chips still sitting on the board when the game ends, the more they push your total up — and a dama left standing doubles that pain.

### Who wins

After remaining chips are banked, look at the final scores:

- **The player with the LOWER total wins.** This is Sci Dama's core rule — the lowest score always wins.
- Equal scores → tie.

The winner banner shows the final total for each side — that number already includes the remaining-chip additions. For a full accounting, tap **"See how the score was computed →"** on the winner card to open a breakdown of every capture, every banked chip, and the arithmetic that produced the final totals.

## Turn summary

1. It's your turn. Look for captures — if any of your chips can capture, you must use one of them.
2. Tap one of your chips. Green dots show the squares you can move to.
3. Tap a green-dotted square to make the move.
4. If you captured and can capture again with the same chip, the chip stays selected and you must continue.
5. When your turn is done, it's the other player's turn. Watch the score tiles — they update after every capture.

Aim low: capture cleverly, don't leave chips idle, and finish the match with as little score as possible.
