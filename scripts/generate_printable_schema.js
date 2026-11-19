const fs = require('fs');
const path = require('path');

function generateWhiteSvg() {
  const darkSvgPath = path.join(__dirname, '../docs/er_diagram.svg');
  let svg = fs.readFileSync(darkSvgPath, 'utf8');

  // Replace background and main canvas style
  svg = svg.replace('background:#09090b;', 'background:#ffffff;');
  svg = svg.replace('stop-color="#09090b"', 'stop-color="#ffffff"');
  svg = svg.replace('stop-color="#111116"', 'stop-color="#f8fafc"');
  svg = svg.replace('flood-color="#000000" flood-opacity="0.6"', 'flood-color="#64748b" flood-opacity="0.15"');

  // Update title & subtitle
  svg = svg.replace("PROJECT FLASHDROP ⚡ ENTERPRISE CROW'S FOOT ER DIAGRAM", "PROJECT FLASHDROP ⚡ RELATIONAL SCHEMA DIAGRAM (A4 PRINTABLE)");
  svg = svg.replace("20 Normalized Relational Entities in BCNF (MySQL 8.0 Core) • Cardinalities: || (One) to &lt; (Many)", "20 Relational Tables in BCNF (MySQL 8.0 InnoDB) • Primary Keys (PK) &amp; Referential Foreign Keys (FK &rarr; PK)");

  // Title text color
  svg = svg.replace('fill="#ffffff" font-size="22"', 'fill="#0f172a" font-size="22"');
  svg = svg.replace('fill="#a1a1aa" font-size="11"', 'fill="#475569" font-size="11"');

  // Legend badges
  svg = svg.replace('fill="#1e293b" stroke="#3b82f6"', 'fill="#eff6ff" stroke="#2563eb"');
  svg = svg.replace('fill="#60a5fa" font-size="10"', 'fill="#1e40af" font-size="10"');

  svg = svg.replace('fill="#2a1215" stroke="#f43f5e"', 'fill="#fff1f2" stroke="#e11d48"');
  svg = svg.replace('fill="#fb7185" font-size="10"', 'fill="#9f1239" font-size="10"');

  svg = svg.replace('fill="#062d1f" stroke="#10b981"', 'fill="#f0fdf4" stroke="#059669"');
  svg = svg.replace('fill="#34d399" font-size="10"', 'fill="#065f46" font-size="10"');

  svg = svg.replace('fill="#241235" stroke="#a855f7"', 'fill="#faf5ff" stroke="#7c3aed"');
  svg = svg.replace('fill="#c084fc" font-size="10"', 'fill="#5b21b6" font-size="10"');

  // Card backgrounds (was #18181b -> now #ffffff)
  svg = svg.split('fill="#18181b"').join('fill="#ffffff"');

  // Header banner fills
  svg = svg.split('fill="#1e293b"').join('fill="#eff6ff"');
  svg = svg.split('fill="#2a1215"').join('fill="#fff1f2"');
  svg = svg.split('fill="#062d1f"').join('fill="#f0fdf4"');
  svg = svg.split('fill="#241235"').join('fill="#faf5ff"');

  // Table header text colors
  svg = svg.split('fill="#93c5fd"').join('fill="#1e3a8a"');
  svg = svg.split('fill="#fda4af"').join('fill="#881337"');
  svg = svg.split('fill="#a7f3d0"').join('fill="#064e3b"');
  svg = svg.split('fill="#e9d5ff"').join('fill="#4c1d95"');

  // Attribute text colors (darker for high print contrast)
  svg = svg.split('fill="#d4d4d8"').join('fill="#1e293b"');
  svg = svg.split('fill="#71717a"').join('fill="#475569"');
  svg = svg.split('fill="#38bdf8"').join('fill="#0369a1"'); // FK text: deep ocean blue
  svg = svg.split('fill="#f59e0b"').join('fill="#b45309"'); // PK text: deep amber brown
  svg = svg.split('fill="#fb7185"').join('fill="#be123c"'); // Alert text: deep crimson
  svg = svg.split('fill="#34d399"').join('fill="#047857"'); // Green text: deep emerald
  svg = svg.split('fill="#c084fc"').join('fill="#6d28d9"'); // Purple text: deep violet

  // Connector line stroke adjustments for paper print
  svg = svg.split('stroke="#60a5fa"').join('stroke="#1d4ed8"');
  svg = svg.split('stroke="#fb7185"').join('stroke="#be123c"');
  svg = svg.split('stroke="#34d399"').join('stroke="#047857"');
  svg = svg.split('stroke="#c084fc"').join('stroke="#6d28d9"');
  svg = svg.split('stroke="#71717a"').join('stroke="#334155"');

  // Footer bar styling
  svg = svg.replace('fill="#18181b" stroke="#27272a"', 'fill="#f8fafc" stroke="#cbd5e1"');

  const outPath = path.join(__dirname, '../docs/relational_schema_white.svg');
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log('✅ Generated docs/relational_schema_white.svg successfully!');
}

generateWhiteSvg();
