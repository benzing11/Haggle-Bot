# Devpost description (150 words)

**Haggle Bot — every price is a conversation.**

Every price is a conversation. Haggle Bot is a dark little shop where the sticker is only a suggestion: pick an object, then talk Brindle — a dry-witted AI shopkeeper with a secret price floor and finite patience — down to a number you both accept. That number becomes the PayPal order.

Brindle is an open-weight model on Groq returning structured output: a reply, a mood, a counter-offer and a deal flag. His floor never reaches the browser, and every counter is clamped in code, so a prompt injection cannot sell a $120 lamp for $1. A signed ten-minute deal token carries the agreed price into PayPal Orders v2; the client cannot alter the amount because it never supplies one.

The interface is Next.js, Tailwind and Motion: a live price rail, a mood-morphing orb, rolling digits, a stamped receipt.

Next: more shopkeepers, bundles, and real merchant onboarding.
