const fs = require('fs');
const path = require('path');

function buildDoc() {
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
  svg = svg.split("PROJECT FLASHDROP ⚡ ENTERPRISE CROW'S FOOT ER DIAGRAM").join("PROJECT FLASHDROP: RELATIONAL SCHEMA DIAGRAM (20 RELATIONS)");
  svg = svg.split("20 Normalized Relational Entities in BCNF (MySQL 8.0 Core) • Cardinalities: || (One) to &lt; (Many)").join("Logical &amp; Physical Relational Model (MySQL 8.0 InnoDB) • Primary Keys (PK) &amp; Foreign Key References (FK &rarr; PK)");
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

  // Save standalone SVG
  fs.writeFileSync(path.join(__dirname, '../docs/relational_schema_white.svg'), svg, 'utf8');
  console.log('Saved docs/relational_schema_white.svg');

  // Now build the pure professional academic printable HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PES University - Project FlashDrop Relational Schema & Normalization</title>
  <style>
    /* Pure Academic Formal Typography (No fancy styling, clean print standard) */
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
      font-size: 9.5pt;
    }

    th, td {
      border: 1px solid #6b7280;
      padding: 5px 8px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #111827;
    }

    /* Schema Grid */
    .schema-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-size: 9pt;
      font-family: Consolas, "Courier New", monospace;
    }

    .schema-box {
      border: 1px solid #9ca3af;
      padding: 6px 8px;
      background-color: #ffffff;
      line-height: 1.4;
    }

    .schema-box strong {
      font-size: 9.5pt;
      color: #111827;
      font-family: Arial, sans-serif;
    }

    .pk {
      text-decoration: underline;
      font-weight: bold;
      color: #111827;
    }

    .fk {
      color: #0369a1;
      font-weight: bold;
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
      <strong>PES UNIVERSITY — DBMS LEVEL 3 EVALUATION (COMPONENT 02)</strong>
      <span style="color: #6b7280; font-size: 11px; margin-left: 10px;">A4 Printable Document (Standard Academic Format)</span>
    </div>
    <div>
      <button class="btn-action" onclick="window.print()">Print Document / Save as PDF</button>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 1: RELATIONAL SCHEMA DIAGRAM (A4 LANDSCAPE) -->
  <!-- ========================================================================= -->
  <div class="sheet">
    <div class="univ-header">
      <h1>PES UNIVERSITY</h1>
      <h2>DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING • DATABASE MANAGEMENT SYSTEMS (UE22CS252AA)</h2>
      <div class="meta-row">
        <span>PROJECT: FLASHDROP HIGH-CONCURRENCY COMMERCE ENGINE</span>
        <span>COMPONENT 02: RELATIONAL SCHEMA DIAGRAM</span>
        <span>AUTHORS: VIBHAV M &amp; VAINIK</span>
      </div>
    </div>

    <!-- INLINE VECTOR SVG DIAGRAM (100% Reliable Loading - No External Images) -->
    <div class="diagram-frame">
      ${svg}
    </div>

    <div class="page-footer">
      <span>Relational Model: MySQL 8.0 InnoDB │ Normal Form: BCNF │ Total Relations: 20</span>
      <span>Page 1 of 3: Relational Architecture Diagram</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 2: ALGEBRAIC SCHEMA NOTATION & ER MAPPING RULES (A4 PORTRAIT) -->
  <!-- ========================================================================= -->
  <div class="sheet sheet-portrait">
    <div class="univ-header">
      <h1>PES UNIVERSITY</h1>
      <h2>DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING • DBMS LEVEL 3 EVALUATION</h2>
      <div class="meta-row">
        <span>COURSE: UE22CS252AA</span>
        <span>COMPONENT 02: FORMAL RELATIONAL SCHEMA NOTATION</span>
        <span>20 RELATIONS IN BCNF</span>
      </div>
    </div>

    <h3>1. Relational Schema Specification (Underlined PK, Asterisked FK)</h3>
    <div class="schema-columns">
      <div class="schema-box">
        <strong>1. roles</strong><br>
        (<span class="pk">role_id</span>, role_name, description, created_at)
      </div>
      <div class="schema-box">
        <strong>2. users</strong><br>
        (<span class="pk">user_id</span>, email, password_hash, first_name, last_name, phone, status, failed_logins, <span class="fk">role_id*</span>)
      </div>
      <div class="schema-box">
        <strong>3. addresses</strong><br>
        (<span class="pk">address_id</span>, address_line1, city, state, postal_code, country, is_default, <span class="fk">user_id*</span>)
      </div>
      <div class="schema-box">
        <strong>4. categories</strong><br>
        (<span class="pk">category_id</span>, name, slug, description, <span class="fk">parent_id* (self-ref)</span>)
      </div>
      <div class="schema-box">
        <strong>5. products</strong><br>
        (<span class="pk">product_id</span>, sku, title, description, base_price, attributes_json, <span class="fk">category_id*</span>)
      </div>
      <div class="schema-box">
        <strong>6. price_history</strong><br>
        (<span class="pk">history_id</span>, old_price, new_price, changed_at, <span class="fk">product_id*</span>, <span class="fk">changed_by*</span>)
      </div>
      <div class="schema-box">
        <strong>7. drops</strong><br>
        (<span class="pk">drop_id</span>, title, slug, drop_price, start_time, end_time, status, max_per_user, <span class="fk">product_id*</span>)
      </div>
      <div class="schema-box">
        <strong>8. inventory</strong><br>
        (<span class="pk">inventory_id</span>, total_allocated, reserved_holds, sold_quantity, available_qty, version, <span class="fk">drop_id* UQ</span>)
      </div>
      <div class="schema-box">
        <strong>9. orders</strong><br>
        (<span class="pk">order_id</span>, order_number, total_amount, discount, final_amount, status, <span class="fk">user_id*</span>, <span class="fk">drop_id*</span>)
      </div>
      <div class="schema-box">
        <strong>10. order_items</strong><br>
        (<span class="pk">item_id</span>, quantity, unit_price, subtotal, <span class="fk">order_id* CASCADE</span>, <span class="fk">product_id*</span>)
      </div>
      <div class="schema-box">
        <strong>11. payments</strong><br>
        (<span class="pk">payment_id</span>, payment_method, txn_ref, amount, status, gateway_json, <span class="fk">order_id* UQ</span>)
      </div>
      <div class="schema-box">
        <strong>12. wallets</strong><br>
        (<span class="pk">wallet_id</span>, balance, currency, is_locked, updated_at, <span class="fk">user_id* UQ</span>)
      </div>
      <div class="schema-box">
        <strong>13. wallet_ledger</strong><br>
        (<span class="pk">ledger_id</span>, entry_type, amount, balance_after, ref_type, ref_id, <span class="fk">wallet_id* CASCADE</span>)
      </div>
      <div class="schema-box">
        <strong>14. referrals</strong><br>
        (<span class="pk">referral_id</span>, referral_code, status, reward_amount, <span class="fk">referrer_id*</span>, <span class="fk">referee_id* UQ</span>)
      </div>
      <div class="schema-box">
        <strong>15. loyalty_tiers</strong><br>
        (<span class="pk">tier_id</span>, tier_name, min_spend, discount_pct, early_access_mins)
      </div>
      <div class="schema-box">
        <strong>16. user_tiers</strong><br>
        (<span class="pk">id</span>, achieved_at, expires_at, <span class="fk">user_id*</span>, <span class="fk">tier_id*</span>)
      </div>
      <div class="schema-box">
        <strong>17. lottery_entries</strong><br>
        (<span class="pk">entry_id</span>, ticket_number, entry_time, is_winner, <span class="fk">drop_id*</span>, <span class="fk">user_id*</span>)
      </div>
      <div class="schema-box">
        <strong>18. purchase_attempts</strong><br>
        (<span class="pk">attempt_id</span>, ip_address, user_agent, status, latency_ms, <span class="fk">drop_id*</span>, <span class="fk">user_id*</span>)
      </div>
      <div class="schema-box">
        <strong>19. fraud_flags</strong><br>
        (<span class="pk">flag_id</span>, risk_score, flag_reason, is_resolved, flagged_at, <span class="fk">user_id*</span>)
      </div>
      <div class="schema-box">
        <strong>20. audit_log</strong><br>
        (<span class="pk">log_id</span>, table_name, action, record_id, old_values_json, new_values_json, <span class="fk">user_id*</span>)
      </div>
    </div>

    <h3>2. Formal ER-to-Relational Mapping Rules</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Rule #</th>
          <th style="width: 28%;">ER Construct</th>
          <th>Relational Schema Realization (FlashDrop)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Rule 1</strong></td>
          <td>Strong Entities</td>
          <td>Direct relation creation with primary keys: <code>roles</code>, <code>users</code>, <code>products</code>, <code>drops</code>.</td>
        </tr>
        <tr>
          <td><strong>Rule 2</strong></td>
          <td>Weak Entities</td>
          <td>Foreign key to owner + identifying key with <code>ON DELETE CASCADE</code>: <code>order_items</code>, <code>wallet_ledger</code>.</td>
        </tr>
        <tr>
          <td><strong>Rule 3</strong></td>
          <td>1:1 Relationships</td>
          <td>Foreign key in child relation with <code>UNIQUE</code> constraint: <code>wallets.user_id</code>, <code>inventory.drop_id</code>.</td>
        </tr>
        <tr>
          <td><strong>Rule 4</strong></td>
          <td>1:N Relationships</td>
          <td>Primary key of '1' entity inserted as foreign key into 'N' relation: <code>products.category_id</code>, <code>orders.user_id</code>.</td>
        </tr>
        <tr>
          <td><strong>Rule 5</strong></td>
          <td>M:N Relationships</td>
          <td>Associative bridge relations with composite foreign keys: <code>lottery_entries</code>, <code>user_tiers</code>.</td>
        </tr>
        <tr>
          <td><strong>Rule 6</strong></td>
          <td>Recursive / Unary</td>
          <td>Foreign key referencing own relation's primary key: <code>categories.parent_id</code>, <code>referrals.referrer_id</code>.</td>
        </tr>
        <tr>
          <td><strong>Rule 7</strong></td>
          <td>Complex Attributes</td>
          <td>Structured using MySQL 8 native <code>JSON</code> data type: <code>products.attributes_json</code>.</td>
        </tr>
      </tbody>
    </table>

    <div class="page-footer">
      <span>Project FlashDrop • Relational Model Mapping</span>
      <span>Page 2 of 3: Formal Algebraic Schema</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 3: FUNCTIONAL DEPENDENCIES & NORMALIZATION PROOFS (A4 PORTRAIT) -->
  <!-- ========================================================================= -->
  <div class="sheet sheet-portrait">
    <div class="univ-header">
      <h1>PES UNIVERSITY</h1>
      <h2>DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING • DBMS LEVEL 3 EVALUATION</h2>
      <div class="meta-row">
        <span>COURSE: UE22CS252AA</span>
        <span>COMPONENT 02: BCNF NORMALIZATION PROOFS</span>
        <span>FUNCTIONAL DEPENDENCY ANALYSIS</span>
      </div>
    </div>

    <h3>1. Functional Dependency (FD) Analysis on Core Relations</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Relation</th>
          <th style="width: 48%;">Functional Dependencies (FDs)</th>
          <th>Candidate Keys &amp; Normal Form</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>orders</strong></td>
          <td>
            <strong>FD₁:</strong> {order_id} &rarr; {order_number, user_id, drop_id, total_amount, final_amount, status}<br>
            <strong>FD₂:</strong> {order_number} &rarr; {order_id, user_id, drop_id, final_amount, status}
          </td>
          <td>
            Candidate Keys: {order_id}, {order_number}<br>
            <strong>Status: BCNF</strong> (Every determinant is a superkey).
          </td>
        </tr>
        <tr>
          <td><strong>inventory</strong></td>
          <td>
            <strong>FD₁:</strong> {inventory_id} &rarr; {drop_id, total_allocated, available_qty, version}<br>
            <strong>FD₂:</strong> {drop_id} &rarr; {inventory_id, total_allocated, available_qty, version}
          </td>
          <td>
            Candidate Keys: {inventory_id}, {drop_id}<br>
            <strong>Status: BCNF</strong> (Zero partial or transitive dependencies).
          </td>
        </tr>
        <tr>
          <td><strong>wallet_ledger</strong></td>
          <td>
            <strong>FD₁:</strong> {ledger_id} &rarr; {wallet_id, entry_type, amount, balance_after, ref_id}
          </td>
          <td>
            Candidate Key: {ledger_id}<br>
            <strong>Status: BCNF</strong> (Strict single-attribute determinant).
          </td>
        </tr>
      </tbody>
    </table>

    <h3>2. Step-by-Step Normalization Proofs</h3>
    <table style="margin-top: 6px;">
      <thead>
        <tr>
          <th style="width: 20%;">Normal Form</th>
          <th style="width: 35%;">Theoretical Requirement</th>
          <th>Application &amp; Verification in FlashDrop Schema</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1NF (First NF)</strong></td>
          <td>All attributes contain atomic values; no repeating groups or multivalued arrays.</td>
          <td>All fields are atomic. Multi-part attributes like addresses are decomposed into <code>address_line1</code>, <code>city</code>, <code>state</code>, <code>postal_code</code>.</td>
        </tr>
        <tr>
          <td><strong>2NF (Second NF)</strong></td>
          <td>Must be in 1NF; zero partial dependencies (all non-prime attributes depend on full candidate key).</td>
          <td>In composite bridge tables (<code>order_items</code>, <code>user_tiers</code>), non-key columns depend on the entire composite key.</td>
        </tr>
        <tr>
          <td><strong>3NF (Third NF)</strong></td>
          <td>Must be in 2NF; zero transitive dependencies (no non-prime attribute depends on another non-prime attribute).</td>
          <td>In <code>orders</code>, customer attributes (<code>email</code>, <code>first_name</code>) are excluded to prevent <code>order_id &rarr; user_id &rarr; email</code> transitive dependency.</td>
        </tr>
        <tr>
          <td><strong>BCNF (Boyce-Codd)</strong></td>
          <td>For every non-trivial dependency X &rarr; Y, X must be a superkey without exception.</td>
          <td>Across all 20 relations, every determinant is a candidate key or superkey. The schema completely satisfies BCNF.</td>
        </tr>
      </tbody>
    </table>

    <h3>3. Examiner Viva Defense Questions &amp; Answers</h3>
    <div style="font-size: 9.5pt; line-height: 1.5; border: 1px solid #6b7280; padding: 10px; margin-top: 8px;">
      <p style="margin-bottom: 8px;">
        <strong>Question 1: What is the formal difference between 3NF and BCNF?</strong><br>
        <em>Answer:</em> 3NF permits a functional dependency <code>X &rarr; Y</code> if <code>Y</code> is a prime attribute (part of any candidate key), even if <code>X</code> is not a superkey. BCNF strictly eliminates this relaxation: every determinant <code>X</code> must be a superkey. FlashDrop uses surrogate primary keys and candidate keys across all 20 tables, satisfying BCNF.
      </p>
      <p>
        <strong>Question 2: Did you introduce any controlled denormalization?</strong><br>
        <em>Answer:</em> Yes, in table <code>inventory</code> we store <code>available_quantity</code> alongside <code>total_allocated</code>, <code>reserved_holds</code>, and <code>sold_quantity</code>, protected by a MySQL check constraint: <code>CHECK (available_quantity + reserved_holds + sold_quantity = total_allocated)</code>. This eliminates costly runtime <code>COUNT(*)</code> aggregation queries during high-concurrency stock checks.
      </p>
    </div>

    <div class="page-footer">
      <span>PES University • Dept. of CSE • Course Code: UE22CS252AA</span>
      <span>Page 3 of 3: Normalization Defense</span>
    </div>
  </div>

</body>
</html>
`;

  fs.writeFileSync(path.join(__dirname, '../docs/relational_schema_printable.html'), html, 'utf8');
  console.log('Saved docs/relational_schema_printable.html successfully!');
}

buildDoc();
