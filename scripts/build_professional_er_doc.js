const fs = require('fs');
const path = require('path');

function buildErDoc() {
  const svgSource = fs.readFileSync(path.join(__dirname, '../docs/er_diagram.svg'), 'utf8');

  // Convert SVG to pure academic white & black style
  let svg = svgSource;

  // Background and canvas
  svg = svg.split('background:#09090b;').join('background:#ffffff;');
  svg = svg.split('fill="url(#bgGrad)"').join('fill="#ffffff"');
  svg = svg.split('stop-color="#09090b"').join('stop-color="#ffffff"');
  svg = svg.split('stop-color="#111116"').join('stop-color="#ffffff"');
  svg = svg.split('flood-color="#000000" flood-opacity="0.6"').join('flood-color="#64748b" flood-opacity="0.1"');

  // Title
  svg = svg.split("PROJECT FLASHDROP ⚡ ENTERPRISE CROW'S FOOT ER DIAGRAM").join("PROJECT FLASHDROP: CROW'S FOOT ENTITY-RELATIONSHIP (ER) DIAGRAM");
  svg = svg.split("20 Normalized Relational Entities in BCNF (MySQL 8.0 Core) • Cardinalities: || (One) to &lt; (Many)").join("20 Normalized Conceptual Entities (MySQL 8.0 Core) • Crow's Foot Cardinalities: || (One) to &lt; (Many)");
  svg = svg.split('fill="#ffffff" font-size="22"').join('fill="#0f172a" font-size="20"');
  svg = svg.split('fill="#a1a1aa" font-size="11"').join('fill="#475569" font-size="11"');

  // Module Legend Badges
  svg = svg.split('fill="#1e293b" stroke="#3b82f6"').join('fill="#f8fafc" stroke="#334155"');
  svg = svg.split('fill="#60a5fa" font-size="10"').join('fill="#0f172a" font-size="10"');
  svg = svg.split('fill="#2a1215" stroke="#f43f5e"').join('fill="#f8fafc" stroke="#334155"');
  svg = svg.split('fill="#fb7185" font-size="10"').join('fill="#0f172a" font-size="10"');
  svg = svg.split('fill="#062d1f" stroke="#10b981"').join('fill="#f8fafc" stroke="#334155"');
  svg = svg.split('fill="#34d399" font-size="10"').join('fill="#0f172a" font-size="10"');
  svg = svg.split('fill="#241235" stroke="#a855f7"').join('fill="#f8fafc" stroke="#334155"');
  svg = svg.split('fill="#c084fc" font-size="10"').join('fill="#0f172a" font-size="10"');

  // Table Card Fills & Borders
  svg = svg.split('fill="#18181b"').join('fill="#ffffff"');
  svg = svg.split('stroke="#3b82f6"').join('stroke="#334155"');
  svg = svg.split('stroke="#f43f5e"').join('stroke="#334155"');
  svg = svg.split('stroke="#10b981"').join('stroke="#334155"');
  svg = svg.split('stroke="#a855f7"').join('stroke="#334155"');

  // Header banner fills in cards
  svg = svg.split('fill="#1e293b"').join('fill="#f1f5f9"');
  svg = svg.split('fill="#2a1215"').join('fill="#f1f5f9"');
  svg = svg.split('fill="#062d1f"').join('fill="#f1f5f9"');
  svg = svg.split('fill="#241235"').join('fill="#f1f5f9"');

  // Table header text colors
  svg = svg.split('fill="#93c5fd"').join('fill="#0f172a"');
  svg = svg.split('fill="#fda4af"').join('fill="#0f172a"');
  svg = svg.split('fill="#a7f3d0"').join('fill="#0f172a"');
  svg = svg.split('fill="#e9d5ff"').join('fill="#0f172a"');

  // Attribute text colors (pure academic contrast)
  svg = svg.split('fill="#d4d4d8"').join('fill="#1e293b"');
  svg = svg.split('fill="#71717a"').join('fill="#64748b"');
  svg = svg.split('fill="#38bdf8"').join('fill="#0369a1"'); // FK text
  svg = svg.split('fill="#f59e0b"').join('fill="#92400e"'); // PK text
  svg = svg.split('fill="#fb7185"').join('fill="#b91c1c"'); // Alert text
  svg = svg.split('fill="#34d399"').join('fill="#15803d"'); // Green text
  svg = svg.split('fill="#c084fc"').join('fill="#6b21a8"'); // Purple text

  // Connector lines
  svg = svg.split('stroke="#60a5fa"').join('stroke="#475569"');
  svg = svg.split('stroke="#fb7185"').join('stroke="#475569"');
  svg = svg.split('stroke="#34d399"').join('stroke="#475569"');
  svg = svg.split('stroke="#c084fc"').join('stroke="#475569"');
  svg = svg.split('stroke="#71717a"').join('stroke="#475569"');

  // Footer bar
  svg = svg.split('fill="#18181b" stroke="#27272a"').join('fill="#f8fafc" stroke="#cbd5e1"');
  svg = svg.split('fill="#71717a" font-size="11"').join('fill="#475569" font-size="11"');
  svg = svg.split('fill="#34d399" font-size="11"').join('fill="#0f172a" font-size="11"');

  fs.writeFileSync(path.join(__dirname, '../docs/er_diagram_white.svg'), svg, 'utf8');
  console.log('Saved docs/er_diagram_white.svg');

  // Build the complete A4 printable HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PES University - Project FlashDrop Entity-Relationship (ER) Model</title>
  <style>
    /* Pure Academic Formal Typography (Standard university report format) */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #ffffff;
      color: #111827;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
    }

    /* Top Action Bar for screen only */
    .screen-actions {
      background-color: #f3f4f6;
      border-bottom: 1px solid #d1d5db;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-action {
      background-color: #1f2937;
      color: #ffffff;
      border: 1px solid #111827;
      padding: 6px 16px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-action:hover {
      background-color: #374151;
    }

    /* Academic Paper Sheet */
    .sheet {
      width: 297mm;
      min-height: 210mm;
      margin: 15px auto;
      padding: 12mm 15mm;
      background: #ffffff;
      border: 1px solid #e5e7eb;
    }

    .sheet-portrait {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 15mm;
    }

    /* University Academic Header */
    .univ-header {
      border-bottom: 2px solid #111827;
      padding-bottom: 8px;
      margin-bottom: 14px;
      text-align: center;
    }

    .univ-header h1 {
      font-size: 15pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #111827;
    }

    .univ-header h2 {
      font-size: 11pt;
      font-weight: normal;
      color: #374151;
      margin-top: 2px;
    }

    .univ-header .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      font-weight: bold;
      color: #4b5563;
      margin-top: 6px;
      border-top: 1px solid #e5e7eb;
      padding-top: 4px;
    }

    /* Section Headings */
    h3 {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 14px;
      margin-bottom: 8px;
      color: #111827;
      border-bottom: 1px solid #9ca3af;
      padding-bottom: 3px;
    }

    /* Embedded SVG Container */
    .diagram-frame {
      width: 100%;
      border: 1px solid #9ca3af;
      background: #ffffff;
      margin-bottom: 10px;
    }

    .diagram-frame svg {
      width: 100%;
      height: auto;
      display: block;
    }

    /* Formal Academic Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 12px;
      font-size: 9pt;
    }

    th, td {
      border: 1px solid #6b7280;
      padding: 4px 8px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #111827;
    }

    /* Cardinality matrix code block */
    .cardinality-box {
      border: 1px solid #9ca3af;
      background: #fafafa;
      padding: 8px 12px;
      font-family: Consolas, "Courier New", monospace;
      font-size: 8.5pt;
      line-height: 1.4;
      margin-bottom: 10px;
    }

    /* Footer */
    .page-footer {
      border-top: 1px solid #9ca3af;
      padding-top: 5px;
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #6b7280;
    }

    /* Print Optimization */
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .screen-actions {
        display: none !important;
      }
      .sheet {
        border: none !important;
        margin: 0 !important;
        padding: 8mm 8mm !important;
        page-break-after: always;
        break-after: page;
      }
      @page {
        size: A4 landscape;
        margin: 8mm;
      }
      @page portrait-sheet {
        size: A4 portrait;
        margin: 10mm;
      }
      .sheet-portrait {
        page: portrait-sheet;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Action Bar (Hidden when printed) -->
  <div class="screen-actions">
    <div>
      <strong>PES UNIVERSITY — DBMS LEVEL 3 EVALUATION (COMPONENT 01)</strong>
      <span style="color: #6b7280; font-size: 11px; margin-left: 10px;">A4 Printable Document: Entity-Relationship Model</span>
    </div>
    <div>
      <button class="btn-action" onclick="window.print()">Print Document / Save as PDF</button>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 1: CROW'S FOOT ER DIAGRAM (A4 LANDSCAPE) -->
  <!-- ========================================================================= -->
  <div class="sheet">
    <div class="univ-header">
      <h1>PES UNIVERSITY</h1>
      <h2>DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING • DATABASE MANAGEMENT SYSTEMS (UE22CS252AA)</h2>
      <div class="meta-row">
        <span>PROJECT: FLASHDROP HIGH-CONCURRENCY COMMERCE ENGINE</span>
        <span>COMPONENT 01: ENTITY-RELATIONSHIP (ER) DIAGRAM</span>
        <span>AUTHORS: VIBHAV M &amp; VAINIK</span>
      </div>
    </div>

    <!-- INLINE VECTOR SVG DIAGRAM (100% Reliable Loading - No External Images) -->
    <div class="diagram-frame">
      ${svg}
    </div>

    <div class="page-footer">
      <span>Notations: Crow's Foot Cardinalities (|| Exactly One, &lt;| Zero or More) │ 20 Relational Entities</span>
      <span>Page 1 of 3: Conceptual Architecture (ER Diagram)</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 2: ENTITY CLASSIFICATION & CARDINALITY MATRIX (A4 PORTRAIT) -->
  <!-- ========================================================================= -->
  <div class="sheet sheet-portrait">
    <div class="univ-header">
      <h1>PES UNIVERSITY</h1>
      <h2>DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING • DBMS LEVEL 3 EVALUATION</h2>
      <div class="meta-row">
        <span>COURSE: UE22CS252AA</span>
        <span>COMPONENT 01: ENTITY CLASSIFICATION &amp; CARDINALITIES</span>
        <span>20 ENTITIES IN 3NF/BCNF</span>
      </div>
    </div>

    <h3>1. Entity Structural Classification (20 Entities)</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Entity Name</th>
          <th style="width: 28%;">Structural Type</th>
          <th style="width: 15%;">Primary Key</th>
          <th>Semantic Role &amp; Integrity Invariant</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><strong>roles</strong></td><td>Strong Entity</td><td>role_id</td><td>System authorization tiers: admin, customer, auditor.</td></tr>
        <tr><td><strong>users</strong></td><td>Strong Entity</td><td>user_id</td><td>Core user identity, credentials, active/suspended status.</td></tr>
        <tr><td><strong>addresses</strong></td><td>Subordinate Entity</td><td>address_id</td><td>Physical shipping address linked to users (1:N).</td></tr>
        <tr><td><strong>categories</strong></td><td>Self-Referencing Strong</td><td>category_id</td><td>Product taxonomy hierarchy via parent_id (Unary 1:N).</td></tr>
        <tr><td><strong>products</strong></td><td>Strong Entity</td><td>product_id</td><td>Catalog products with JSON dynamic attributes.</td></tr>
        <tr><td><strong>price_history</strong></td><td>Weak / Temporal</td><td>history_id</td><td>Temporal audit of product price adjustments over time.</td></tr>
        <tr><td><strong>drops</strong></td><td>Strong Entity</td><td>drop_id</td><td>Time-boxed release events: scheduled, live, concluded.</td></tr>
        <tr><td><strong>inventory</strong></td><td>Strong / 1:1 Linked</td><td>inventory_id</td><td>Dedicated stock pool per drop (CHECK: avail + res + sold = total).</td></tr>
        <tr><td><strong>orders</strong></td><td>Strong Entity</td><td>order_id</td><td>Committed checkout contracts placed during live drops.</td></tr>
        <tr><td><strong>order_items</strong></td><td>Weak / Child Entity</td><td>item_id</td><td>Itemized line items belonging to an order (ON DELETE CASCADE).</td></tr>
        <tr><td><strong>payments</strong></td><td>Subordinate Entity</td><td>payment_id</td><td>Financial settlement receipts linked to orders (1:1 / 1:N).</td></tr>
        <tr><td><strong>wallets</strong></td><td>Strong / 1:1 Linked</td><td>wallet_id</td><td>Prepaid balance container with CHECK (balance >= 0).</td></tr>
        <tr><td><strong>wallet_ledger</strong></td><td>Weak / Child Entity</td><td>ledger_id</td><td>Double-entry balance change records (identifying FK: wallet_id).</td></tr>
        <tr><td><strong>referrals</strong></td><td>Self-Referencing Assoc.</td><td>referral_id</td><td>User referral network (referrer_id &rarr; referee_id DAG).</td></tr>
        <tr><td><strong>loyalty_tiers</strong></td><td>Strong Entity</td><td>tier_id</td><td>Reward classifications: Bronze, Silver, Gold, Platinum.</td></tr>
        <tr><td><strong>user_tiers</strong></td><td>Associative Bridge</td><td>id</td><td>Historical and active user tier assignments with validity dates.</td></tr>
        <tr><td><strong>lottery_entries</strong></td><td>Associative Bridge</td><td>entry_id</td><td>Fair waitlist lottery ballot entries per user per drop.</td></tr>
        <tr><td><strong>purchase_attempts</strong></td><td>Telemetry / Log</td><td>attempt_id</td><td>High-frequency burst attempt telemetry during drop events.</td></tr>
        <tr><td><strong>fraud_flags</strong></td><td>Associative Entity</td><td>flag_id</td><td>Automated heuristic triggers flagging suspicious bot users.</td></tr>
        <tr><td><strong>audit_log</strong></td><td>Append-Only Core</td><td>log_id</td><td>System-wide immutable change audit tracking DML mutations.</td></tr>
      </tbody>
    </table>

    <h3>2. Structural Relationships &amp; Cardinality Matrix</h3>
    <div class="cardinality-box">
[users] 1 -------- 1 [wallets]               (1:1  Mandatory - Every user holds exactly one prepaid wallet)
[wallets] 1 ------&lt; [wallet_ledger]         (1:N  Identifying - Balance strictly equals sum of ledger rows)
[users] 1 --------&lt; [orders]                (1:N  User places zero or more checkout orders)
[orders] 1 -------&lt; [order_items]           (1:N  Identifying weak entity - order items lifecycle bound)
[orders] 1 -------- 1 [payments]              (1:1  Mandatory payment settlement record per committed order)
[drops] 1 -------- 1 [inventory]            (1:1  Dedicated inventory allocation per drop event)
[drops] 1 --------&lt; [orders]                (1:N  Drop event generates multiple consumer orders)
[products] 1 -----&lt; [drops]                 (1:N  Product can be featured across scheduled drops)
[categories] 1 ---&lt; [categories]            (1:N  Self-relationship: parent_id hierarchy)
[categories] 1 ---&lt; [products]              (1:N  Category categorizes multiple products)
[users] 1 --------&lt; [referrals]             (1:N  Self-relationship: referrer_id &rarr; referee_id)
[users] &gt;--------&lt; [drops] (Lottery)        (N:M  Resolved via associative entity: lottery_entries)
[users] &gt;--------&lt; [loyalty_tiers]          (N:M  Resolved via associative bridge: user_tiers)
    </div>

    <div class="page-footer">
      <span>PES University • DBMS Level 3 Evaluation • Project FlashDrop</span>
      <span>Page 2 of 3: Entity Classification &amp; Cardinality Matrix</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 3: RELATIONSHIPS & EXAMINER VIVA DEFENSE (A4 PORTRAIT) -->
  <!-- ========================================================================= -->
  <div class="sheet sheet-portrait">
    <div class="univ-header">
      <h1>PES UNIVERSITY</h1>
      <h2>DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING • DBMS LEVEL 3 EVALUATION</h2>
      <div class="meta-row">
        <span>COURSE: UE22CS252AA</span>
        <span>COMPONENT 01: ER MODEL DEFENSE</span>
        <span>IDENTIFYING RELATIONSHIPS &amp; VIVA Q&amp;A</span>
      </div>
    </div>

    <h3>1. Identifying Relationships &amp; Weak Entity Lifecycles</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Parent &rarr; Child Entity</th>
          <th style="width: 25%;">Relationship Type</th>
          <th>Semantic Rationale &amp; Referential Cascade Invariant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>orders &rarr; order_items</strong></td>
          <td>Identifying Weak Entity</td>
          <td>An <code>order_item</code> has no semantic validity outside its parent <code>order</code>. Enforces <code>ON DELETE CASCADE</code> so orphan line items cannot exist.</td>
        </tr>
        <tr>
          <td><strong>wallets &rarr; wallet_ledger</strong></td>
          <td>Identifying Weak Entity</td>
          <td>Every ledger entry is an immutable delta strictly tied to a parent wallet. A balance change without an owning wallet violates double-entry principles.</td>
        </tr>
        <tr>
          <td><strong>categories &rarr; categories</strong></td>
          <td>Unary Recursive 1:N</td>
          <td>Modeled using nullable <code>parent_id</code>. Root categories have <code>parent_id IS NULL</code>. Traversed via recursive Common Table Expressions (CTEs).</td>
        </tr>
        <tr>
          <td><strong>users &rarr; referrals</strong></td>
          <td>Binary Recursive 1:N</td>
          <td>Directed Acyclic Graph (DAG) linking <code>referrer_id</code> and <code>referee_id</code> back to <code>users.user_id</code> to evaluate referral rewards.</td>
        </tr>
      </tbody>
    </table>

    <h3>2. Examiner Viva Defense Questions &amp; Answers (Component 01)</h3>
    <div style="font-size: 9.5pt; line-height: 1.5; border: 1px solid #6b7280; padding: 10px; margin-top: 8px;">
      <p style="margin-bottom: 8px;">
        <strong>Question 1: What is the difference between a strong entity and a weak entity in your ER model?</strong><br>
        <em>Answer:</em> A strong entity possesses an independent existence with a primary key derived entirely from its own attributes (e.g., <code>users</code>, <code>products</code>, <code>drops</code>). A weak entity depends existence-wise on an identifying owner entity; it has no independent existence and its lifecycle is bound to the owner (e.g., <code>order_items</code> cannot exist without <code>orders</code>; <code>wallet_ledger</code> cannot exist without <code>wallets</code>).
      </p>

      <p style="margin-bottom: 8px;">
        <strong>Question 2: How did you resolve Many-to-Many (M:N) relationships in your model?</strong><br>
        <em>Answer:</em> In relational theory, M:N relationships cannot be modeled directly with single foreign keys. We decomposed M:N relationships using associative bridge entities: <code>users &times; drops</code> in the fair waiting room is decomposed via <code>lottery_entries</code> with <code>UNIQUE(drop_id, user_id)</code>, and <code>users &times; loyalty_tiers</code> is decomposed via <code>user_tiers</code>.
      </p>

      <p style="margin-bottom: 8px;">
        <strong>Question 3: Why are categories self-referencing instead of having separate subcategory tables?</strong><br>
        <em>Answer:</em> Creating separate tables (e.g. <code>subcategories</code>, <code>sub_subcategories</code>) introduces fixed depth and schema rigidity. A unary self-referencing relationship (<code>parent_id &rarr; category_id</code>) enables arbitrary hierarchical tree depth in a single normalized table, queryable via standard ANSI SQL Recursive CTEs.
      </p>

      <p>
        <strong>Question 4: Why is inventory modeled as a separate 1:1 entity rather than an attribute of drops?</strong><br>
        <em>Answer:</em> Drops represent marketing event schedules (start, end, status), while inventory represents the physical durable stock core under high-frequency pessimistic row locks (<code>available_quantity</code>, <code>reserved_holds</code>, <code>sold_quantity</code>). Separating them isolates row-locking overhead from event metadata and allows the in-database check constraint <code>CHECK (available + reserved + sold = total)</code>.
      </p>
    </div>

    <div class="page-footer">
      <span>PES University • Dept. of CSE • Course Code: UE22CS252AA</span>
      <span>Page 3 of 3: ER Defense &amp; Identifying Relationships</span>
    </div>
  </div>

</body>
</html>
`;

  fs.writeFileSync(path.join(__dirname, '../docs/er_diagram_printable.html'), html, 'utf8');
  console.log('Saved docs/er_diagram_printable.html successfully!');
}

buildErDoc();
