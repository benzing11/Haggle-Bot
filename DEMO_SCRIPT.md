# 2-minute demo script

**Format:** screen recording, 1920×1080, no face cam. Music: low, warm, sparse. Cursor movements should be deliberate — this is a calm product, not a slot machine.

---

### 0:00 – 0:10 · Cold open

**On screen:** the shelf, already loaded. Slow push-in on the headline.

**VO:** "Every shop says the price is the price. This one disagrees."

**Action:** hover the four cards so the Border Beam sweeps once, then settle on The Unreasonably Good Lamp — $120.

---

### 0:10 – 0:35 · The lowball (the roast)

**On screen:** the shelf card expands into the room. Brindle's orb is gold and amused.

**Action:** type `$12` in the offer field, add the note "it's basically a bulb with delusions", send.

**VO:** "Brindle has a floor. He won't say where it is. And he has very little patience for theatre."

**On screen:** the counter lands high, the patience bar drops sharply, the orb cools to skeptical, the lowball message sits there, unanswered for a beat.

---

### 0:35 – 1:05 · The charming haggle

**Action:** three offers, each higher, each with a reason: "$78 — I'll write you a five-star review", "$90 — cash, and I'll carry it out myself", "$96 — because you clearly have taste and I clearly have a hallway."

**On screen:** the gold marker climbs with spring physics; Brindle's counter descends in smaller and smaller steps. The patience meter steadies. His orb warms back to delighted.

**VO:** "Concessions get smaller as you approach the floor. Charm buys a little room. Numbers are enforced in code — not in the prompt."

---

### 1:05 – 1:20 · The lock

**On screen:** Brindle accepts. The two rail markers snap together, the price shimmers gold, NumberFlow rolls the digits, confetti pops.

**Action:** the contract card slides up. Countdown starts at 10:00. Cursor hovers the PayPal button.

**VO:** "The agreed price is signed into a ten-minute token. The client never sends an amount — PayPal gets it from the server."

---

### 1:20 – 1:45 · PayPal sandbox payment

**Action:** click the PayPal button. Popup opens. Log in with the **Personal sandbox buyer** (not a real account). Confirm.

**On screen:** the PayPal review shows exactly $96.00 USD. Approve.

**VO:** "Sandbox merchant, sandbox buyer. Same Orders v2 flow you'd ship to production."

**Action:** capture completes. The button area shows the capture, then the receipt takes over.

---

### 1:45 – 2:00 · The receipt

**On screen:** ticket slides in, PAID stamp thumps down, a bigger confetti burst, "You saved $24 (20%)" rolls up. Capture ID and order ID are visible.

**VO:** "Twenty percent off, and a receipt that proves where every cent came from. Every price is a conversation — and now it's a transaction."

**Closing card:** Haggle Bot · PayPal Orders v2 + Groq · github.com/…

---

## Shot list cheat sheet

| Time | Shot | Must show |
| --- | --- | --- |
| 0:00 | Shelf wide | Headline, four products, list prices |
| 0:10 | Card → room transition | Shared-element expansion, other cards blur out |
| 0:12 | Lowball send | `$12`, patience drop, offended orb |
| 0:35 | Rail movement | Gold marker climbing, counter descending |
| 1:05 | Deal lock | Markers meet, gold shimmer, small confetti |
| 1:08 | Contract | Countdown, signed amount, PayPal buttons |
| 1:20 | PayPal popup | Sandbox buyer login, $96.00 USD review |
| 1:38 | Capture | Approval, no console errors |
| 1:45 | Receipt | Stamp, rolling savings, IDs |
| 1:58 | End card | Title + stack |

## Recording notes

- Use a sandbox buyer whose email is visible in the popup for credibility.
- Record the whole run at 60fps; trim any model latency over ~4s in the edit (keep a beat of the typing indicator so it reads as live).
- Do one clean take of the deal → pay path. Do not fake the payment.
- If the model refuses your chosen final offer, raise it by $2 rather than editing the footage.
