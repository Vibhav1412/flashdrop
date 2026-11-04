# Component 10: Next.js User Interface
**PES University DBMS Level 3 Evaluation Component 10 | Max Marks: 3**

---

## 1. Overview & Source Code Mapping
- **Framework**: Next.js 14 (App Router) + React + Tailwind CSS
- **Path**: `app/`
- **Scope**: Responsive full-stack web application featuring customer storefront, drop countdowns, dynamic waiting room, 5-minute checkout hold timer, and administrative real-time telemetry panels.

---

## 2. Key Pages & UI Component Matrix

| Page / Route | Role Access | Primary Features & Database Interaction |
| :--- | :--- | :--- |
| `/` | Public | Live hero drop countdown, upcoming drops grid, recent drops. |
| `/drops/[id]` | Public / Customer | Dynamic drop page with live stock counter (Redis), waiting room status. |
| `/checkout/[id]` | Customer | 5-minute countdown hold timer with auto-release, wallet balance deduction. |
| `/wallet` | Customer | Prepaid balance display, double-entry ledger history, deposit simulator. |
| `/referrals` | Customer | Unique referral code, viral tree depth visualizer, earned rewards balance. |
| `/admin/dashboard` | Admin Only | Real-time SSE telemetry (orders/min, queue length, stock consumption). |
| `/admin/drops/new`| Admin Only | Drop creation form with inventory allocation and price scheduler. |
| `/admin/chaos` | Admin Only | **Chaos Mode Control Center**: Load simulator triggers and live before/after graphs. |

---

## 3. UI Real-Time Capabilities

1. **Live Drop Countdown Timer**:
   - Sub-second synchronized countdown converting from UTC drop start time to user local time.
   - Automatically switches state from `SCHEDULED` to `LIVE` without requiring page refresh.
2. **5-Minute Hold Checkout Clock**:
   - Visual countdown bar synced with Redis `TTL hold:{drop}:{user}`.
   - Warns user at 60 seconds; automatically releases hold and redirects if time expires.
3. **Server-Sent Events (SSE) Live Feed**:
   - Subscribes to Redis Pub/Sub `channel:dashboard:*` to update live order counters, queue depths, and fraud alerts in real time without client polling.

---

## 4. Examiner Viva Q&A (Component 10)

**Q1: How does Next.js handle real-time inventory updates without polling the MySQL database?**
> *Defense*: Querying MySQL repeatedly from thousands of browsers would exhaust connection pools. Instead, FlashDrop leverages **Server-Sent Events (SSE)** in Next.js backed by a **Redis Pub/Sub** channel. When inventory changes in Redis, an event is published to `channel:dashboard:*` and pushed downstream to active client SSE connections over a single persistent HTTP connection.

**Q2: What is the benefit of Next.js App Router for this database project?**
> *Defense*: Next.js App Router provides Server Components and Route Handlers (`route.ts`). Server Components query the database directly on the server without exposing database credentials or API secrets to the client browser, reducing client-side bundle size and improving initial page load latency.
