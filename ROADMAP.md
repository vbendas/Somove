# Somove Roadmap

This page lists what comes next for Somove. Items are not dated, and scope may change once work starts. The detailed plans for the larger areas are linked at the bottom.

## Next up

- [ ] Group sessions: workshops, classes and group therapy
- [ ] Scheduling: native availability management and calendar sync
- [ ] Payments: invoices, refunds and multi-currency support
- [ ] Video calls: call quality and in-call controls
- [ ] Chat and support: messaging improvements and the support flow
- [ ] Profession-specific intake templates for therapy, coaching and tutoring
- [ ] Test coverage for booking and payments
- [ ] Accessibility and mobile polish
- [ ] Self-hosting documentation

## How items are picked

Work follows the order above unless a bug or a security issue takes priority. Each item should be small enough to ship on its own. Larger items get a plan in `Documentation/plan/` before implementation starts.

Changes to booking and payments must include tests and must keep server-side price validation and webhook signature checks in place.

## Detailed plans

- [Chat and Support](Documentation/plan/CHAT_AND_SUPPORT_ROADMAP.md)
- [Master Platform](Documentation/plan/MASTER_PLATFORM_ROADMAP.md)
- [Payment System](Documentation/plan/PAYMENT_SYSTEM_ROADMAP.md)
- [Scheduling System](Documentation/plan/SCHEDULING_SYSTEM_ROADMAP.md)
- [Video Call](Documentation/plan/VIDEO_CALL_ROADMAP.md)
