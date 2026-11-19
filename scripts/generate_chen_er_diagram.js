const fs = require('fs');
const path = require('path');

function generateChenDiagram() {
  // Canvas: 1800 x 1200 for ample spacing, zero cutoffs, textbook Chen elegance
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1200" width="100%" height="100%" style="background:#ffffff; font-family: 'Times New Roman', Times, serif;">
  <defs>
    <style>
      .entity-box { fill: #f8fafc; stroke: #000000; stroke-width: 2; }
      .weak-box { fill: none; stroke: #000000; stroke-width: 1.3; }
      .rel-box { fill: #f8fafc; stroke: #000000; stroke-width: 1.6; }
      .weak-rel { fill: none; stroke: #000000; stroke-width: 1.2; }
      .attr-oval { fill: #ffffff; stroke: #000000; stroke-width: 1.3; }
      .multival-oval { fill: none; stroke: #000000; stroke-width: 1.1; }
      .derived-oval { fill: #ffffff; stroke: #000000; stroke-width: 1.3; stroke-dasharray: 4,3; }
      
      .entity-txt { font-family: 'Times New Roman', serif; font-size: 13px; font-weight: bold; text-anchor: middle; dominant-baseline: central; fill: #000000; letter-spacing: 0.5px; }
      .rel-txt { font-family: 'Times New Roman', serif; font-size: 11px; font-weight: bold; text-anchor: middle; dominant-baseline: central; fill: #000000; }
      .attr-txt { font-family: 'Times New Roman', serif; font-size: 11px; text-anchor: middle; dominant-baseline: central; fill: #000000; }
      .pk-txt { font-family: 'Times New Roman', serif; font-size: 11px; font-weight: bold; text-anchor: middle; dominant-baseline: central; fill: #000000; text-decoration: underline; }
      .card-txt { font-family: Arial, sans-serif; font-size: 11.5px; font-weight: bold; fill: #000000; }
      .role-txt { font-family: 'Times New Roman', serif; font-size: 11px; font-style: italic; fill: #000000; }
      
      .conn-line { stroke: #000000; stroke-width: 1.4; fill: none; }
      .double-conn { stroke: #000000; stroke-width: 1.4; fill: none; }
    </style>
  </defs>

  <!-- Clean Background -->
  <rect width="1800" height="1200" fill="#ffffff"/>

  <!-- Academic Formal Header -->
  <g transform="translate(60, 32)">
    <text x="840" y="0" text-anchor="middle" font-family="'Times New Roman', serif" font-size="20" font-weight="bold" fill="#000000" letter-spacing="0.5">PROJECT FLASHDROP: CONCEPTUAL ENTITY-RELATIONSHIP (ER) MODEL</text>
    <text x="840" y="22" text-anchor="middle" font-family="'Times New Roman', serif" font-size="12.5" font-style="italic" fill="#222222">Peter Chen Textbook Notation (Elmasri &amp; Navathe Standard: Rectangles = Entities, Diamonds = Relationships, Ovals = Attributes)</text>
    <line x1="120" y1="36" x2="1560" y2="36" stroke="#000000" stroke-width="1.5"/>
  </g>

  <!-- ========================================================================= -->
  <!-- 1. ENTITY: USER (x=450, y=260) -->
  <!-- ========================================================================= -->
  <!-- USER Attributes -->
  <line x1="450" y1="260" x2="340" y2="170" class="conn-line"/>
  <ellipse cx="320" cy="155" rx="44" ry="16" class="attr-oval"/>
  <text x="320" y="155" class="pk-txt">user_id</text>

  <line x1="450" y1="260" x2="410" y2="150" class="conn-line"/>
  <ellipse cx="405" cy="135" rx="38" ry="15" class="attr-oval"/>
  <text x="405" y="135" class="attr-txt">email</text>

  <!-- Composite Attribute: Name -> first_name, last_name -->
  <line x1="450" y1="260" x2="495" y2="150" class="conn-line"/>
  <ellipse cx="495" cy="135" rx="36" ry="15" class="attr-oval"/>
  <text x="495" y="135" class="attr-txt">Name</text>
  <line x1="495" y1="120" x2="465" y2="85" class="conn-line"/>
  <ellipse cx="455" cy="75" rx="40" ry="14" class="attr-oval"/>
  <text x="455" y="75" class="attr-txt">first_name</text>
  <line x1="495" y1="120" x2="540" y2="85" class="conn-line"/>
  <ellipse cx="550" cy="75" rx="40" ry="14" class="attr-oval"/>
  <text x="550" y="75" class="attr-txt">last_name</text>

  <line x1="450" y1="260" x2="575" y2="165" class="conn-line"/>
  <ellipse cx="595" cy="155" rx="35" ry="15" class="attr-oval"/>
  <text x="595" y="155" class="attr-txt">phone</text>

  <line x1="450" y1="260" x2="320" y2="230" class="conn-line"/>
  <ellipse cx="295" cy="225" rx="35" ry="15" class="attr-oval"/>
  <text x="295" y="225" class="attr-txt">status</text>

  <!-- Recursive Relationship: REFERS (User refers User) -->
  <path d="M 390 280 C 260 320, 260 210, 390 245" class="conn-line"/>
  <polygon points="300,250 325,268 300,286 275,268" class="rel-box"/>
  <text x="300" y="268" class="rel-txt">REFERS</text>
  <text x="335" y="315" class="role-txt">Referee (N)</text>
  <text x="335" y="235" class="role-txt">Referrer (1)</text>

  <!-- USER Entity Rectangle -->
  <rect x="380" y="238" width="140" height="44" class="entity-box"/>
  <text x="450" y="260" class="entity-txt">USER</text>

  <!-- ========================================================================= -->
  <!-- 2. ENTITY: ROLE (x=120, y=260) & Relationship: ASSIGNED (x=250, y=260) -->
  <!-- ========================================================================= -->
  <!-- Total participation: User must have a Role -->
  <line x1="380" y1="258" x2="288" y2="258" class="double-conn"/>
  <line x1="380" y1="262" x2="288" y2="262" class="double-conn"/>
  <text x="360" y="250" class="card-txt">N</text>

  <!-- ASSIGNED Diamond -->
  <polygon points="250,238 288,260 250,282 212,260" class="rel-box"/>
  <text x="250" y="260" class="rel-txt">ASSIGNED</text>

  <line x1="212" y1="260" x2="160" y2="260" class="conn-line"/>
  <text x="175" y="250" class="card-txt">1</text>

  <!-- ROLE Entity Rectangle -->
  <rect x="80" y="238" width="80" height="44" class="entity-box"/>
  <text x="120" y="260" class="entity-txt">ROLE</text>
  <!-- Role attributes -->
  <line x1="120" y1="238" x2="120" y2="185" class="conn-line"/>
  <ellipse cx="120" cy="170" rx="38" ry="15" class="attr-oval"/>
  <text x="120" y="170" class="pk-txt">role_id</text>

  <line x1="80" y1="260" x2="35" y2="260" class="conn-line"/>
  <ellipse cx="38" cy="260" rx="34" ry="15" class="attr-oval" transform="translate(15,0)"/>
  <text x="53" y="260" class="attr-txt">name</text>

  <!-- ========================================================================= -->
  <!-- 3. ENTITY: ADDRESS (x=200, y=450) & Relationship: HAS_ADDRESS (x=315, y=370) -->
  <!-- ========================================================================= -->
  <line x1="410" y1="282" x2="335" y2="350" class="conn-line"/>
  <text x="390" y="305" class="card-txt">1</text>

  <polygon points="315,350 345,370 315,390 285,370" class="rel-box"/>
  <text x="315" y="370" class="rel-txt">HAS</text>

  <line x1="295" y1="385" x2="245" y2="430" class="conn-line"/>
  <text x="265" y="405" class="card-txt">N</text>

  <!-- ADDRESS Entity Rectangle -->
  <rect x="130" y="430" width="130" height="42" class="entity-box"/>
  <text x="195" y="451" class="entity-txt">ADDRESS</text>
  <!-- Address Attributes -->
  <line x1="130" y1="451" x2="85" y2="451" class="conn-line"/>
  <ellipse cx="55" cy="451" rx="42" ry="15" class="attr-oval"/>
  <text x="55" y="451" class="pk-txt">address_id</text>

  <line x1="160" y1="472" x2="120" y2="515" class="conn-line"/>
  <ellipse cx="105" cy="530" rx="34" ry="14" class="attr-oval"/>
  <text x="105" y="530" class="attr-txt">street</text>

  <!-- Composite Address_Info -> city, state, postal -->
  <line x1="210" y1="472" x2="230" y2="520" class="conn-line"/>
  <ellipse cx="235" cy="535" rx="44" ry="16" class="attr-oval"/>
  <text x="235" y="535" class="attr-txt">Address_Info</text>
  <line x1="215" y1="548" x2="185" y2="585" class="conn-line"/>
  <ellipse cx="170" cy="595" rx="30" ry="13" class="attr-oval"/>
  <text x="170" y="595" class="attr-txt">city</text>
  <line x1="235" y1="551" x2="235" y2="590" class="conn-line"/>
  <ellipse cx="235" cy="602" rx="30" ry="13" class="attr-oval"/>
  <text x="235" y="602" class="attr-txt">state</text>
  <line x1="255" y1="548" x2="285" y2="585" class="conn-line"/>
  <ellipse cx="300" cy="595" rx="32" ry="13" class="attr-oval"/>
  <text x="300" y="595" class="attr-txt">postal</text>

  <!-- ========================================================================= -->
  <!-- 4. ENTITY: WALLET (x=450, y=470) & WEAK ENTITY: WALLET_LEDGER (x=450, y=710) -->
  <!-- ========================================================================= -->
  <!-- Relationship: OWNS (1:1 Total Participation on both sides) -->
  <line x1="448" y1="282" x2="448" y2="345" class="double-conn"/>
  <line x1="452" y1="282" x2="452" y2="345" class="double-conn"/>
  <text x="460" y="305" class="card-txt">1</text>

  <polygon points="450,345 488,368 450,391 412,368" class="rel-box"/>
  <text x="450" y="368" class="rel-txt">OWNS</text>

  <line x1="448" y1="391" x2="448" y2="448" class="double-conn"/>
  <line x1="452" y1="391" x2="452" y2="448" class="double-conn"/>
  <text x="460" y="425" class="card-txt">1</text>

  <!-- WALLET Box -->
  <rect x="380" y="448" width="140" height="44" class="entity-box"/>
  <text x="450" y="470" class="entity-txt">WALLET</text>
  <!-- WALLET Attributes -->
  <line x1="520" y1="460" x2="570" y2="445" class="conn-line"/>
  <ellipse cx="605" cy="440" rx="38" ry="15" class="attr-oval"/>
  <text x="605" y="440" class="pk-txt">wallet_id</text>

  <line x1="520" y1="475" x2="575" y2="485" class="conn-line"/>
  <!-- Derived attribute: balance (Dashed oval) -->
  <ellipse cx="615" cy="490" rx="38" ry="15" class="derived-oval"/>
  <text x="615" y="490" class="attr-txt">balance</text>

  <!-- Identifying Relationship: AUDITED (Double Diamond) -->
  <line x1="450" y1="492" x2="450" y2="560" class="conn-line"/>
  <text x="460" y="525" class="card-txt">1</text>

  <polygon points="450,560 495,585 450,610 405,585" class="rel-box"/>
  <polygon points="450,566 485,585 450,604 415,585" class="weak-rel"/>
  <text x="450" y="585" class="rel-txt">AUDITED</text>

  <!-- Total Participation Double Line from WEAK ENTITY -->
  <line x1="448" y1="610" x2="448" y2="688" class="double-conn"/>
  <line x1="452" y1="610" x2="452" y2="688" class="double-conn"/>
  <text x="460" y="655" class="card-txt">N</text>

  <!-- WEAK ENTITY: WALLET_LEDGER (Double Rectangle) -->
  <rect x="360" y="688" width="180" height="46" class="entity-box"/>
  <rect x="365" y="693" width="170" height="36" class="weak-box"/>
  <text x="450" y="711" class="entity-txt">WALLET_LEDGER</text>
  <!-- Weak entity attributes -->
  <line x1="360" y1="711" x2="305" y2="695" class="conn-line"/>
  <ellipse cx="265" cy="690" rx="42" ry="16" class="attr-oval"/>
  <!-- Partial Key: dashed underline -->
  <text x="265" y="690" class="attr-txt">ledger_id</text>
  <line x1="240" y1="697" x2="290" y2="697" stroke="#000000" stroke-width="1.2" stroke-dasharray="3,2"/>

  <line x1="360" y1="725" x2="310" y2="745" class="conn-line"/>
  <ellipse cx="275" cy="750" rx="36" ry="15" class="attr-oval"/>
  <text x="275" y="750" class="attr-txt">amount</text>

  <line x1="450" y1="734" x2="450" y2="780" class="conn-line"/>
  <ellipse cx="450" cy="795" rx="42" ry="15" class="attr-oval"/>
  <text x="450" y="795" class="attr-txt">entry_type</text>

  <line x1="540" y1="711" x2="590" y2="711" class="conn-line"/>
  <ellipse cx="630" cy="711" rx="42" ry="15" class="attr-oval"/>
  <text x="630" y="711" class="attr-txt">balance_after</text>

  <!-- ========================================================================= -->
  <!-- 5. ENTITY: LOYALTY_TIER (x=160, y=860) & M:N ACHIEVES -->
  <!-- ========================================================================= -->
  <rect x="80" y="838" width="150" height="44" class="entity-box"/>
  <text x="155" y="860" class="entity-txt">LOYALTY_TIER</text>
  <line x1="155" y1="838" x2="155" y2="795" class="conn-line"/>
  <ellipse cx="155" cy="780" rx="36" ry="15" class="attr-oval"/>
  <text x="155" y="780" class="pk-txt">tier_id</text>

  <line x1="155" y1="882" x2="155" y2="925" class="conn-line"/>
  <ellipse cx="155" cy="940" rx="42" ry="15" class="attr-oval"/>
  <text x="155" y="940" class="attr-txt">discount_pct</text>

  <!-- ACHIEVES Diamond (M:N from USER to LOYALTY_TIER) -->
  <path d="M 380 270 Q 220 400 160 720" class="conn-line"/>
  <polygon points="160,670 195,690 160,710 125,690" class="rel-box"/>
  <text x="160" y="690" class="rel-txt">ACHIEVES</text>
  <line x1="160" y1="710" x2="155" y2="838" class="conn-line"/>
  <text x="290" y="325" class="card-txt">M</text>
  <text x="168" y="820" class="card-txt">N</text>

  <!-- ========================================================================= -->
  <!-- 6. ENTITY: CATEGORY (x=980, y=95) with Recursive PARENT_OF loop -->
  <!-- ========================================================================= -->
  <rect x="910" y="73" width="140" height="44" class="entity-box"/>
  <text x="980" y="95" class="entity-txt">CATEGORY</text>
  <!-- Category attributes -->
  <line x1="910" y1="88" x2="855" y2="75" class="conn-line"/>
  <ellipse cx="815" cy="70" rx="44" ry="15" class="attr-oval"/>
  <text x="815" y="70" class="pk-txt">category_id</text>

  <line x1="910" y1="105" x2="855" y2="120" class="conn-line"/>
  <ellipse cx="815" cy="125" rx="36" ry="15" class="attr-oval"/>
  <text x="815" y="125" class="attr-txt">name</text>

  <!-- Recursive PARENT loop on CATEGORY -->
  <path d="M 1050 85 C 1125 55, 1125 130, 1050 108" class="conn-line"/>
  <polygon points="1120,80 1145,95 1120,110 1095,95" class="rel-box"/>
  <text x="1120" y="95" class="rel-txt">PARENT</text>
  <text x="1060" y="72" class="role-txt">Parent (1)</text>
  <text x="1060" y="130" class="role-txt">Sub (N)</text>

  <!-- ========================================================================= -->
  <!-- 7. ENTITY: PRODUCT (x=980, y=260) & Relationship: CLASSIFIES -->
  <!-- ========================================================================= -->
  <line x1="980" y1="117" x2="980" y2="165" class="conn-line"/>
  <text x="990" y="135" class="card-txt">1</text>
  <polygon points="980,165 1018,188 980,211 942,188" class="rel-box"/>
  <text x="980" y="188" class="rel-txt">CONTAINS</text>
  <line x1="980" y1="211" x2="980" y2="238" class="conn-line"/>
  <text x="990" y="228" class="card-txt">N</text>

  <!-- PRODUCT Entity Rectangle -->
  <rect x="910" y="238" width="140" height="44" class="entity-box"/>
  <text x="980" y="260" class="entity-txt">PRODUCT</text>
  <!-- Product attributes -->
  <line x1="910" y1="248" x2="850" y2="225" class="conn-line"/>
  <ellipse cx="810" cy="215" rx="44" ry="16" class="attr-oval"/>
  <text x="810" y="215" class="pk-txt">product_id</text>

  <line x1="910" y1="260" x2="840" y2="260" class="conn-line"/>
  <ellipse cx="810" cy="260" rx="34" ry="15" class="attr-oval"/>
  <text x="810" y="260" class="attr-txt">sku</text>

  <line x1="910" y1="272" x2="850" y2="295" class="conn-line"/>
  <ellipse cx="810" cy="305" rx="38" ry="15" class="attr-oval"/>
  <text x="810" y="305" class="attr-txt">base_price</text>

  <!-- Multivalued attribute: attributes (Double Oval) -->
  <line x1="980" y1="282" x2="980" y2="330" class="conn-line"/>
  <ellipse cx="980" cy="348" rx="48" ry="17" class="attr-oval"/>
  <ellipse cx="980" cy="348" rx="43" ry="13" class="multival-oval"/>
  <text x="980" y="348" class="attr-txt">attributes</text>

  <!-- ========================================================================= -->
  <!-- 8. ENTITY: DROP (x=1360, y=260) & Relationship: FEATURED_IN -->
  <!-- ========================================================================= -->
  <line x1="1050" y1="260" x2="1165" y2="260" class="conn-line"/>
  <text x="1065" y="250" class="card-txt">1</text>
  <polygon points="1195,238 1233,260 1195,282 1157,260" class="rel-box"/>
  <text x="1195" y="260" class="rel-txt">FEATURED</text>
  <line x1="1233" y1="260" x2="1290" y2="260" class="conn-line"/>
  <text x="1270" y="250" class="card-txt">N</text>

  <!-- DROP Entity Rectangle -->
  <rect x="1290" y="238" width="140" height="44" class="entity-box"/>
  <text x="1360" y="260" class="entity-txt">DROP</text>
  <!-- Drop attributes -->
  <line x1="1360" y1="238" x2="1330" y2="190" class="conn-line"/>
  <ellipse cx="1320" cy="175" rx="38" ry="15" class="attr-oval"/>
  <text x="1320" y="175" class="pk-txt">drop_id</text>

  <line x1="1395" y1="238" x2="1425" y2="190" class="conn-line"/>
  <ellipse cx="1440" cy="175" rx="38" ry="15" class="attr-oval"/>
  <text x="1440" y="175" class="attr-txt">drop_price</text>

  <line x1="1430" y1="250" x2="1485" y2="235" class="conn-line"/>
  <ellipse cx="1525" cy="230" rx="38" ry="15" class="attr-oval"/>
  <text x="1525" y="230" class="attr-txt">start_time</text>

  <line x1="1430" y1="270" x2="1485" y2="285" class="conn-line"/>
  <ellipse cx="1525" cy="290" rx="36" ry="15" class="attr-oval"/>
  <text x="1525" y="290" class="attr-txt">status</text>

  <!-- ========================================================================= -->
  <!-- 9. ENTITY: INVENTORY (x=1620, y=470) & Relationship: ALLOCATES (1:1) -->
  <!-- ========================================================================= -->
  <path d="M 1360 282 L 1480 370" class="conn-line"/>
  <text x="1380" y="315" class="card-txt">1</text>
  <polygon points="1505,350 1545,370 1505,390 1465,370" class="rel-box"/>
  <text x="1505" y="370" class="rel-txt">ALLOCATES</text>
  
  <!-- Double line to INVENTORY (Mandatory dedicated inventory allocation) -->
  <line x1="1530" y1="385" x2="1598" y2="448" class="double-conn"/>
  <line x1="1534" y1="389" x2="1602" y2="452" class="double-conn"/>
  <text x="1585" y="420" class="card-txt">1</text>

  <!-- INVENTORY Entity Rectangle -->
  <rect x="1550" y="448" width="140" height="44" class="entity-box"/>
  <text x="1620" y="470" class="entity-txt">INVENTORY</text>
  <!-- Inventory attributes -->
  <line x1="1690" y1="460" x2="1735" y2="445" class="conn-line"/>
  <ellipse cx="1760" cy="435" rx="38" ry="15" class="attr-oval"/>
  <text x="1760" y="435" class="pk-txt">inventory_id</text>

  <line x1="1690" y1="475" x2="1735" y2="485" class="conn-line"/>
  <ellipse cx="1755" cy="490" rx="42" ry="15" class="attr-oval"/>
  <text x="1755" y="490" class="attr-txt">total_allocated</text>

  <!-- Derived attribute: available_qty (Dashed Oval) -->
  <line x1="1620" y1="492" x2="1620" y2="535" class="conn-line"/>
  <ellipse cx="1620" cy="552" rx="50" ry="16" class="derived-oval"/>
  <text x="1620" y="552" class="attr-txt">available_qty</text>

  <line x1="1550" y1="470" x2="1490" y2="470" class="conn-line"/>
  <ellipse cx="1450" cy="470" rx="40" ry="15" class="attr-oval"/>
  <text x="1450" y="470" class="attr-txt">sold_quantity</text>

  <!-- ========================================================================= -->
  <!-- 10. M:N RELATIONSHIP: FAIR LOTTERY (USER <-> DROP) -->
  <!-- ========================================================================= -->
  <path d="M 450 238 Q 910 15 1360 238" class="conn-line"/>
  <polygon points="910,75 948,95 910,115 872,95" class="rel-box"/>
  <text x="910" y="95" class="rel-txt">LOTTERY</text>
  <text x="470" y="220" class="card-txt">M</text>
  <text x="1335" y="220" class="card-txt">N</text>
  <!-- Lottery relationship attribute: ticket_no -->
  <line x1="910" y1="75" x2="910" y2="45" class="conn-line"/>
  <ellipse cx="910" cy="32" rx="42" ry="14" class="attr-oval"/>
  <text x="910" y="32" class="attr-txt">ticket_no</text>

  <!-- ========================================================================= -->
  <!-- 11. RELATIONSHIP: PLACES & ENTITY: ORDER (x=730, y=470) -->
  <!-- ========================================================================= -->
  <line x1="520" y1="260" x2="620" y2="330" class="conn-line"/>
  <text x="535" y="280" class="card-txt">1</text>

  <!-- PLACES Diamond with Relationship Attribute -->
  <polygon points="640,320 675,340 640,360 605,340" class="rel-box"/>
  <text x="640" y="340" class="rel-txt">PLACES</text>
  <line x1="640" y1="360" x2="640" y2="395" class="conn-line"/>
  <ellipse cx="640" cy="408" rx="42" ry="14" class="attr-oval"/>
  <text x="640" y="408" class="attr-txt">created_at</text>

  <line x1="660" y1="355" x2="710" y2="448" class="conn-line"/>
  <text x="690" y="420" class="card-txt">N</text>

  <!-- Connect DROP to ORDER (Drop fulfills Orders) -->
  <path d="M 1320 282 L 800 448" class="conn-line"/>
  <text x="1295" y="315" class="card-txt">1</text>
  <text x="815" y="430" class="card-txt">N</text>

  <!-- ORDER Entity Rectangle -->
  <rect x="660" y="448" width="140" height="44" class="entity-box"/>
  <text x="730" y="470" class="entity-txt">ORDER</text>
  <!-- Order Attributes -->
  <line x1="660" y1="460" x2="605" y2="445" class="conn-line"/>
  <ellipse cx="570" cy="440" rx="38" ry="15" class="attr-oval"/>
  <text x="570" y="440" class="pk-txt">order_id</text>

  <line x1="730" y1="492" x2="730" y2="535" class="conn-line"/>
  <ellipse cx="730" cy="550" rx="46" ry="15" class="attr-oval"/>
  <text x="730" y="550" class="attr-txt">final_amount</text>

  <line x1="800" y1="460" x2="855" y2="445" class="conn-line"/>
  <ellipse cx="890" cy="440" rx="36" ry="15" class="attr-oval"/>
  <text x="890" y="440" class="attr-txt">status</text>

  <!-- ========================================================================= -->
  <!-- 12. WEAK ENTITY: ORDER_ITEM & IDENTIFYING RELATIONSHIP: CONTAINS -->
  <!-- ========================================================================= -->
  <line x1="730" y1="492" x2="730" y2="585" class="conn-line"/>
  <text x="740" y="525" class="card-txt">1</text>

  <!-- Double Diamond CONTAINS -->
  <polygon points="730,585 775,610 730,635 685,610" class="rel-box"/>
  <polygon points="730,591 765,610 730,629 695,610" class="weak-rel"/>
  <text x="730" y="610" class="rel-txt">CONTAINS</text>

  <!-- Total Participation Double Line to ORDER_ITEM -->
  <line x1="728" y1="635" x2="728" y2="688" class="double-conn"/>
  <line x1="732" y1="635" x2="732" y2="688" class="double-conn"/>
  <text x="740" y="665" class="card-txt">N</text>

  <!-- WEAK ENTITY: ORDER_ITEM (Double Rectangle) -->
  <rect x="650" y="688" width="160" height="46" class="entity-box"/>
  <rect x="655" y="693" width="150" height="36" class="weak-box"/>
  <text x="730" y="711" class="entity-txt">ORDER_ITEM</text>
  <!-- Weak entity attributes -->
  <line x1="650" y1="711" x2="595" y2="711" class="conn-line"/>
  <ellipse cx="555" cy="711" rx="42" ry="16" class="attr-oval"/>
  <text x="555" y="711" class="attr-txt">item_id</text>
  <line x1="530" y1="718" x2="580" y2="718" stroke="#000000" stroke-width="1.2" stroke-dasharray="3,2"/>

  <line x1="680" y1="734" x2="660" y2="775" class="conn-line"/>
  <ellipse cx="645" cy="790" rx="34" ry="14" class="attr-oval"/>
  <text x="645" y="790" class="attr-txt">quantity</text>

  <line x1="780" y1="734" x2="800" y2="775" class="conn-line"/>
  <ellipse cx="815" cy="790" rx="36" ry="14" class="attr-oval"/>
  <text x="815" y="790" class="attr-txt">unit_price</text>

  <!-- Connector from ORDER_ITEM to PRODUCT (N:1) -->
  <path d="M 810 705 Q 890 550 945 282" class="conn-line"/>
  <text x="925" y="315" class="card-txt">1</text>
  <text x="818" y="690" class="card-txt">N</text>

  <!-- ========================================================================= -->
  <!-- 13. ENTITY: PAYMENT (x=1080, y=470) & Relationship: SETTLED_VIA (1:1) -->
  <!-- ========================================================================= -->
  <line x1="800" y1="470" x2="905" y2="470" class="conn-line"/>
  <text x="815" y="460" class="card-txt">1</text>
  <polygon points="935,448 973,470 935,492 897,470" class="rel-box"/>
  <text x="935" y="470" class="rel-txt">SETTLED</text>
  <line x1="973" y1="470" x2="1010" y2="470" class="conn-line"/>
  <text x="990" y="460" class="card-txt">1</text>

  <!-- PAYMENT Entity Rectangle -->
  <rect x="1010" y="448" width="140" height="44" class="entity-box"/>
  <text x="1080" y="470" class="entity-txt">PAYMENT</text>
  <!-- Payment attributes -->
  <line x1="1150" y1="460" x2="1200" y2="445" class="conn-line"/>
  <ellipse cx="1235" cy="440" rx="42" ry="15" class="attr-oval"/>
  <text x="1235" y="440" class="pk-txt">payment_id</text>

  <line x1="1080" y1="492" x2="1080" y2="535" class="conn-line"/>
  <ellipse cx="1080" cy="550" rx="40" ry="15" class="attr-oval"/>
  <text x="1080" y="550" class="attr-txt">txn_ref</text>

  <line x1="1150" y1="475" x2="1200" y2="485" class="conn-line"/>
  <ellipse cx="1235" cy="490" rx="36" ry="15" class="attr-oval"/>
  <text x="1235" y="490" class="attr-txt">method</text>

  <!-- ========================================================================= -->
  <!-- 14. TELEMETRY & FRAUD: FRAUD_FLAG (x=1140, y=740) & AUDIT_LOG (x=1440, y=740) -->
  <!-- ========================================================================= -->
  <!-- USER -> TRIGGERS -> FRAUD_FLAG -->
  <path d="M 520 270 Q 850 620 1020 740" class="conn-line"/>
  <polygon points="940,600 975,620 940,640 905,620" class="rel-box"/>
  <text x="940" y="620" class="rel-txt">TRIGGERS</text>
  <text x="545" y="300" class="card-txt">1</text>
  <text x="1040" y="725" class="card-txt">N</text>

  <!-- FRAUD_FLAG Entity Rectangle -->
  <rect x="1060" y="718" width="140" height="44" class="entity-box"/>
  <text x="1130" y="740" class="entity-txt">FRAUD_FLAG</text>
  <line x1="1130" y1="718" x2="1130" y2="675" class="conn-line"/>
  <ellipse cx="1130" cy="660" rx="36" ry="15" class="attr-oval"/>
  <text x="1130" y="660" class="pk-txt">flag_id</text>
  <line x1="1130" y1="762" x2="1130" y2="805" class="conn-line"/>
  <ellipse cx="1130" cy="820" rx="38" ry="15" class="attr-oval"/>
  <text x="1130" y="820" class="attr-txt">risk_score</text>

  <!-- AUDIT_LOG (Independent Relational Log Entity) -->
  <rect x="1370" y="718" width="140" height="44" class="entity-box"/>
  <text x="1440" y="740" class="entity-txt">AUDIT_LOG</text>
  <line x1="1440" y1="718" x2="1440" y2="675" class="conn-line"/>
  <ellipse cx="1440" cy="660" rx="36" ry="15" class="attr-oval"/>
  <text x="1440" y="660" class="pk-txt">log_id</text>
  <line x1="1440" y1="762" x2="1440" y2="805" class="conn-line"/>
  <ellipse cx="1440" cy="820" rx="38" ry="15" class="attr-oval"/>
  <text x="1440" y="820" class="attr-txt">action</text>

  <!-- ========================================================================= -->
  <!-- NOTATION LEGEND (Bottom Banner) -->
  <!-- ========================================================================= -->
  <g transform="translate(60, 1020)">
    <rect x="0" y="0" width="1680" height="135" fill="#f8fafc" stroke="#000000" stroke-width="1.5"/>
    <text x="25" y="26" font-family="'Times New Roman', serif" font-size="13" font-weight="bold" fill="#000000">PETER CHEN ER NOTATION CONVENTIONS &amp; SEMANTIC CONSTRUCTS (TEXTBOOK FORMALISM):</text>

    <!-- Legend Item 1: Strong Entity -->
    <rect x="30" y="50" width="85" height="30" class="entity-box"/>
    <text x="72" y="65" class="entity-txt" font-size="11">ENTITY</text>
    <text x="72" y="100" font-family="'Times New Roman', serif" font-size="10.5" text-anchor="middle" fill="#000000">Strong Entity</text>

    <!-- Legend Item 2: Weak Entity -->
    <rect x="145" y="50" width="85" height="30" class="entity-box"/>
    <rect x="149" y="54" width="77" height="22" class="weak-box"/>
    <text x="187" y="65" class="entity-txt" font-size="10">WEAK</text>
    <text x="187" y="100" font-family="'Times New Roman', serif" font-size="10.5" text-anchor="middle" fill="#000000">Weak Entity</text>

    <!-- Legend Item 3: Relationship -->
    <polygon points="295,50 332,65 295,80 258,65" class="rel-box"/>
    <text x="295" y="65" class="rel-txt" font-size="10">REL</text>
    <text x="295" y="100" font-family="'Times New Roman', serif" font-size="10.5" text-anchor="middle" fill="#000000">Relationship</text>

    <!-- Legend Item 4: Identifying Relationship -->
    <polygon points="395,50 432,65 395,80 358,65" class="rel-box"/>
    <polygon points="395,54 424,65 395,76 366,65" class="weak-rel"/>
    <text x="395" y="65" class="rel-txt" font-size="9">IDENT</text>
    <text x="395" y="100" font-family="'Times New Roman', serif" font-size="10.5" text-anchor="middle" fill="#000000">Identifying Rel</text>

    <!-- Legend Item 5: Key Attribute -->
    <ellipse cx="500" cy="65" rx="40" ry="15" class="attr-oval"/>
    <text x="500" y="65" class="pk-txt" font-size="10">Primary_Key</text>
    <text x="500" y="100" font-family="'Times New Roman', serif" font-size="10.5" text-anchor="middle" fill="#000000">Key Attribute</text>

    <!-- Legend Item 6: Partial Key -->
    <ellipse cx="605" cy="65" rx="40" ry="15" class="attr-oval"/>
    <text x="605" y="65" class="attr-txt" font-size="10">Partial_Key</text>
    <line x1="580" y1="71" x2="630" y2="71" stroke="#000000" stroke-width="1.1" stroke-dasharray="3,2"/>
    <text x="605" y="100" font-family="'Times New Roman', serif" font-size="10.5" text-anchor="middle" fill="#000000">Partial Key (Weak)</text>

    <!-- Legend Item 7: Multivalued Attribute -->
    <ellipse cx="715" cy="65" rx="44" ry="16" class="attr-oval"/>
    <ellipse cx="715" cy="65" rx="39" ry="12" class="multival-oval"/>
    <text x="715" y="65" class="attr-txt" font-size="10">Multivalued</text>
    <text x="715" y="100" font-family="'Times New Roman', serif" font-size="10.5" text-anchor="middle" fill="#000000">Multivalued Attr</text>

    <!-- Legend Item 8: Derived Attribute -->
    <ellipse cx="830" cy="65" rx="44" ry="15" class="derived-oval"/>
    <text x="830" y="65" class="attr-txt" font-size="10">Derived</text>
    <text x="830" y="100" font-family="'Times New Roman', serif" font-size="10.5" text-anchor="middle" fill="#000000">Derived Attr</text>

    <!-- Legend Item 9: Total Participation -->
    <line x1="920" y1="62" x2="980" y2="62" stroke="#000000" stroke-width="1.5"/>
    <line x1="920" y1="68" x2="980" y2="68" stroke="#000000" stroke-width="1.5"/>
    <text x="950" y="100" font-family="'Times New Roman', serif" font-size="10.5" text-anchor="middle" fill="#000000">Total Particip.</text>

    <!-- Legend Item 10: Cardinality -->
    <text x="1050" y="65" class="card-txt" font-size="14">1 : N / M</text>
    <text x="1050" y="100" font-family="'Times New Roman', serif" font-size="10.5" text-anchor="middle" fill="#000000">Cardinality Ratio</text>

    <!-- Institutional Metadata Right -->
    <line x1="1130" y1="40" x2="1130" y2="110" stroke="#9ca3af" stroke-width="1"/>
    <text x="1155" y="58" font-family="'Times New Roman', serif" font-size="11" fill="#000000"><strong>Academic Course:</strong> Database Management Systems (UE22CS252AA)</text>
    <text x="1155" y="78" font-family="'Times New Roman', serif" font-size="11" fill="#000000"><strong>Evaluation:</strong> Level 3 Experiential Learning Component 01 (Max: 2 Marks)</text>
    <text x="1155" y="98" font-family="'Times New Roman', serif" font-size="11" fill="#000000"><strong>Institution:</strong> PES University • Faculty of Engineering (Dept. of CSE)</text>
  </g>
</svg>`;

  fs.writeFileSync(path.join(__dirname, '../docs/chen_er_diagram_white.svg'), svg, 'utf8');
  console.log('Saved docs/chen_er_diagram_white.svg successfully!');

  // Complete 3-Page A4 Printable HTML Document with Inline Vector SVG
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PES University - Project FlashDrop Conceptual ER Model (Peter Chen Notation)</title>
  <style>
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

    /* Screen Action Bar (hidden when printing) */
    .screen-actions {
      background-color: #f3f4f6;
      border-bottom: 1px solid #d1d5db;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-action {
      background-color: #1f2937;
      color: #ffffff;
      border: 1px solid #111827;
      padding: 7px 18px;
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
      padding: 10mm 12mm;
      background: #ffffff;
      border: 1px solid #d1d5db;
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
      margin-bottom: 12px;
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
      font-size: 10.5pt;
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
      margin-bottom: 8px;
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

    /* Footer */
    .page-footer {
      border-top: 1px solid #9ca3af;
      padding-top: 5px;
      margin-top: 10px;
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
        padding: 6mm 6mm !important;
        page-break-after: always;
        break-after: page;
      }
      @page {
        size: A4 landscape;
        margin: 6mm;
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

  <!-- Screen Action Bar -->
  <div class="screen-actions">
    <div>
      <strong>PES UNIVERSITY &bull; DEPT. OF CSE &bull; DBMS LEVEL 3 EVALUATION</strong>
      <span style="color: #6b7280; font-size: 11px; margin-left: 10px;">Component 01: Peter Chen Textbook ER Model</span>
    </div>
    <div>
      <button class="btn-action" onclick="window.print()">Print Document / Save as PDF</button>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 1: CHEN NOTATION ER DIAGRAM (A4 LANDSCAPE) -->
  <!-- ========================================================================= -->
  <div class="sheet">
    <div class="univ-header">
      <h1>PES UNIVERSITY</h1>
      <h2>DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING &bull; DATABASE MANAGEMENT SYSTEMS (UE22CS252AA)</h2>
      <div class="meta-row">
        <span>PROJECT: FLASHDROP HIGH-CONCURRENCY COMMERCE ENGINE</span>
        <span>COMPONENT 01: CONCEPTUAL ER MODEL (PETER CHEN NOTATION)</span>
        <span>AUTHORS: VIBHAV M &amp; VAINIK</span>
      </div>
    </div>

    <!-- INLINE VECTOR SVG DIAGRAM (100% Reliable Loading - No External Images) -->
    <div class="diagram-frame">
      ${svg}
    </div>

    <div class="page-footer">
      <span>Notations: Rectangles (Entities), Diamonds (Relationships), Ovals (Attributes), Underline (Primary Key)</span>
      <span>Page 1 of 3: Conceptual ER Architecture (Chen Model)</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 2: CHEN SYMBOL TAXONOMY & ATTRIBUTE BREAKDOWN (A4 PORTRAIT) -->
  <!-- ========================================================================= -->
  <div class="sheet sheet-portrait">
    <div class="univ-header">
      <h1>PES UNIVERSITY</h1>
      <h2>DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING &bull; DBMS LEVEL 3 EVALUATION</h2>
      <div class="meta-row">
        <span>COURSE: UE22CS252AA</span>
        <span>COMPONENT 01: CHEN NOTATION TAXONOMY &amp; ATTRIBUTE CLASSIFICATION</span>
        <span>PETER CHEN FORMALISM</span>
      </div>
    </div>

    <h3>1. Peter Chen Notation Construct Mapping (Elmasri-Navathe Standard)</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Chen Symbol</th>
          <th style="width: 28%;">Geometric Shape</th>
          <th style="width: 25%;">FlashDrop Entity / Relationship</th>
          <th>Semantic Rationale</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Strong Entity</strong></td>
          <td>Single Rectangle</td>
          <td><code>USER</code>, <code>PRODUCT</code>, <code>DROP</code>, <code>ORDER</code></td>
          <td>Has independent existence with designated primary key.</td>
        </tr>
        <tr>
          <td><strong>Weak Entity</strong></td>
          <td>Double Rectangle</td>
          <td><code>ORDER_ITEM</code>, <code>WALLET_LEDGER</code></td>
          <td>Existence-dependent on parent entity; partial key only.</td>
        </tr>
        <tr>
          <td><strong>Relationship</strong></td>
          <td>Single Diamond</td>
          <td><code>PLACES</code>, <code>OWNS</code>, <code>FEATURED</code>, <code>CONTAINS</code></td>
          <td>Associates two or more distinct entities.</td>
        </tr>
        <tr>
          <td><strong>Identifying Rel.</strong></td>
          <td>Double Diamond</td>
          <td><code>CONTAINS</code> (Order Items), <code>AUDITED</code> (Ledger)</td>
          <td>Connects weak entity to owner entity with existence dependency.</td>
        </tr>
        <tr>
          <td><strong>Key Attribute</strong></td>
          <td>Oval with Underlined Text</td>
          <td><u>user_id</u>, <u>order_id</u>, <u>product_id</u></td>
          <td>Uniquely identifies an entity instance.</td>
        </tr>
        <tr>
          <td><strong>Partial Key (Discriminator)</strong></td>
          <td>Oval with Dashed Underline</td>
          <td>item_id (in ORDER_ITEM), ledger_id (in LEDGER)</td>
          <td>Distinguishes weak entity instances within same owner instance.</td>
        </tr>
        <tr>
          <td><strong>Composite Attribute</strong></td>
          <td>Branching Ovals</td>
          <td><code>Name</code> &rarr; <code>first_name</code>, <code>last_name</code></td>
          <td>Composed of smaller atomic sub-attributes.</td>
        </tr>
        <tr>
          <td><strong>Multivalued Attribute</strong></td>
          <td>Double Oval</td>
          <td><code>attributes</code> (in PRODUCT: size, color, year)</td>
          <td>Can hold a set of values for a single entity instance.</td>
        </tr>
        <tr>
          <td><strong>Derived Attribute</strong></td>
          <td>Dashed Oval</td>
          <td><code>available_qty</code> (in INVENTORY), <code>balance</code> (in WALLET)</td>
          <td>Computed dynamically: available = total - reserved - sold.</td>
        </tr>
        <tr>
          <td><strong>Total Participation</strong></td>
          <td>Double Line</td>
          <td><code>USER &rarr; WALLET</code>, <code>ORDER &rarr; ORDER_ITEM</code></td>
          <td>Mandatory participation: every entity instance must participate.</td>
        </tr>
        <tr>
          <td><strong>Partial Participation</strong></td>
          <td>Single Line</td>
          <td><code>USER &rarr; ORDERS</code>, <code>PRODUCT &rarr; DROPS</code></td>
          <td>Optional participation: user can exist without having placed an order.</td>
        </tr>
      </tbody>
    </table>

    <h3>2. FlashDrop Entity Structural Taxonomy</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Entity Name</th>
          <th style="width: 20%;">Chen Classification</th>
          <th style="width: 25%;">Key / Partial Key</th>
          <th>Core Attributes Attached in Chen Model</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><strong>USER</strong></td><td>Strong Entity</td><td><u>user_id</u> (PK)</td><td>email, Name (first_name, last_name), phone, status</td></tr>
        <tr><td><strong>ROLE</strong></td><td>Strong Entity</td><td><u>role_id</u> (PK)</td><td>name, description</td></tr>
        <tr><td><strong>ADDRESS</strong></td><td>Subordinate Entity</td><td><u>address_id</u> (PK)</td><td>Address_Info (city, state, postal), street, is_default</td></tr>
        <tr><td><strong>CATEGORY</strong></td><td>Self-Referencing Strong</td><td><u>category_id</u> (PK)</td><td>name, slug, description</td></tr>
        <tr><td><strong>PRODUCT</strong></td><td>Strong Entity</td><td><u>product_id</u> (PK)</td><td>sku, title, base_price, {attributes} (Multivalued)</td></tr>
        <tr><td><strong>DROP</strong></td><td>Strong Entity</td><td><u>drop_id</u> (PK)</td><td>title, slug, drop_price, start_time, end_time, status</td></tr>
        <tr><td><strong>INVENTORY</strong></td><td>1:1 Allocated Entity</td><td><u>inventory_id</u> (PK)</td><td>total_allocated, sold_quantity, available_qty (Derived)</td></tr>
        <tr><td><strong>ORDER</strong></td><td>Strong Entity</td><td><u>order_id</u> (PK)</td><td>order_number, total_amount, final_amount, status</td></tr>
        <tr><td><strong>ORDER_ITEM</strong></td><td>Weak Entity</td><td>item_id (Partial Key)</td><td>quantity, unit_price, subtotal</td></tr>
        <tr><td><strong>WALLET</strong></td><td>1:1 Strong Entity</td><td><u>wallet_id</u> (PK)</td><td>currency, is_locked, balance (Derived)</td></tr>
        <tr><td><strong>WALLET_LEDGER</strong></td><td>Weak Entity</td><td>ledger_id (Partial Key)</td><td>entry_type, amount, balance_after, created_at</td></tr>
        <tr><td><strong>PAYMENT</strong></td><td>1:1 Receipt Entity</td><td><u>payment_id</u> (PK)</td><td>method, txn_ref, amount, status</td></tr>
        <tr><td><strong>LOYALTY_TIER</strong></td><td>Strong Entity</td><td><u>tier_id</u> (PK)</td><td>tier_name, min_spend, discount_pct</td></tr>
        <tr><td><strong>FRAUD_FLAG</strong></td><td>Security Entity</td><td><u>flag_id</u> (PK)</td><td>risk_score, flag_reason, flagged_at</td></tr>
      </tbody>
    </table>

    <div class="page-footer">
      <span>PES University &bull; DBMS Level 3 Evaluation &bull; Project FlashDrop</span>
      <span>Page 2 of 3: Chen Notation Taxonomy &amp; Attributes</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 3: RELATIONSHIPS & VIVA DEFENSE (A4 PORTRAIT) -->
  <!-- ========================================================================= -->
  <div class="sheet sheet-portrait">
    <div class="univ-header">
      <h1>PES UNIVERSITY</h1>
      <h2>DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING &bull; DBMS LEVEL 3 EVALUATION</h2>
      <div class="meta-row">
        <span>COURSE: UE22CS252AA</span>
        <span>COMPONENT 01: CHEN MODEL VIVA DEFENSE</span>
        <span>EXAMINER GRILLING PREPARATION</span>
      </div>
    </div>

    <h3>1. Cardinality Ratios, Participation &amp; Roles</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Relationship (Diamond)</th>
          <th style="width: 25%;">Entities Connected</th>
          <th style="width: 15%;">Cardinality</th>
          <th>Participation Constraints &amp; Semantic Role Names</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>ASSIGNED</strong></td>
          <td>USER &harr; ROLE</td>
          <td>N : 1</td>
          <td>Total on USER (every user must have a role). Role has partial.</td>
        </tr>
        <tr>
          <td><strong>OWNS</strong></td>
          <td>USER &harr; WALLET</td>
          <td>1 : 1</td>
          <td>Total on USER (1:1 mandatory prepaid ledger container).</td>
        </tr>
        <tr>
          <td><strong>AUDITED (Identifying)</strong></td>
          <td>WALLET &harr; WALLET_LEDGER</td>
          <td>1 : N</td>
          <td>Total on WALLET_LEDGER (Double line; weak entity lifecycle bound).</td>
        </tr>
        <tr>
          <td><strong>CONTAINS (Category)</strong></td>
          <td>CATEGORY &harr; PRODUCT</td>
          <td>1 : N</td>
          <td>Category categorizes multiple catalog items.</td>
        </tr>
        <tr>
          <td><strong>PARENT (Recursive)</strong></td>
          <td>CATEGORY &harr; CATEGORY</td>
          <td>1 : N</td>
          <td>Role: <em>Parent (1)</em> to <em>Subcategory (N)</em> via nullable parent_id.</td>
        </tr>
        <tr>
          <td><strong>FEATURED</strong></td>
          <td>PRODUCT &harr; DROP</td>
          <td>1 : N</td>
          <td>Product featured in scheduled drop event.</td>
        </tr>
        <tr>
          <td><strong>ALLOCATES</strong></td>
          <td>DROP &harr; INVENTORY</td>
          <td>1 : 1</td>
          <td>Total on INVENTORY (dedicated inventory allocation).</td>
        </tr>
        <tr>
          <td><strong>PLACES</strong></td>
          <td>USER &harr; ORDER</td>
          <td>1 : N</td>
          <td>Partial on USER (user may not have purchased yet). Relationship attr: created_at.</td>
        </tr>
        <tr>
          <td><strong>CONTAINS (Identifying)</strong></td>
          <td>ORDER &harr; ORDER_ITEM</td>
          <td>1 : N</td>
          <td>Total on ORDER_ITEM (Double diamond &amp; double line; CASCADE).</td>
        </tr>
        <tr>
          <td><strong>SETTLED</strong></td>
          <td>ORDER &harr; PAYMENT</td>
          <td>1 : 1</td>
          <td>Settlement transaction receipt per committed drop order.</td>
        </tr>
        <tr>
          <td><strong>LOTTERY</strong></td>
          <td>USER &harr; DROP</td>
          <td>M : N</td>
          <td>Fair waitlist lottery pool. Relationship attr: ticket_no.</td>
        </tr>
        <tr>
          <td><strong>ACHIEVES</strong></td>
          <td>USER &harr; LOYALTY_TIER</td>
          <td>M : N</td>
          <td>User tier progression over lifetime drop spending.</td>
        </tr>
        <tr>
          <td><strong>REFERS (Recursive)</strong></td>
          <td>USER &harr; USER</td>
          <td>1 : N</td>
          <td>Role: <em>Referrer (1)</em> to <em>Referee (N)</em> viral referral network DAG.</td>
        </tr>
      </tbody>
    </table>

    <h3>2. Examiner Viva Defense Q&amp;A on Chen Notation</h3>
    <div style="font-size: 9.5pt; line-height: 1.5; border: 1px solid #6b7280; padding: 10px; margin-top: 8px;">
      <p style="margin-bottom: 8px;">
        <strong>Question 1: Explain how you differentiated between strong and weak entities in Chen notation.</strong><br>
        <em>Answer:</em> Strong entities (e.g., <code>USER</code>, <code>PRODUCT</code>, <code>DROP</code>) are drawn with single rectangles and possess full primary keys that uniquely identify each instance. Weak entities (<code>ORDER_ITEM</code>, <code>WALLET_LEDGER</code>) are drawn with double rectangles; they lack a primary key on their own and only possess a partial key (discriminator, drawn with dashed underline). They connect to their identifying owner entities via double diamonds with double lines representing total existence dependency.
      </p>

      <p style="margin-bottom: 8px;">
        <strong>Question 2: Where did you use composite, multivalued, and derived attributes?</strong><br>
        <em>Answer:</em> In our Chen model:
        1. <strong>Composite Attribute:</strong> <code>Name</code> branches into sub-ovals <code>first_name</code> and <code>last_name</code>; <code>Address_Info</code> branches into <code>city</code>, <code>state</code>, and <code>postal</code>.
        2. <strong>Multivalued Attribute:</strong> <code>attributes</code> in <code>PRODUCT</code> is drawn with a double oval because a product contains multiple specifications (size, color, edition).
        3. <strong>Derived Attribute:</strong> <code>available_qty</code> in <code>INVENTORY</code> is drawn with a dashed oval because it is dynamically computed using the equation: <code>total_allocated - sold_quantity - reserved_holds</code>.
      </p>

      <p>
        <strong>Question 3: How does Crow's-foot notation differ from Peter Chen notation?</strong><br>
        <em>Answer:</em> Peter Chen notation (the academic textbook standard) explicitly separates entities (rectangles), relationships (diamonds), and attributes (ovals), displaying cardinality ratios (1, N, M) and participation (single vs double lines). Crow's-foot notation is a physical database modeling convention where attributes are placed directly inside rectangular table boxes and relationship cardinalities are shown via line-ending symbols (e.g. <code>||</code> for one, <code>|&lt;</code> for many).
      </p>
    </div>

    <div class="page-footer">
      <span>PES University &bull; Dept. of CSE &bull; Course Code: UE22CS252AA</span>
      <span>Page 3 of 3: Chen Notation Defense &amp; Cardinality Proofs</span>
    </div>
  </div>

</body>
</html>
`;

  fs.writeFileSync(path.join(__dirname, '../docs/chen_er_diagram_printable.html'), html, 'utf8');
  console.log('Saved docs/chen_er_diagram_printable.html successfully!');
}

generateChenDiagram();
