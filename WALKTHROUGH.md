# Submission walkthrough

Start the app with the setup commands in the README and sign in as `agent@relay.dev` with `RelayPass2026!`. The dashboard is the agent's overview: counts are derived by the API, while the queue shows the persisted ticket references, ownership, priority, status, and server-calculated SLA health.

Open any ticket to see the full request, comment thread, audit activity, ownership, and two independent SLA clocks. The status badge and countdown are intentionally separate: the API decides whether the clock is on track, at risk, breached, met, or paused. The browser only presents the state and advances the already-returned remaining time while the business calendar is open.

Create an urgent ticket. Its first-response and resolution targets are calculated only from working time. A ticket created after 18:00 begins at the next business opening; one created at Friday 17:59 rolls into Monday. Weekend time and configured holidays consume no SLA time.

As an agent, assign the ticket and add a comment. Reporter comments do not freeze the first-response clock. The first non-reporter comment freezes it permanently as `MET` or `BREACHED`, preserving the remaining time at the event moment. Move a ticket to `WAITING_ON_CUSTOMER` to pause its active clocks, then move it back to `IN_PROGRESS` to add only the elapsed business pause minutes to the targets.

Finally, open Holidays. Adding or removing a holiday immediately recalculates every active ticket target, so the business calendar remains authoritative after tickets already exist. The unit and integration suites cover the same boundary behavior, including the 75 percent risk boundary, weekend and holiday exclusion, frozen states, and persistence.
