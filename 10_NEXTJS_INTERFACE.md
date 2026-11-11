# Component 10: Next.js User Interface
**PES University DBMS Level 3 Evaluation Component 10 | Max Marks: 3**

---

## 1. Overview & Source Code Mapping
- **Framework**: Next.js 14 (App Router) + React 18 + Tailwind CSS
- **Path**: `app/src/app/`
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
| `/admin/chaos` | Admin Only | **Chaos Mode Control Center**: Load simulator triggers and live before/after graphs. |

---

## 3. UI Real-Time Capabilities

1. **Live Drop Countdown Timer**:
   - Sub-second synchronized countdown converting from UTC drop start time to user local time.
   - Automatically switches state from `SCHEDULED` to `LIVE` without requiring page refresh.
2. **5-Minute Hold Checkout Clock**:
   - Visual countdown bar synced with Redis `TTL hold:{drop}:{user}`.
   - Warns user at 60 seconds; automatically releases hold and redirects if time expires.
3. **Real-Time Concurrency Telemetry**:
   - Queries `vw_admin_sales_summary` and Redis active queue lengths to display live graphs.

---

## 4. Examiner Viva Q&A (Component 10)

**Q1: How does Next.js handle real-time inventory updates without polling the MySQL database?**
> *Defense*: Querying MySQL repeatedly from thousands of browsers would exhaust connection pools. Instead, FlashDrop leverages Next.js API routes integrated with **Redis in-memory counters**. When inventory changes, it is updated in sub-milliseconds in Redis (`drop:{id}:stock`), allowing clients to fetch live availability without hitting relational disk I/O.

**Q2: What is the benefit of Next.js App Router for this database project?**
> *Defense*: Next.js App Router provides Server Components and Route Handlers (`route.ts`). Server Components query the database directly on the server without exposing database credentials or API secrets to the client browser, reducing client-side bundle size and improving initial page load latency.
