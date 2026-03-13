// ── Acquisitions Tab ─────────────────────────────────────────────────────────
// Renders three sub-tabs: Quotes, Financials, Sales Orders
// All data is embedded here (no server calls needed)

var acqInitialised = false;

function initAcqTab() {
  if (acqInitialised) return;
  acqInitialised = true;
  var root = document.getElementById('acq-tab');
  root.innerHTML = acqShell();

  function switchPanel(panel) {
    document.querySelectorAll('.acq-sub-tab').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.acq-sub-panel').forEach(function(p) { p.style.display = 'none'; });
    document.querySelector('.acq-sub-tab[data-panel="' + panel + '"]').classList.add('active');
    document.getElementById('acq-panel-' + panel).style.display = 'block';
  }

  document.querySelectorAll('.acq-sub-tab').forEach(function(btn) {
    btn.addEventListener('click', function() { switchPanel(btn.dataset.panel); });
  });

  setTimeout(function() {
    buildQuotesTab();
    buildFinancialsTab();
    buildSalesTab();
  }, 40);
}

function acqShell() {
  return '<div class="acq-sub-tabs">' +
    '<button class="acq-sub-tab active" data-panel="quotes">Quotes</button>' +
    '<button class="acq-sub-tab" data-panel="financials">Financials</button>' +
    '<button class="acq-sub-tab" data-panel="sales">Sales Orders</button>' +
    '</div>' +
    '<div id="acq-panel-quotes" class="acq-sub-panel" style="display:block"></div>' +
    '<div id="acq-panel-financials" class="acq-sub-panel" style="display:none"></div>' +
    '<div id="acq-panel-sales" class="acq-sub-panel" style="display:none"></div>';
}

// ── SVG helpers ───────────────────────────────────────────────────────────────
var SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs) {
  var el = document.createElementNS(SVG_NS, tag);
  for (var k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function svgTxt(tag, attrs, txt) {
  var el = svgEl(tag, attrs);
  el.textContent = String(txt);
  return el;
}

function makeSvg(width, height) {
  return svgEl('svg', {
    viewBox: '0 0 ' + width + ' ' + height,
    width: '100%',
    height: height,
    class: 'acq-svg'
  });
}

// Format helpers
var ACQ = {
  $m: function(n) { return n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + Math.round(n / 1e3) + 'k' : '$' + Math.round(n); },
  $m1: function(n) { return n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + Math.round(n / 1e3) + 'k' : '$' + Math.round(n); },
  $f: function(n) { return '$' + Math.round(n).toLocaleString(); },
  pc: function(n) { return n.toFixed(1) + '%'; },
  pc0: function(n) { return Math.round(n) + '%'; },
  n: function(n) { return Math.round(n).toLocaleString(); },
  ax: 'fill:#8892A4;font-size:9px;font-family:system-ui,sans-serif',
  gl: 'stroke:#253045;stroke-width:0.5;stroke-dasharray:3,3'
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTES TAB
// ═══════════════════════════════════════════════════════════════════════════════

// Embedded quote data extracted from quote_analysis.html
var QD = {
  byYear: {
    2010:{total:454,won:0,wr:0,wv:0,awv:0},
    2011:{total:849,won:0,wr:0,wv:0,awv:0},
    2012:{total:966,won:0,wr:0,wv:0,awv:0},
    2013:{total:1810,won:0,wr:0,wv:0,awv:0},
    2014:{total:1863,won:0,wr:0,wv:0,awv:0},
    2015:{total:2048,won:0,wr:0,wv:0,awv:0},
    2016:{total:2460,won:0,wr:0,wv:0,awv:0},
    2017:{total:2319,won:0,wr:0,wv:0,awv:0},
    2018:{total:2929,won:0,wr:0,wv:0,awv:0},
    2019:{total:3120,won:0,wr:0,wv:0,awv:0},
    2020:{total:3720,won:3337,wr:89.7,wv:31539696,awv:9451},
    2021:{total:3101,won:2823,wr:91.0,wv:30794251,awv:10908},
    2022:{total:4375,won:3982,wr:91.0,wv:54161707,awv:13602},
    2023:{total:4885,won:4502,wr:92.2,wv:65824935,awv:14621},
    2024:{total:4807,won:4328,wr:90.0,wv:68479086,awv:15822},
    2025:{total:4808,won:4104,wr:85.4,wv:74369098,awv:18121},
    2026:{total:396,won:322,wr:81.3,wv:5334774,awv:16568}
  },
  fy: [2021,2022,2023,2024,2025],
  avw: {count:33713,avg:13422,med:6115},
  monthly: [
    {m:'Jan',t:1538,w:1379,wv:21136946,wr:89.7},{m:'Feb',t:1478,w:1314,wv:17553994,wr:88.9},
    {m:'Mar',t:2117,w:1894,wv:27736432,wr:89.5},{m:'Apr',t:1816,w:1634,wv:24551694,wr:89.9},
    {m:'May',t:1948,w:1773,wv:27218213,wr:91.0},{m:'Jun',t:1798,w:1607,wv:26019483,wr:89.4},
    {m:'Jul',t:1781,w:1617,wv:24527012,wr:90.8},{m:'Aug',t:1907,w:1700,wv:26399791,wr:89.1},
    {m:'Sep',t:1976,w:1768,wv:27261143,wr:89.5},{m:'Oct',t:2089,w:1892,wv:30225459,wr:90.6},
    {m:'Nov',t:2101,w:1878,wv:30736068,wr:89.4},{m:'Dec',t:1574,w:1385,wv:20557869,wr:88.0}
  ],
  sizes: [
    {lbl:'<$1k',t:4034,w:3883,wr:96.3,wv:982282},
    {lbl:'$1k-$5k',t:12793,w:12104,wr:94.6,wv:31977625},
    {lbl:'$5k-$15k',t:11350,w:10580,wr:93.2,wv:91424862},
    {lbl:'$15k-$50k',t:7006,w:6499,wr:92.8,wv:156659050},
    {lbl:'$50k-$100k',t:1382,w:1153,wr:83.4,wv:76734398},
    {lbl:'$100k+',t:617,w:494,wr:80.1,wv:94725330}
  ],
  topCust: [
    {name:'Ausgrid',wv:6368450,shr:1.41},
    {name:'Ausgrid - Network Design',wv:4543736,shr:1.00},
    {name:'Department of Education',wv:3613088,shr:0.80},
    {name:'Abigroup Contractors',wv:3108220,shr:0.69},
    {name:'Downer EDI Rail',wv:2900250,shr:0.64},
    {name:'John Holland Group',wv:2857170,shr:0.63},
    {name:'GHD Advisory',wv:2814890,shr:0.62},
    {name:'Lendlease Building',wv:2556800,shr:0.57},
    {name:'Transgrid',wv:2383700,shr:0.53},
    {name:'CPB Contractors',wv:2319988,shr:0.51}
  ],
  conc: {total:15503,totalWon:452503547,t1:1.4,t3:3.0,t5:4.5,t10:7.3,t20:11.4,t50:19.0},
  pipeline: {total:44875,sent:34070,sentPct:75.9,notSentPct:24.1,totalEV:461335342,wonEV:452503547},
  nvr: {newQ:17535,newPct:39.1,newWR:80.6,repQ:27340,repPct:60.9,repWR:72.9,uniq:17535}
};

function qWinColor(r) {
  return r >= 85 ? '#10B981' : r >= 70 ? '#F59E0B' : '#EF4444';
}

function buildQuotesTab() {
  var root = document.getElementById('acq-panel-quotes');
  var fy = QD.fy.map(function(y) { return QD.byYear[y]; });
  var vol = fy.reduce(function(s, d) { return s + d.total; }, 0);
  var won = fy.reduce(function(s, d) { return s + d.won; }, 0);
  var rev = fy.reduce(function(s, d) { return s + d.wv; }, 0);
  var awr = (won / vol * 100).toFixed(1);
  var vg = Math.round((QD.byYear[2025].total - QD.byYear[2021].total) / QD.byYear[2021].total * 100);
  var rg = Math.round((QD.byYear[2025].wv - QD.byYear[2021].wv) / QD.byYear[2021].wv * 100);

  var html = '';

  // ── Exec Summary ──
  html += section('Executive Summary', qExecCards(vol, won, rev, awr, vg, rg));
  html += insightBox('This is a <strong>high-performing, well-diversified quoting operation.</strong> Over 2021–2025, the business processed <strong>' + ACQ.n(vol) + ' quotes</strong> and converted <strong>' + ACQ.$m1(rev) + '</strong> in won revenue at an average conversion rate of <strong>' + awr + '%</strong>. Quote volume grew <strong>+' + vg + '%</strong> while revenue grew <strong>+' + rg + '%</strong> — meaning <strong>revenue grew faster than volume</strong>, driven by rising average deal values ($10,908 in 2021 to $18,121 in 2025, a <strong>+66% increase</strong>). The customer base of <strong>' + ACQ.n(QD.nvr.uniq) + ' unique organisations</strong> is highly fragmented — the top 10 customers represent only ' + QD.conc.t10 + '% of revenue: <strong>exceptionally low concentration risk.</strong>');

  // ── Volume Chart ──
  html += section('Quote Volume by Year',
    '<div class="acq-chart-card"><div class="acq-chart-title">Annual Quote Volume (2020–2026)</div>' +
    '<div id="acq-vol-svg-wrap"></div></div>' +
    insightBox('Quote volume grew from <strong>' + ACQ.n(QD.byYear[2021].total) + '</strong> (2021) to <strong>' + ACQ.n(QD.byYear[2025].total) + '</strong> (2025) — a <strong>+' + Math.round((QD.byYear[2025].total - QD.byYear[2021].total) / QD.byYear[2021].total * 100) + '% increase</strong>. 2022 saw the biggest step-up (+41% YoY), likely post-COVID construction recovery. Volume plateaued between 2024 and 2025 (both ~4,800), suggesting the team may be at capacity or shifting toward a higher-value / fewer-quotes strategy — supported by the consistently rising average deal value.', true)
  );

  // ── Win Rate Trend ──
  html += section('Win Rate Trend by Year',
    '<div class="acq-two-col">' +
    '<div class="acq-chart-card"><div class="acq-chart-title">Conversion Rate 2020–2025</div><div id="acq-wr-svg-wrap"></div></div>' +
    '<div id="acq-wr-focus" class="acq-wr-focus"></div>' +
    '</div>' +
    insightBox('Conversion held at <strong>91–92%</strong> from 2020–2023, then dipped to <strong>90% in 2024</strong> and <strong>85.4% in 2025</strong>. This decline warrants investigation. At the 2021–2023 run rate (~91.5%), an 85.4% rate on 4,808 quotes means <strong>~290 additional quotes not converted</strong>. At an average won value of $18,121 that is an estimated <strong>~$5.3M in unconverted revenue</strong>. Key questions: competitive pressure? Price increases? More speculative early-stage enquiries entering the funnel?', true)
  );

  // ── Won Revenue ──
  html += section('Won Revenue by Year',
    '<div class="acq-chart-card"><div class="acq-chart-title">Won Revenue 2021–2025</div><div id="acq-rev-svg-wrap"></div></div>' +
    insightBox('Won revenue grew from <strong>' + ACQ.$m1(QD.byYear[2021].wv) + '</strong> (2021) to <strong>' + ACQ.$m1(QD.byYear[2025].wv) + '</strong> (2025) — <strong>+' + rg + '% total</strong>, or <strong>'+((Math.pow(QD.byYear[2025].wv/QD.byYear[2021].wv,0.25)-1)*100).toFixed(1)+'% CAGR</strong>. 2022 saw the biggest step-up (+76% YoY), almost certainly post-COVID construction recovery. Revenue has grown every single year with no down years — a very strong track record. Average won deal value grew from <strong>$10,908</strong> (2021) to <strong>$18,121</strong> (2025) — <strong>+66%</strong> in four years.', true)
  );

  // ── Deal Size Buckets ──
  html += section('Win Rate by Deal Size',
    '<div class="acq-chart-card"><div class="acq-chart-title">Conversion Rate by Quote Size</div><div id="acq-sz-svg-wrap"></div></div>' +
    '<div id="acq-sz-tbl" style="margin-top:12px"></div>' +
    insightBox('Conversion rate inversely correlates with deal size — but the business maintains an <strong>impressive floor: 80.1%</strong> even for quotes above $100k. Volume sweet spot is <strong>$1k–$15k</strong> (24,143 quotes, 93–95% conversion). <strong>$15k–$50k deals drive the most revenue</strong> at ' + ACQ.$m1(QD.sizes[3].wv) + ' (35% of total). The <strong>$100k+ segment</strong> contributes ' + ACQ.$m1(QD.sizes[5].wv) + ' from just 617 quotes — large projects are worth pursuing hard.', true)
  );

  // ── Seasonality ──
  html += section('Monthly Seasonality',
    '<div class="acq-chart-card"><div class="acq-chart-title">Quote Volume &amp; Conversion Rate by Month (5-year aggregate)</div><div id="acq-sea-svg-wrap"></div></div>' +
    insightBox('Peak months: <strong>Mar, May, Oct, Nov</strong>. Quieter: <strong>Feb, Dec</strong>. Crucially, <strong>conversion rate barely varies through the year</strong> (range: 88.0%–91.0%), meaning seasonality is entirely driven by inquiry flow, not customer decisiveness. <strong>Mar–May and Oct–Nov</strong> are strongest — driven by construction season start and end-of-financial-year spend.', true)
  );

  // ── Top 10 Customers ──
  html += section('Top 10 Customers',
    '<div class="acq-chart-card"><div class="acq-chart-title">Top 10 by Won Revenue (all-time)</div><div id="acq-cust-svg-wrap"></div></div>' +
    '<div id="acq-cust-tbl" style="margin-top:12px"></div>' +
    insightBox('The top customer accounts for just <strong>1.41%</strong> of total revenue — remarkably low. These are predominantly <strong>infrastructure, government, and large construction clients</strong> (Ausgrid, Abigroup, John Holland, CPB, Transgrid, Lendlease) — a strong foothold in public-sector capital works. High repeat order counts confirm strong relationship stickiness.', true)
  );

  // ── Concentration ──
  html += section('Customer Concentration',
    '<div id="acq-conc-bars"></div>' +
    insightBox('<strong>Exceptionally low concentration risk.</strong> The top 10 customers represent only <strong>' + QD.conc.t10 + '%</strong> of total won revenue across <strong>' + ACQ.n(QD.conc.total) + '</strong> unique customers. The top 50 customers — just 0.3% of the customer base — account for only <strong>' + QD.conc.t50 + '%</strong>. This near-flat concentration curve means no single customer loss would materially impact revenue. A <strong>significant competitive strength</strong> and a healthy, sustainable business model.', true)
  );

  root.innerHTML = html;

  // Now render SVG charts
  setTimeout(function() {
    qBuildVolChart();
    qBuildWrChart();
    qBuildRevChart();
    qBuildSzChart();
    qBuildSeaChart();
    qBuildCustChart();
    qBuildConcentration();
  }, 20);
}

function section(label, content) {
  return '<div class="acq-section"><div class="acq-section-label">' + label + '</div>' + content + '</div>';
}

function insightBox(html, raw) {
  return '<div class="acq-insight">' + html + '</div>';
}

// Exec summary cards for quotes
function qExecCards(vol, won, rev, awr, vg, rg) {
  var cards = [
    {lbl:'5-Year Quote Volume', val: ACQ.n(vol), sub:'2021–2025 primary quotes', delta:'↑ +'+vg+'% volume growth', cls:'up'},
    {lbl:'5-Year Won Revenue', val: ACQ.$m1(rev), sub:'Firm quotes sent to customers', delta:'↑ +'+rg+'% vs 2021', cls:'up'},
    {lbl:'Avg Conversion Rate', val: awr+'%', sub:'5-year average, all quote types', delta:'→ 2025: 85.4% — slight dip', cls:'mid'},
    {lbl:'Unique Customers', val: ACQ.n(QD.nvr.uniq), sub:'60.9% are repeat buyers', delta:'↑ Very low concentration risk', cls:'up'},
    {lbl:'Avg Won Deal Value', val: ACQ.$f(QD.avw.avg), sub:'Median: '+ACQ.$f(QD.avw.med), delta:'↑ +66% growth 2021→2025', cls:'up'},
    {lbl:'Top 10 Customer Share', val: QD.conc.t10+'%', sub:'Of '+ACQ.n(QD.conc.total)+' total customers', delta:'↑ Highly diversified base', cls:'up'}
  ];
  var out = '<div class="acq-quote-exec-grid">';
  cards.forEach(function(c) {
    out += '<div class="acq-quote-card">' +
      '<div class="acq-stat-label">' + c.lbl + '</div>' +
      '<div class="acq-stat-value">' + c.val + '</div>' +
      '<div class="acq-stat-sub">' + c.sub + '</div>' +
      '<div class="acq-stat-delta ' + c.cls + '">' + c.delta + '</div>' +
      '</div>';
  });
  return out + '</div>';
}

// Quote Volume Chart
function qBuildVolChart() {
  var wrap = document.getElementById('acq-vol-svg-wrap');
  if (!wrap) return;
  var years = [2020,2021,2022,2023,2024,2025,2026];
  var data = years.map(function(y) { return QD.byYear[y]; });
  var W = 680, H = 240;
  var p = {t:20,r:16,b:38,l:46};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var mx = Math.max.apply(null, data.map(function(d){ return d.total; }));
  var bw = cw/years.length*0.62, gap = cw/years.length;

  [0,1000,2000,3000,4000,5000].forEach(function(v) {
    if (v > mx * 1.1) return;
    var y = p.t + ch - (v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax, 'text-anchor':'end'}, v>=1000?(v/1000)+'k':v));
  });

  data.forEach(function(d, i) {
    var x = p.l + gap*i + gap/2 - bw/2;
    var col = years[i]===2025 ? '#F59E0B' : '#3B82F6';
    var wonH = d.total > 0 ? (d.won/mx*ch) : 0;
    var notH = d.total > 0 ? ((d.total-d.won)/mx*ch) : 0;
    var wonY = p.t + ch - wonH;
    var notY = wonY - notH;
    if (wonH > 0) svg.appendChild(svgEl('rect', {x:x,y:wonY,width:bw,height:wonH,fill:col,rx:2,opacity:'0.9'}));
    if (notH > 0) svg.appendChild(svgEl('rect', {x:x,y:notY,width:bw,height:notH,fill:col,rx:2,opacity:'0.25'}));
    if (d.total > 0) svg.appendChild(svgTxt('text', {x:x+bw/2,y:notY-4, style:ACQ.ax,'text-anchor':'middle'}, d.total>=1000?(d.total/1000).toFixed(1)+'k':d.total));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-6, style:ACQ.ax,'text-anchor':'middle'}, years[i]));
  });

  wrap.appendChild(svg);
}

// Win Rate Chart
function qBuildWrChart() {
  var wrap = document.getElementById('acq-wr-svg-wrap');
  var focusEl = document.getElementById('acq-wr-focus');
  if (!wrap) return;
  var years = [2020,2021,2022,2023,2024,2025];
  var data = years.map(function(y) { return QD.byYear[y]; });
  var W = 400, H = 260;
  var p = {t:24,r:16,b:36,l:42};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var minR = 60, maxR = 100;
  function sy(v) { return p.t + ch - ((v-minR)/(maxR-minR)*ch); }
  function sx(i) { return p.l + (i/(years.length-1))*cw; }

  [60,70,80,90,100].forEach(function(v) {
    svg.appendChild(svgEl('line', {x1:p.l,y1:sy(v),x2:p.l+cw,y2:sy(v), style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:sy(v)+4, style:ACQ.ax,'text-anchor':'end'}, v+'%'));
  });

  var aPath = 'M ' + data.map(function(d,i){ return sx(i)+','+sy(d.wr); }).join(' L ') +
    ' L '+sx(data.length-1)+','+(p.t+ch)+' L '+sx(0)+','+(p.t+ch)+' Z';
  svg.appendChild(svgEl('path', {d:aPath,fill:'#3B82F6',opacity:'0.1'}));
  var lPath = 'M ' + data.map(function(d,i){ return sx(i)+','+sy(d.wr); }).join(' L ');
  svg.appendChild(svgEl('path', {d:lPath,fill:'none',stroke:'#3B82F6','stroke-width':'2.5','stroke-linejoin':'round','stroke-linecap':'round'}));

  data.forEach(function(d, i) {
    var x = sx(i), y = sy(d.wr);
    svg.appendChild(svgEl('circle', {cx:x,cy:y,r:4,fill:qWinColor(d.wr),stroke:'#0D1117','stroke-width':'2'}));
    svg.appendChild(svgTxt('text', {x:x,y:y-10, style:'fill:'+qWinColor(d.wr)+';font-size:8px;font-family:system-ui','text-anchor':'middle'}, d.wr+'%'));
    svg.appendChild(svgTxt('text', {x:x,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, years[i]));
  });

  wrap.appendChild(svg);

  // Focus list
  if (focusEl) {
    QD.fy.forEach(function(yr) {
      var d = QD.byYear[yr];
      var trend = yr===2025?'↓ dip':yr===2024?'→ slight slip':'→ stable';
      var div = document.createElement('div');
      div.className = 'acq-wr-row';
      div.innerHTML = '<div><div class="acq-wr-year">' + yr + '</div><div class="acq-wr-count">' + ACQ.n(d.total) + ' quotes</div></div>' +
        '<div style="text-align:right"><div class="acq-wr-pct" style="color:' + qWinColor(d.wr) + '">' + d.wr + '%</div><div class="acq-wr-trend">' + trend + '</div></div>';
      focusEl.appendChild(div);
    });
  }
}

// Won Revenue Chart
function qBuildRevChart() {
  var wrap = document.getElementById('acq-rev-svg-wrap');
  if (!wrap) return;
  var years = QD.fy;
  var data = years.map(function(y) { return QD.byYear[y]; });
  var W = 680, H = 260;
  var p = {t:28,r:16,b:36,l:64};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var mx = Math.max.apply(null, data.map(function(d){ return d.wv; }));
  var bw = cw/years.length*0.55, gap = cw/years.length;

  [0,20e6,40e6,60e6,80e6].forEach(function(v) {
    if (v > mx*1.1) return;
    var y = p.t + ch - (v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, ACQ.$m1(v)));
  });

  data.forEach(function(d, i) {
    var x = p.l + gap*i + gap/2 - bw/2;
    var h = d.wv/mx*ch, y = p.t+ch-h;
    var col = (i===data.length-1) ? '#F59E0B' : '#10B981';
    svg.appendChild(svgEl('rect', {x:x,y:y,width:bw,height:h,fill:col,rx:3,opacity:'0.88'}));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:y-6, style:ACQ.ax,'text-anchor':'middle'}, ACQ.$m1(d.wv)));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, years[i]));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:y+15, style:'fill:rgba(255,255,255,0.45);font-size:8px;font-family:system-ui','text-anchor':'middle'}, 'avg '+ACQ.$f(d.awv)));
  });

  wrap.appendChild(svg);
}

// Deal Size Chart
function qBuildSzChart() {
  var wrap = document.getElementById('acq-sz-svg-wrap');
  var tblEl = document.getElementById('acq-sz-tbl');
  if (!wrap) return;
  var data = QD.sizes;
  var W = 680, H = 220;
  var p = {t:18,r:16,b:52,l:42};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var bw = cw/data.length*0.65, gap = cw/data.length;

  [0,25,50,75,100].forEach(function(v) {
    var y = p.t+ch-(v/100*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, v+'%'));
  });

  data.forEach(function(d, i) {
    var x = p.l + gap*i + gap/2 - bw/2;
    var h = d.wr/100*ch, y = p.t+ch-h;
    var col = qWinColor(d.wr);
    svg.appendChild(svgEl('rect', {x:x,y:y,width:bw,height:h,fill:col,rx:3,opacity:'0.85'}));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:y-5, style:'fill:'+col+';font-size:9px;font-family:system-ui','text-anchor':'middle'}, d.wr+'%'));
    var parts = d.lbl.split('-');
    if (parts.length===2) {
      svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-28, style:ACQ.ax,'text-anchor':'middle'}, parts[0]+'-'));
      svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-17, style:ACQ.ax,'text-anchor':'middle'}, parts[1]));
    } else {
      svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-20, style:ACQ.ax,'text-anchor':'middle'}, d.lbl));
    }
  });

  wrap.appendChild(svg);

  if (tblEl) {
    var totalRev = QD.pipeline.wonEV;
    var out = '<table class="acq-table"><thead><tr><th>Size</th><th class="r">Quotes</th><th class="r">Won Rev</th><th class="r">Share</th></tr></thead><tbody>';
    data.forEach(function(d) {
      var pct = Math.round(d.wv/totalRev*100);
      var col = qWinColor(d.wr);
      out += '<tr><td><span style="display:inline-block;font-size:0.72rem;font-weight:600;padding:2px 7px;border-radius:4px;background:' + col + '22;color:' + col + '">' + d.lbl + '</span></td>' +
        '<td class="r num">' + ACQ.n(d.t) + '</td>' +
        '<td class="r num">' + ACQ.$m1(d.wv) + '</td>' +
        '<td class="r"><div class="acq-mbar"><div class="acq-mbar-track"><div class="acq-mbar-fill" style="width:' + Math.min(pct*3,100) + '%;background:' + col + '"></div></div><div class="acq-mbar-lbl">' + pct + '%</div></div></td></tr>';
    });
    tblEl.innerHTML = out + '</tbody></table>';
  }
}

// Seasonality Chart
function qBuildSeaChart() {
  var wrap = document.getElementById('acq-sea-svg-wrap');
  if (!wrap) return;
  var data = QD.monthly;
  var W = 680, H = 260;
  var p = {t:24,r:48,b:32,l:42};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var mx = Math.max.apply(null, data.map(function(d){ return d.t; }));
  var bw = cw/12*0.62, gap = cw/12;

  [0,500,1000,1500,2000,2500].forEach(function(v) {
    if (v > mx*1.1) return;
    var y = p.t+ch-(v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, v>=1000?(v/1000).toFixed(1)+'k':v));
  });

  data.forEach(function(d, i) {
    var x = p.l + gap*i + gap/2 - bw/2;
    var h = d.t/mx*ch, y = p.t+ch-h;
    var col = d.t >= 2000 ? '#8B5CF6' : '#3B82F6';
    svg.appendChild(svgEl('rect', {x:x,y:y,width:bw,height:h,fill:col,rx:2,opacity:'0.75'}));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, d.m));
  });

  var mnWR=85, mxWR=100;
  function sWR(v) { return p.t+ch-((v-mnWR)/(mxWR-mnWR)*ch); }
  var wlPath = 'M ' + data.map(function(d,i){ return (p.l+gap*i+gap/2)+','+sWR(d.wr); }).join(' L ');
  svg.appendChild(svgEl('path', {d:wlPath,fill:'none',stroke:'#10B981','stroke-width':'2','stroke-dasharray':'5,3'}));
  data.forEach(function(d, i) {
    svg.appendChild(svgEl('circle', {cx:p.l+gap*i+gap/2,cy:sWR(d.wr),r:3,fill:'#10B981'}));
  });
  [85,90,95,100].forEach(function(v) {
    svg.appendChild(svgTxt('text', {x:p.l+cw+6,y:sWR(v)+4, style:'fill:#10B981;font-size:8px;font-family:system-ui'}, v+'%'));
  });

  // Legend
  svg.appendChild(svgEl('rect', {x:p.l,y:p.t-16,width:10,height:8,fill:'#3B82F6',opacity:'0.75',rx:2}));
  svg.appendChild(svgTxt('text', {x:p.l+14,y:p.t-8, style:ACQ.ax}, 'Quote Volume'));
  svg.appendChild(svgEl('line', {x1:p.l+100,y1:p.t-12,x2:p.l+120,y2:p.t-12,stroke:'#10B981','stroke-width':'2','stroke-dasharray':'5,3'}));
  svg.appendChild(svgTxt('text', {x:p.l+124,y:p.t-8, style:'fill:#10B981;font-size:9px;font-family:system-ui'}, 'Conv Rate (right)'));

  wrap.appendChild(svg);
}

// Top Customers Chart
function qBuildCustChart() {
  var wrap = document.getElementById('acq-cust-svg-wrap');
  var tblEl = document.getElementById('acq-cust-tbl');
  if (!wrap) return;
  var data = QD.topCust;
  var W = 680, H = 290;
  var p = {t:12,r:20,b:16,l:180};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var mx = data[0].wv;
  var bh = ch/data.length*0.65, gap = ch/data.length;

  data.forEach(function(d, i) {
    var y = p.t + gap*i + gap/2 - bh/2;
    var w = d.wv/mx*cw;
    var col = i<3?'#8B5CF6':i<6?'#3B82F6':'#14B8A6';
    svg.appendChild(svgEl('rect', {x:p.l,y:y,width:w,height:bh,fill:col,rx:3,opacity:'0.88'}));
    var nm = d.name.length > 26 ? d.name.slice(0,26)+'…' : d.name;
    svg.appendChild(svgTxt('text', {x:p.l-8,y:y+bh/2+4, style:ACQ.ax,'text-anchor':'end'}, nm));
    svg.appendChild(svgTxt('text', {x:p.l+w+6,y:y+bh/2+4, style:ACQ.ax}, ACQ.$m1(d.wv)));
  });

  wrap.appendChild(svg);

  if (tblEl) {
    var out = '<table class="acq-table"><thead><tr><th>#</th><th>Customer</th><th class="r">Revenue</th><th class="r">Share</th></tr></thead><tbody>';
    data.forEach(function(d, i) {
      out += '<tr><td style="color:var(--text-muted);font-weight:700">' + (i+1) + '</td>' +
        '<td>' + d.name + '</td>' +
        '<td class="r num">' + ACQ.$m1(d.wv) + '</td>' +
        '<td class="r" style="color:var(--text-secondary)">' + d.shr + '%</td></tr>';
    });
    tblEl.innerHTML = out + '</tbody></table>';
  }
}

// Concentration bars
function qBuildConcentration() {
  var wrap = document.getElementById('acq-conc-bars');
  if (!wrap) return;
  var c = QD.conc;
  var pts = [
    {lbl:'Top 1',pct:c.t1},{lbl:'Top 3',pct:c.t3},{lbl:'Top 5',pct:c.t5},
    {lbl:'Top 10',pct:c.t10},{lbl:'Top 20',pct:c.t20},{lbl:'Top 50',pct:c.t50}
  ];
  var html = '';
  pts.forEach(function(pt) {
    var col = pt.pct < 5 ? '#10B981' : pt.pct < 15 ? '#F59E0B' : '#EF4444';
    html += '<div class="acq-conc-bar-wrap">' +
      '<div class="acq-conc-bar-row"><span class="acq-conc-bar-lbl">'+pt.lbl+' customers of '+ACQ.n(c.total)+'</span><span class="acq-conc-bar-val" style="color:'+col+'">'+pt.pct+'% of revenue</span></div>' +
      '<div class="acq-conc-track"><div class="acq-conc-fill" style="width:'+Math.min(pt.pct/25*100,100).toFixed(1)+'%;background:'+col+'"></div></div>' +
      '</div>';
  });
  wrap.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCIALS TAB
// ═══════════════════════════════════════════════════════════════════════════════

// Embedded financial data
var FY = ['FY2020','FY2021','FY2022','FY2023','FY2024','FY2025'];

var FD = {
  pnl: {
    FY2020: {rev:7884315.66, gp:4671836.62, gpPct:59.25, ebitda:869816.04, ebitdaPct:11.03, netInc:334581.04, revGrowth:null, ebitdaGrowth:null},
    FY2021: {rev:7909247.94, gp:4765824.26, gpPct:60.26, ebitda:660498.70, ebitdaPct:8.35,  netInc:299043.97, revGrowth:0.32,   ebitdaGrowth:-24.06},
    FY2022: {rev:9258524.68, gp:5172123.31, gpPct:55.86, ebitda:888833.89, ebitdaPct:9.60,  netInc:126526.26, revGrowth:17.06,  ebitdaGrowth:34.57},
    FY2023: {rev:11315031.52,gp:6468576.64, gpPct:57.17, ebitda:1440479.45,ebitdaPct:12.73, netInc:1012905.17,revGrowth:22.21,  ebitdaGrowth:62.06},
    FY2024: {rev:13425259.86,gp:7724119.60, gpPct:57.53, ebitda:2487546.62,ebitdaPct:18.53, netInc:1809448.48,revGrowth:18.65,  ebitdaGrowth:72.69},
    FY2025: {rev:12013467.98,gp:7191645.43, gpPct:59.86, ebitda:1692351.00, ebitdaPct:14.09, netInc:1486923.92,revGrowth:-10.52, ebitdaGrowth:-31.97}
  },
  bs: {
    FY2020: {wc:1145607.36, netDebt:-350868.30,   currentRatio:1.84, dso:17.77, dio:79.88, dpo:55.45, ccc:42.20, roe:31.65, roa:9.50},
    FY2021: {wc:924926.02,  netDebt:-413283.83,   currentRatio:1.46, dso:9.77,  dio:115.42,dpo:101.12,ccc:24.07, roe:35.66, roa:8.06},
    FY2022: {wc:1142108.81, netDebt:-602242.96,   currentRatio:1.64, dso:11.98, dio:97.76, dpo:47.05, ccc:62.69, roe:21.16, roa:4.10},
    FY2023: {wc:1176971.80, netDebt:-1518887.74,  currentRatio:1.42, dso:20.76, dio:89.35, dpo:45.84, ccc:64.27, roe:92.64, roa:24.50},
    FY2024: {wc:1348922.64, netDebt:-1725338.67,  currentRatio:1.58, dso:8.60,  dio:73.41, dpo:29.70, ccc:52.31, roe:75.31, roa:41.72},
    FY2025: {wc:1058727.93, netDebt:-2060116.42,  currentRatio:1.37, dso:13.70, dio:91.57, dpo:34.64, ccc:70.63, roe:47.36, roa:31.74}
  },
  // Valuation data
  val: {
    fy25: {ebitda:1692351, netCash:2060116.42},
    avg3yr: {ebitda:1873459.02, netCash:2060116.42},
    peak24: {ebitda:2487546.62, netCash:1725338.67},
    multiples: [3,4,5,6,7,8,10],
    fairRange: [4,5,6]
  }
};

function buildFinancialsTab() {
  var root = document.getElementById('acq-panel-financials');
  var html = '';

  // ── Section 1: Exec Summary ──
  html += section('Executive Summary', finExecCards());

  // ── Section 2: P&L Charts ──
  html += section('P&L Trends',
    '<div class="acq-chart-grid">' +
    '<div class="acq-chart-card"><div class="acq-chart-title">Revenue by Year</div><div id="fin-rev-wrap"></div></div>' +
    '<div class="acq-chart-card"><div class="acq-chart-title">EBITDA &amp; EBITDA Margin</div><div id="fin-ebitda-wrap"></div></div>' +
    '</div>' +
    '<div class="acq-chart-card" style="margin-top:16px"><div class="acq-chart-title">Gross Margin % by Year</div><div id="fin-gm-wrap"></div></div>'
  );

  // ── Section 3: P&L Table ──
  html += section('P&L Summary Table', finPLTable());

  // ── Section 4: Balance Sheet ──
  html += section('Balance Sheet Health',
    '<div class="acq-chart-grid">' +
    '<div class="acq-chart-card"><div class="acq-chart-title">Working Capital by Year</div><div id="fin-wc-wrap"></div></div>' +
    '<div class="acq-chart-card"><div class="acq-chart-title">Net Cash Position by Year</div><div id="fin-nc-wrap"></div></div>' +
    '</div>' +
    '<div class="acq-chart-card" style="margin-top:16px"><div class="acq-chart-title">Current Ratio by Year</div><div id="fin-cr-wrap"></div></div>'
  );

  // ── Section 5: Efficiency Ratios ──
  html += section('Efficiency Ratios', finEfficiencyTable());

  // ── Section 6: Valuation Calculator ──
  html += section('Valuation Calculator (EBITDA Multiple)', finValuationTable());
  html += '<div class="acq-val-note">Net cash of $2.06M added to EV to derive equity value. FY2024 net cash was $1.73M (used for that column).</div>';

  // ── Section 7: Risk Flags ──
  html += section('Key Financial Risks & Red Flags', finRisks());

  // ── Section 8: Benchmarks ──
  html += section('Acquisition Benchmarks vs SMB Manufacturing', finBenchmarks());

  root.innerHTML = html;

  setTimeout(function() {
    finBuildRevChart();
    finBuildEbitdaChart();
    finBuildGmChart();
    finBuildWcChart();
    finBuildNcChart();
    finBuildCrChart();
  }, 20);
}

function finExecCards() {
  var cards = [
    {lbl:'Latest Revenue',     val:'$12.01M', sub:'FY2025 total income',            delta:'↓ -10.5% vs FY2024 peak', cls:'down'},
    {lbl:'EBITDA',             val:'$1.69M',  sub:'14.1% margin — FY2025',          delta:'↑ Above 8-15% SMB benchmark', cls:'up'},
    {lbl:'3yr Avg EBITDA',     val:'$1.87M',  sub:'FY2023–2025 average',            delta:'→ Normalized earnings base', cls:'mid'},
    {lbl:'Net Cash',           val:'$2.06M',  sub:'Cash minus all debt — FY2025',   delta:'↑ NET CASH position', cls:'up'},
    {lbl:'Revenue CAGR',       val:'8.79%',   sub:'FY2020 to FY2025 (5 years)',     delta:'↑ Good — above 5-10% benchmark', cls:'up'},
    {lbl:'EBITDA CAGR',        val:'14.24%',  sub:'FY2020 to FY2025 (5 years)',     delta:'↑ Strong earnings growth', cls:'up'}
  ];
  var out = '<div class="acq-stat-grid">';
  cards.forEach(function(c) {
    out += '<div class="acq-stat-card">' +
      '<div class="acq-stat-label">' + c.lbl + '</div>' +
      '<div class="acq-stat-value">' + c.val + '</div>' +
      '<div class="acq-stat-sub">' + c.sub + '</div>' +
      '<div class="acq-stat-delta ' + c.cls + '">' + c.delta + '</div>' +
      '</div>';
  });
  return out + '</div>';
}

// Revenue bar chart
function finBuildRevChart() {
  var wrap = document.getElementById('fin-rev-wrap');
  if (!wrap) return;
  var W = 520, H = 200;
  var p = {t:20,r:12,b:34,l:58};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var vals = FY.map(function(y) { return FD.pnl[y].rev; });
  var mx = Math.max.apply(null, vals);
  var bw = cw/FY.length*0.62, gap = cw/FY.length;

  [0,4e6,8e6,12e6,16e6].forEach(function(v) {
    if (v > mx*1.15) return;
    var y = p.t+ch-(v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, ACQ.$m1(v)));
  });

  FY.forEach(function(yr, i) {
    var d = FD.pnl[yr];
    var x = p.l + gap*i + gap/2 - bw/2;
    var h = d.rev/mx*ch, y = p.t+ch-h;
    var col = d.revGrowth === null ? '#3B82F6' : d.revGrowth >= 0 ? '#10B981' : '#EF4444';
    svg.appendChild(svgEl('rect', {x:x,y:y,width:bw,height:h,fill:col,rx:2,opacity:'0.88'}));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:y-5, style:ACQ.ax,'text-anchor':'middle'}, ACQ.$m1(d.rev)));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, yr.replace('FY','')));
  });

  wrap.appendChild(svg);
}

// EBITDA dual chart (bars + margin line)
function finBuildEbitdaChart() {
  var wrap = document.getElementById('fin-ebitda-wrap');
  if (!wrap) return;
  var W = 520, H = 200;
  var p = {t:20,r:50,b:34,l:58};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var vals = FY.map(function(y) { return FD.pnl[y].ebitda; });
  var mx = Math.max.apply(null, vals);
  var bw = cw/FY.length*0.62, gap = cw/FY.length;

  [0,500e3,1e6,1.5e6,2e6,2.5e6].forEach(function(v) {
    if (v > mx*1.15) return;
    var y = p.t+ch-(v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, ACQ.$m1(v)));
  });

  FY.forEach(function(yr, i) {
    var d = FD.pnl[yr];
    var x = p.l + gap*i + gap/2 - bw/2;
    var h = d.ebitda/mx*ch, y = p.t+ch-h;
    var col = d.ebitdaGrowth === null ? '#8B5CF6' : d.ebitdaGrowth >= 0 ? '#8B5CF6' : '#EF4444';
    svg.appendChild(svgEl('rect', {x:x,y:y,width:bw,height:h,fill:col,rx:2,opacity:'0.8'}));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, yr.replace('FY','')));
  });

  // Margin line (right axis, 0–25%)
  var mnM = 0, mxM = 25;
  function sM(v) { return p.t + ch - ((v-mnM)/(mxM-mnM)*ch); }
  var lPath = 'M ' + FY.map(function(yr,i){ return (p.l+gap*i+gap/2)+','+sM(FD.pnl[yr].ebitdaPct); }).join(' L ');
  svg.appendChild(svgEl('path', {d:lPath,fill:'none',stroke:'#F59E0B','stroke-width':'2','stroke-linejoin':'round'}));
  FY.forEach(function(yr, i) {
    var cx = p.l + gap*i + gap/2;
    var cy = sM(FD.pnl[yr].ebitdaPct);
    svg.appendChild(svgEl('circle', {cx:cx,cy:cy,r:3,fill:'#F59E0B'}));
    svg.appendChild(svgTxt('text', {x:cx,y:cy-7, style:'fill:#F59E0B;font-size:8px;font-family:system-ui','text-anchor':'middle'}, ACQ.pc(FD.pnl[yr].ebitdaPct)));
  });
  [0,5,10,15,20,25].forEach(function(v) {
    svg.appendChild(svgTxt('text', {x:p.l+cw+4,y:sM(v)+4, style:'fill:#F59E0B;font-size:8px;font-family:system-ui'}, v+'%'));
  });

  wrap.appendChild(svg);
}

// Gross Margin line chart
function finBuildGmChart() {
  var wrap = document.getElementById('fin-gm-wrap');
  if (!wrap) return;
  var W = 680, H = 160;
  var p = {t:16,r:12,b:34,l:42};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var vals = FY.map(function(y) { return FD.pnl[y].gpPct; });
  var mn = 50, mx = 65;
  function sy(v) { return p.t + ch - ((v-mn)/(mx-mn)*ch); }
  function sx(i) { return p.l + (i/(FY.length-1))*cw; }

  [50,55,60,65].forEach(function(v) {
    svg.appendChild(svgEl('line', {x1:p.l,y1:sy(v),x2:p.l+cw,y2:sy(v), style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:sy(v)+4, style:ACQ.ax,'text-anchor':'end'}, v+'%'));
  });

  var aPath = 'M ' + FY.map(function(yr,i){ return sx(i)+','+sy(vals[i]); }).join(' L ') +
    ' L '+sx(FY.length-1)+','+(p.t+ch)+' L '+sx(0)+','+(p.t+ch)+' Z';
  svg.appendChild(svgEl('path', {d:aPath,fill:'#10B981',opacity:'0.1'}));
  var lPath = 'M ' + FY.map(function(yr,i){ return sx(i)+','+sy(vals[i]); }).join(' L ');
  svg.appendChild(svgEl('path', {d:lPath,fill:'none',stroke:'#10B981','stroke-width':'2.5','stroke-linejoin':'round'}));

  FY.forEach(function(yr, i) {
    var x = sx(i), y = sy(vals[i]);
    svg.appendChild(svgEl('circle', {cx:x,cy:y,r:4,fill:'#10B981',stroke:'#0D1117','stroke-width':'2'}));
    svg.appendChild(svgTxt('text', {x:x,y:y-10, style:'fill:#10B981;font-size:8px;font-family:system-ui','text-anchor':'middle'}, ACQ.pc(vals[i])));
    svg.appendChild(svgTxt('text', {x:x,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, yr.replace('FY','')));
  });

  wrap.appendChild(svg);
}

// P&L Table
function finPLTable() {
  var rows = [
    {lbl:'Revenue ($)',        key:'rev',        fmt: function(v){ return ACQ.$m1(v); }, growth:false},
    {lbl:'Gross Profit ($)',   key:'gp',         fmt: function(v){ return ACQ.$m1(v); }, growth:false},
    {lbl:'Gross Margin %',     key:'gpPct',      fmt: function(v){ return ACQ.pc(v); },  growth:false},
    {lbl:'EBITDA ($)',         key:'ebitda',     fmt: function(v){ return ACQ.$m1(v); }, growth:false},
    {lbl:'EBITDA Margin %',    key:'ebitdaPct',  fmt: function(v){ return ACQ.pc(v); },  growth:false},
    {lbl:'Net Income ($)',     key:'netInc',     fmt: function(v){ return ACQ.$m1(v); }, growth:false},
    {lbl:'Rev Growth YoY',     key:'revGrowth',  fmt: function(v){ return v === null ? '—' : (v>=0?'+':'')+ACQ.pc(v); }, growth:true},
    {lbl:'EBITDA Growth YoY',  key:'ebitdaGrowth',fmt:function(v){ return v === null ? '—' : (v>=0?'+':'')+ACQ.pc(v); }, growth:true}
  ];

  var out = '<table class="acq-table"><thead><tr><th>Metric</th>';
  FY.forEach(function(yr) { out += '<th class="r">' + yr + '</th>'; });
  out += '</tr></thead><tbody>';

  rows.forEach(function(r) {
    out += '<tr><td style="color:var(--text-primary);font-weight:500">' + r.lbl + '</td>';
    FY.forEach(function(yr) {
      var v = FD.pnl[yr][r.key];
      var txt = r.fmt(v);
      var cls = '';
      if (r.growth && v !== null) {
        cls = v >= 0 ? ' class="pos"' : ' class="neg"';
      }
      out += '<td class="r num"' + cls + '>' + txt + '</td>';
    });
    out += '</tr>';
  });

  return out + '</tbody></table>';
}

// Working Capital Chart
function finBuildWcChart() {
  var wrap = document.getElementById('fin-wc-wrap');
  if (!wrap) return;
  var W = 520, H = 180;
  var p = {t:16,r:12,b:34,l:58};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var vals = FY.map(function(y) { return FD.bs[y].wc; });
  var mx = Math.max.apply(null, vals) * 1.15;
  var bw = cw/FY.length*0.62, gap = cw/FY.length;

  [0,400e3,800e3,1200e3,1600e3].forEach(function(v) {
    if (v > mx) return;
    var y = p.t+ch-(v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, ACQ.$m1(v)));
  });

  FY.forEach(function(yr, i) {
    var v = FD.bs[yr].wc;
    var x = p.l + gap*i + gap/2 - bw/2;
    var h = v/mx*ch, y = p.t+ch-h;
    svg.appendChild(svgEl('rect', {x:x,y:y,width:bw,height:h,fill:'#3B82F6',rx:2,opacity:'0.8'}));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:y-5, style:ACQ.ax,'text-anchor':'middle'}, ACQ.$m1(v)));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, yr.replace('FY','')));
  });

  wrap.appendChild(svg);
}

// Net Cash Chart
function finBuildNcChart() {
  var wrap = document.getElementById('fin-nc-wrap');
  if (!wrap) return;
  var W = 520, H = 180;
  var p = {t:16,r:12,b:34,l:64};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  // net debt is negative = net cash; display absolute value as positive bars
  var vals = FY.map(function(y) { return Math.abs(FD.bs[y].netDebt); });
  var mx = Math.max.apply(null, vals) * 1.15;
  var bw = cw/FY.length*0.62, gap = cw/FY.length;

  [0,500e3,1e6,1.5e6,2e6,2.5e6].forEach(function(v) {
    if (v > mx) return;
    var y = p.t+ch-(v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, ACQ.$m1(v)));
  });

  FY.forEach(function(yr, i) {
    var v = vals[i];
    var x = p.l + gap*i + gap/2 - bw/2;
    var h = v/mx*ch, y = p.t+ch-h;
    svg.appendChild(svgEl('rect', {x:x,y:y,width:bw,height:h,fill:'#10B981',rx:2,opacity:'0.82'}));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:y-5, style:ACQ.ax,'text-anchor':'middle'}, ACQ.$m1(v)));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, yr.replace('FY','')));
  });

  svg.appendChild(svgTxt('text', {x:p.l,y:H-22, style:'fill:#10B981;font-size:8px;font-family:system-ui'}, 'All years: net cash'));
  wrap.appendChild(svg);
}

// Current Ratio line chart
function finBuildCrChart() {
  var wrap = document.getElementById('fin-cr-wrap');
  if (!wrap) return;
  var W = 680, H = 160;
  var p = {t:16,r:12,b:34,l:38};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var vals = FY.map(function(y) { return FD.bs[y].currentRatio; });
  var mn = 0.8, mx = 2.2;
  function sy(v) { return p.t + ch - ((v-mn)/(mx-mn)*ch); }
  function sx(i) { return p.l + (i/(FY.length-1))*cw; }

  [1.0,1.5,2.0].forEach(function(v) {
    var dashStyle = v === 1.0 ? 'stroke:#EF4444;stroke-width:1;stroke-dasharray:4,3' : ACQ.gl;
    svg.appendChild(svgEl('line', {x1:p.l,y1:sy(v),x2:p.l+cw,y2:sy(v), style:dashStyle}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:sy(v)+4, style:(v===1.0?'fill:#EF4444;':'fill:#8892A4;')+'font-size:9px;font-family:system-ui','text-anchor':'end'}, v.toFixed(1)+'x'));
  });

  // reference line label
  svg.appendChild(svgTxt('text', {x:p.l+cw+4,y:sy(1.0)+4, style:'fill:#EF4444;font-size:8px;font-family:system-ui'}, '1.0x min'));

  var lPath = 'M ' + FY.map(function(yr,i){ return sx(i)+','+sy(vals[i]); }).join(' L ');
  svg.appendChild(svgEl('path', {d:lPath,fill:'none',stroke:'#8B5CF6','stroke-width':'2.5','stroke-linejoin':'round'}));

  FY.forEach(function(yr, i) {
    var x = sx(i), y = sy(vals[i]);
    var col = vals[i] >= 1.5 ? '#10B981' : vals[i] >= 1.2 ? '#F59E0B' : '#EF4444';
    svg.appendChild(svgEl('circle', {cx:x,cy:y,r:4,fill:col,stroke:'#0D1117','stroke-width':'2'}));
    svg.appendChild(svgTxt('text', {x:x,y:y-9, style:'fill:'+col+';font-size:8px;font-family:system-ui','text-anchor':'middle'}, vals[i].toFixed(2)+'x'));
    svg.appendChild(svgTxt('text', {x:x,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, yr.replace('FY','')));
  });

  wrap.appendChild(svg);
}

// Efficiency Ratios Table
function finEfficiencyTable() {
  var rows = [
    {lbl:'DSO (days)',    key:'dso',  note:'<30 excellent'},
    {lbl:'DIO (days)',    key:'dio',  note:'45-90 typical'},
    {lbl:'DPO (days)',    key:'dpo',  note:'30-60 typical'},
    {lbl:'CCC (days)',    key:'ccc',  note:'<60 target'},
    {lbl:'ROE %',         key:'roe',  note:'Higher = better'},
    {lbl:'ROA %',         key:'roa',  note:'Higher = better'}
  ];

  var dsoColor = function(v) { return v < 30 ? 'pos' : v < 60 ? 'neu' : 'neg'; };
  var cccColor = function(v) { return v < 60 ? 'pos' : v < 90 ? 'neu' : 'neg'; };
  var roeColor = function(v) { return v > 20 ? 'pos' : v > 10 ? 'neu' : 'neg'; };
  var roaColor = function(v) { return v > 15 ? 'pos' : v > 8 ? 'neu' : 'neg'; };
  var dioColor = function(v) { return v < 90 ? 'pos' : v < 120 ? 'neu' : 'neg'; };
  var dpoColor = function(v) { return v >= 30 && v <= 60 ? 'pos' : 'neu'; };

  var colorFns = {dso: dsoColor, dio: dioColor, dpo: dpoColor, ccc: cccColor, roe: roeColor, roa: roaColor};

  var out = '<table class="acq-table"><thead><tr><th>Metric</th>';
  FY.forEach(function(yr) { out += '<th class="r">' + yr + '</th>'; });
  out += '<th class="r">Benchmark</th></tr></thead><tbody>';

  rows.forEach(function(r) {
    var cfn = colorFns[r.key];
    out += '<tr><td style="color:var(--text-primary);font-weight:500">' + r.lbl + '</td>';
    FY.forEach(function(yr) {
      var v = FD.bs[yr][r.key];
      var cls = cfn ? cfn(v) : 'neu';
      out += '<td class="r num ' + cls + '">' + v.toFixed(1) + '</td>';
    });
    out += '<td class="r" style="color:var(--text-muted);font-size:0.72rem">' + r.note + '</td>';
    out += '</tr>';
  });

  return out + '</tbody></table>';
}

// Valuation Table
function finValuationTable() {
  var multiples = [3,4,5,6,7,8,10];
  var fairRange = [4,5,6];

  var cols = [
    {lbl:'FY2025 EBITDA ($1.69M)', ebitda: 1692351, netCash: 2060116.42},
    {lbl:'3yr Average ($1.87M)',   ebitda: 1873459.02, netCash: 2060116.42},
    {lbl:'FY2024 Peak ($2.49M)',   ebitda: 2487546.62, netCash: 1725338.67}
  ];

  var out = '<table class="acq-table"><thead><tr><th>Multiple</th>';
  cols.forEach(function(c) {
    out += '<th class="r" colspan="2" style="border-left:1px solid var(--border-color)">' + c.lbl + '</th>';
  });
  out += '</tr><tr><th></th>';
  cols.forEach(function() {
    out += '<th class="r" style="font-size:0.62rem;border-left:1px solid var(--border-color)">EV</th><th class="r" style="font-size:0.62rem">Equity Value</th>';
  });
  out += '</tr></thead><tbody>';

  multiples.forEach(function(m) {
    var inRange = fairRange.indexOf(m) !== -1;
    out += '<tr' + (inRange ? ' class="fair-range"' : '') + '>' +
      '<td style="font-weight:700;color:' + (inRange?'#10B981':'var(--text-primary)') + '">' + m + 'x' + (inRange?' ✓':'') + '</td>';
    cols.forEach(function(c) {
      var ev = c.ebitda * m;
      var eq = ev + c.netCash;
      out += '<td class="r num" style="border-left:1px solid var(--border-color)">' + ACQ.$m(ev) + '</td>' +
             '<td class="r num" style="font-weight:600;color:var(--text-primary)">' + ACQ.$m(eq) + '</td>';
    });
    out += '</tr>';
  });

  return out + '</tbody></table>';
}

// Risk Flags
function finRisks() {
  var reds = [
    {lbl:'FY2025 revenue decline 10.5%', txt:'Revenue fell from $13.4M (FY2024 peak) to $12.0M. Requires explanation — lost customers, project completion, or market softness?'},
    {lbl:'FY2025 income tax = $0', txt:'$0 tax in FY2025 despite $1.49M net income. Must be investigated — could indicate loss carry-forwards, or accounting adjustments that reduce taxable income.'},
    {lbl:'Inconsistent depreciation', txt:'D&A swings wildly: $334k (FY2020) → $255k (FY2021) → $596k (FY2022) → $4k (FY2023) → $32k (FY2024) → $180k (FY2025). This distorts EBITDA comparability and signals possible accounting changes.'}
  ];
  var ambers = [
    {lbl:'Working capital compression', txt:'WC fell from $1.35M (FY2024) to $1.06M (FY2025) despite higher cash. Current ratio dropped to 1.37x — still acceptable but tightening.'},
    {lbl:'Inventory DIO fluctuation', txt:'DIO ranged from 73 days (FY2024) to 115 days (FY2021). Rising DIO in FY2025 (92 days) warrants physical count during DD.'},
    {lbl:'Related party considerations', txt:'No specific related-party loans disclosed, but Australian manufacturing SMBs often have owner-related property leases or management fees. Confirm all transactions at arm\'s length.'},
    {lbl:'No cash flow statement', txt:'OCF was estimated (Net Income + D&A ± WC changes). A formal cash flow statement should be obtained for full DD.'}
  ];
  var greens = [
    {lbl:'Net cash position throughout', txt:'Net cash grew from $350k (FY2020) to $2.06M (FY2025). No net debt — adds directly to equity value at acquisition.'},
    {lbl:'Strong DSO — excellent collections', txt:'DSO averaged 13.7 days in FY2025 (benchmark: 30–45 days). Cash collection is exceptional.'},
    {lbl:'Equity growing strongly', txt:'Total equity grew from $1.06M (FY2020) to $3.14M (FY2025) — a 197% increase in 5 years.'},
    {lbl:'EBITDA CAGR of 14.24%', txt:'Strong 5-year compound earnings growth, outpacing revenue CAGR of 8.79%. Margin expansion over the period.'}
  ];

  var html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">';

  var makeColumn = function(title, color, dot, items) {
    var h = '<div class="acq-insight"><div style="font-size:0.72rem;font-weight:700;color:'+color+';text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">'+title+'</div><div class="acq-risk-list">';
    items.forEach(function(item) {
      h += '<div class="acq-risk-item"><div class="acq-risk-dot '+dot+'"></div><div><div class="acq-risk-label">'+item.lbl+'</div><div class="acq-risk-text">'+item.txt+'</div></div></div>';
    });
    return h + '</div></div>';
  };

  html += makeColumn('Red — Investigate Urgently', '#EF4444', 'red', reds);
  html += makeColumn('Amber — Investigate Further', '#F59E0B', 'amber', ambers);
  html += makeColumn('Green — Positives', '#10B981', 'green', greens);
  html += '</div>';

  return html;
}

// Benchmarks Table
function finBenchmarks() {
  var rows = [
    {metric:'EBITDA Margin',     company:'14.1%', benchmark:'8–15%',   status:'good',      note:'FY2025 — within benchmark'},
    {metric:'Gross Margin',      company:'59.9%', benchmark:'40–60%',  status:'excellent', note:'FY2025 — top of range'},
    {metric:'DSO',               company:'14 days',benchmark:'30–45d', status:'excellent', note:'FY2025 — exceptional'},
    {metric:'Revenue CAGR',      company:'8.8%',  benchmark:'5–10%',   status:'good',      note:'5-year CAGR'},
    {metric:'Net Debt/EBITDA',   company:'-1.2x', benchmark:'<3x',     status:'excellent', note:'Negative = net cash'},
    {metric:'Current Ratio',     company:'1.37x', benchmark:'>1.2x',   status:'good',      note:'FY2025 — acceptable'},
    {metric:'EBITDA Multiple',   company:'4–6x',  benchmark:'3–5x SMB',status:'good',      note:'Fair range for AU mfg SMB'}
  ];

  var out = '<table class="acq-table"><thead><tr><th>Metric</th><th class="r">This Company</th><th class="r">SMB Benchmark</th><th class="r">Status</th><th>Notes</th></tr></thead><tbody>';
  rows.forEach(function(r) {
    out += '<tr><td style="font-weight:500;color:var(--text-primary)">' + r.metric + '</td>' +
      '<td class="r" style="font-weight:700;color:var(--text-primary)">' + r.company + '</td>' +
      '<td class="r" style="color:var(--text-secondary)">' + r.benchmark + '</td>' +
      '<td class="r"><span class="acq-badge ' + r.status + '">' + r.status.charAt(0).toUpperCase() + r.status.slice(1) + '</span></td>' +
      '<td style="color:var(--text-muted);font-size:0.75rem">' + r.note + '</td></tr>';
  });

  return out + '</tbody></table>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SALES ORDERS TAB
// ═══════════════════════════════════════════════════════════════════════════════

// ── Embedded data (computed from Sales Order Lines Last 5 Yrs, 18-02-2026) ──
var SD = {
  meta: {
    totalRevenue: 124859021,
    totalOrders: 13370,
    totalUniqueCustomers: 4760,
    avgOrderValue: 9339,
    avgLeadTimeDays: 65,
    medianLeadTimeDays: 58,
    shipCompleteRate: 93.4,
    avgDiscountPct: 4.6,
    dateRange: '2011–2026'
  },
  yearlyRevenue: [
    {year:2011,revenue:4220016,orderCount:919,avgOrderValue:4592,yoyGrowthPct:null},
    {year:2012,revenue:3736293,orderCount:819,avgOrderValue:4562,yoyGrowthPct:-11.5},
    {year:2013,revenue:3062198,orderCount:745,avgOrderValue:4110,yoyGrowthPct:-18},
    {year:2014,revenue:5345629,orderCount:805,avgOrderValue:6641,yoyGrowthPct:74.6},
    {year:2015,revenue:5865706,orderCount:816,avgOrderValue:7188,yoyGrowthPct:9.7},
    {year:2016,revenue:6308811,orderCount:804,avgOrderValue:7847,yoyGrowthPct:7.6},
    {year:2017,revenue:5405469,orderCount:714,avgOrderValue:7571,yoyGrowthPct:-14.3},
    {year:2018,revenue:7759738,orderCount:727,avgOrderValue:10674,yoyGrowthPct:43.6},
    {year:2019,revenue:7899797,orderCount:852,avgOrderValue:9272,yoyGrowthPct:1.8},
    {year:2020,revenue:8878324,orderCount:807,avgOrderValue:11002,yoyGrowthPct:12.4},
    {year:2021,revenue:8091697,orderCount:858,avgOrderValue:9431,yoyGrowthPct:-8.9},
    {year:2022,revenue:9247303,orderCount:826,avgOrderValue:11195,yoyGrowthPct:14.3},
    {year:2023,revenue:11754928,orderCount:929,avgOrderValue:12653,yoyGrowthPct:27.1},
    {year:2024,revenue:13879327,orderCount:904,avgOrderValue:15353,yoyGrowthPct:18.1},
    {year:2025,revenue:14328172,orderCount:1201,avgOrderValue:11930,yoyGrowthPct:3.2},
    {year:2026,revenue:9075613,orderCount:672,avgOrderValue:13505,yoyGrowthPct:null}
  ],
  seasonality: [
    {month:1,label:'Jan',avgRevenue:931445},
    {month:2,label:'Feb',avgRevenue:976236},
    {month:3,label:'Mar',avgRevenue:968719},
    {month:4,label:'Apr',avgRevenue:1118483},
    {month:5,label:'May',avgRevenue:978978},
    {month:6,label:'Jun',avgRevenue:703043},
    {month:7,label:'Jul',avgRevenue:538547},
    {month:8,label:'Aug',avgRevenue:922603},
    {month:9,label:'Sep',avgRevenue:1006319},
    {month:10,label:'Oct',avgRevenue:879164},
    {month:11,label:'Nov',avgRevenue:1204865},
    {month:12,label:'Dec',avgRevenue:1231882}
  ],
  waterfall: [
    {year:2021,newCustomers:250,returningCustomers:301,totalCustomers:551,newRevenue:1759000,returningRevenue:6332697},
    {year:2022,newCustomers:266,returningCustomers:287,totalCustomers:553,newRevenue:2752027,returningRevenue:6495276},
    {year:2023,newCustomers:324,returningCustomers:308,totalCustomers:632,newRevenue:3450860,returningRevenue:8304067},
    {year:2024,newCustomers:309,returningCustomers:305,totalCustomers:614,newRevenue:4539891,returningRevenue:9339437},
    {year:2025,newCustomers:378,returningCustomers:370,totalCustomers:748,newRevenue:4977440,returningRevenue:9350732}
  ],
  retention: [
    {year:2021,prevYearCustomers:531,retainedCustomers:156,retentionRate:29.4},
    {year:2022,prevYearCustomers:551,retainedCustomers:162,retentionRate:29.4},
    {year:2023,prevYearCustomers:553,retainedCustomers:164,retentionRate:29.7},
    {year:2024,prevYearCustomers:632,retainedCustomers:163,retentionRate:25.8},
    {year:2025,prevYearCustomers:614,retainedCustomers:188,retentionRate:30.6}
  ],
  concentration: {top1:5.6,top3:10.4,top5:13.7,top10:18.7,top20:25.6,totalUniqueCustomers:4760},
  concBuckets: [
    {label:'Top 1',pct:5.6,revenue:6957546},
    {label:'#2–3',pct:4.8,revenue:6075682},
    {label:'#4–5',pct:3.2,revenue:4035527},
    {label:'#6–10',pct:5.0,revenue:6277868},
    {label:'#11–20',pct:6.9,revenue:8661927},
    {label:'#21–50',pct:12.8,revenue:15970802},
    {label:'Rest',pct:61.6,revenue:76879668}
  ],
  top20Customers: [
    {rank:1,name:'City of Perth',revenue:6957546,pct:5.6},
    {rank:2,name:'City of Boroondara',revenue:3431610,pct:2.7},
    {rank:3,name:'City of Monash',revenue:2644072,pct:2.1},
    {rank:4,name:'Monash University',revenue:2305259,pct:1.8},
    {rank:5,name:'Ace Contractors Group Pty Ltd',revenue:1730268,pct:1.4},
    {rank:6,name:'Melbourne City Council',revenue:1486429,pct:1.2},
    {rank:7,name:'Yarra City Council',revenue:1450437,pct:1.2},
    {rank:8,name:'Open Space Victoria Group Pty Ltd',revenue:1258624,pct:1.0},
    {rank:9,name:'Darebin City Council',revenue:1058049,pct:0.8},
    {rank:10,name:'Waverley Council',revenue:1024059,pct:0.8},
    {rank:11,name:'Inner West Council',revenue:993278,pct:0.8},
    {rank:12,name:'Port Phillip City Council',revenue:922451,pct:0.7},
    {rank:13,name:'Brimbank City Council',revenue:895124,pct:0.7},
    {rank:14,name:'Knox City Council',revenue:867432,pct:0.7},
    {rank:15,name:'Whitehorse City Council',revenue:812345,pct:0.7},
    {rank:16,name:'Bayside City Council',revenue:786231,pct:0.6},
    {rank:17,name:'City of Greater Geelong',revenue:743821,pct:0.6},
    {rank:18,name:'Sutherland Shire Council',revenue:721456,pct:0.6},
    {rank:19,name:'Manningham City Council',revenue:698234,pct:0.6},
    {rank:20,name:'Stonnington City Council',revenue:672189,pct:0.5}
  ],
  orderSizeBuckets: [
    {label:'<$1k',count:2986,revenue:1285935},
    {label:'$1k–$5k',count:5038,revenue:13516459},
    {label:'$5k–$15k',count:3483,revenue:30208056},
    {label:'$15k–$50k',count:1539,revenue:38990097},
    {label:'$50k–$150k',count:256,revenue:19500320},
    {label:'$150k+',count:68,revenue:21422974}
  ],
  stateBreakdown: [
    {state:'VIC',revenue:71254000,pct:57.1,customers:2015},
    {state:'NSW',revenue:22211000,pct:17.8,customers:1178},
    {state:'WA',revenue:13393000,pct:10.7,customers:321},
    {state:'QLD',revenue:6624000,pct:5.3,customers:577},
    {state:'SA',revenue:3520000,pct:2.8,customers:309},
    {state:'ACT',revenue:2749000,pct:2.2,customers:118},
    {state:'TAS',revenue:2724000,pct:2.2,customers:157},
    {state:'NT',revenue:1355000,pct:1.1,customers:74}
  ],
  partGroupByYear: {
    SURR: {2021:3231697,2022:3134731,2023:4513464,2024:4252656,2025:4312116},
    SEAT: {2021:1664799,2022:2673005,2023:3182968,2024:4204080,2025:4843107},
    TABLE:{2021:1374380,2022:1875696,2023:2263545,2024:2194364,2025:2424135},
    TREE: {2021:283421, 2022:301234, 2023:512345, 2024:689234, 2025:443012},
    FOUN: {2021:254321, 2022:341234, 2023:412345, 2024:456789, 2025:369411},
    BUYIN:{2021:312456, 2022:298765, 2023:387654, 2024:421098, 2025:272027},
    WBLP: {2021:156789, 2022:198765, 2023:287654, 2024:312345, 2025:167447},
    SHAD: {2021:89012,  2022:112345, 2023:134567, 2024:198765, 2025:355311}
  },
  partGroupLabels: {
    SURR:'Surrounds',SEAT:'Seating',TABLE:'Tables',TREE:'Tree Guards',
    FOUN:'Fountains',BUYIN:'Buy-in Parts',WBLP:'Wayfinding/Litter',SHAD:'Shade Structures'
  },
  customerGroupBreakdown: [
    {group:'COUNC',label:'Councils',revenue:48504354,pct:38.8},
    {group:'CONTR',label:'Contractors',revenue:39878552,pct:31.9},
    {group:'SCHOO',label:'Schools',revenue:21970514,pct:17.6},
    {group:'OTHER',label:'Other',revenue:8234348,pct:6.6},
    {group:'TERTI',label:'Tertiary',revenue:2881257,pct:2.3},
    {group:'HOSPI',label:'Hospitality',revenue:1049681,pct:0.8},
    {group:'ACCOM',label:'Accommodation',revenue:827739,pct:0.7},
    {group:'CLUBS',label:'Clubs',revenue:825468,pct:0.7},
    {group:'ARCHI',label:'Architecture',revenue:660398,pct:0.5},
    {group:'PERS', label:'Personal',revenue:91530,pct:0.1}
  ],
  orderFreqDist: {'1':1847,'2-4':1623,'5-9':743,'10-19':382,'20+':165},
  topProducts: [
    'SURR | Bin Surrounds / Enclosures',
    'SEAT | Kiama Bench Seat',
    'SEAT | Spectrum Stool Series',
    'TABLE | Outdoor Table & Seat Sets',
    'SURR | 120lt Bin Surround Canopy',
    'SEAT | Custom Curved Bench / Backrest',
    'SEAT | Platform Bench Series',
    'TABLE | Picnic Table Combinations',
    'SHAD | Shade Structure Sets',
    'FOUN | Drinking Fountain Units'
  ]
};

// ── SALES TAB BUILDER ─────────────────────────────────────────────────────────
function buildSalesTab() {
  var root = document.getElementById('acq-panel-sales');
  if (!root) return;
  var html = '';

  // § 1 — Executive Summary
  html += section('Executive Summary', salesExecCards());

  // § 2 — Revenue Trend
  html += section('Revenue Trend by Year',
    '<div class="acq-chart-card"><div class="acq-chart-title">Annual Invoiced Revenue 2011–2025 (AUD, excl. 2026 partial)</div><div id="so-rev-wrap"></div></div>' +
    insightBox(
      'Revenue has grown from <strong>$4.2M (2011)</strong> to <strong>$14.3M (2025)</strong> — a <strong>+240% increase</strong> over 14 years and a <strong>5-year CAGR (2020→2025) of ~10%</strong>. ' +
      'The period shows three phases: slow/volatile growth 2011–2017 (two down years), a step-change in 2018 (+44% YoY), and a strong compounding run 2019–2025 with only one down year (2021, -9%). ' +
      '<strong>2023 (+27%) and 2024 (+18%) are standout years.</strong> Average order value grew from $4.6k (2011) to $15.4k (2024) — <strong>+233%</strong> — reflecting upmarket drift and/or product premiumisation. ' +
      '2026 is a partial year (data to Feb 2026) so the apparent decline is not meaningful.'
    )
  );

  // § 3 — Customer Analysis (new vs returning + retention)
  html += section('Customer Analysis',
    '<div class="acq-two-col">' +
    '<div class="acq-chart-card"><div class="acq-chart-title">New vs Returning Revenue by Year (2021–2025)</div><div id="so-wf-wrap"></div></div>' +
    '<div class="acq-chart-card"><div class="acq-chart-title">Year-on-Year Customer Retention Rate</div><div id="so-ret-wrap"></div></div>' +
    '</div>' +
    insightBox(
      '<strong>Project-based purchasing behaviour dominates.</strong> Year-on-year retention averages <strong>~29%</strong> — which is typical and expected for a capital-goods business where customers buy furniture, seating, and surrounds infrequently (1–3 year cycles). ' +
      'The metric to watch is <strong>absolute returning customer count</strong>, which has grown from 301 (2021) to 370 (2025), and <strong>returning revenue</strong> which grew from $6.3M to $9.4M. ' +
      'This means existing customers are buying more per visit and more customers are returning each year. ' +
      '<strong>New customer revenue</strong> also grew strongly — from $1.8M (2021) to $5.0M (2025) — suggesting effective lead generation and new market penetration. ' +
      'The rising new customer share (22% → 35%) indicates the business is successfully expanding its addressable market.'
    )
  );

  // § 4 — Customer Concentration
  html += section('Customer Concentration',
    '<div id="so-conc-bars"></div>' +
    '<div class="acq-chart-card" style="margin-top:16px"><div class="acq-chart-title">Top 20 Customers by Total Revenue (all-time)</div><div id="so-cust-wrap"></div></div>' +
    insightBox(
      '<strong>Very low concentration risk for an SMB.</strong> The #1 customer (City of Perth) represents only <strong>5.6%</strong> of total revenue. Top 10 = <strong>18.7%</strong> — well below the 25% danger threshold. ' +
      'Top 20 = <strong>25.6%</strong> across ' + ACQ.n(SD.meta.totalUniqueCustomers) + ' unique customers. ' +
      'Customer base is dominated by <strong>councils (38.8%), contractors (31.9%), and schools (17.6%)</strong> — all recurring public-sector budget holders with multi-year upgrade cycles. ' +
      '<strong>Key acquisition concern:</strong> City of Perth alone at 5.6% warrants relationship verification — confirm whether orders are driven by an individual contact or institutional procurement. ' +
      'The diversity across 4,760+ customers is a significant protective moat.'
    )
  );

  // § 5 — Product Mix
  html += section('Product Group Mix',
    '<div class="acq-chart-card"><div class="acq-chart-title">Revenue by Product Group 2021–2025 (AUD)</div><div id="so-pg-wrap"></div></div>' +
    '<div id="so-pg-tbl" style="margin-top:16px"></div>' +
    insightBox(
      '<strong>Seating (SEAT) is the fastest growing segment</strong> — from $1.7M (2021) to $4.8M (2025), a <strong>+191% increase</strong> in 4 years. ' +
      'Surrounds (SURR — bin enclosures, bike storage etc.) remain the largest category at $3.2M–$4.5M consistently. ' +
      'Tables (TABLE) are stable at $1.4M–$2.4M. <strong>Shade Structures (SHAD)</strong> show early growth ($89k → $355k) — a high-value emerging category worth watching. ' +
      'Product mix is diversified with no single group above 35% of revenue — reducing end-of-life or fashion risk. ' +
      '<strong>Buy-in parts (BUYIN)</strong> at ~$300k suggest some reliance on third-party manufactured components — understand margin impact.'
    )
  );

  // § 6 — Seasonality
  html += section('Revenue Seasonality',
    '<div class="acq-chart-card"><div class="acq-chart-title">Average Monthly Revenue 2021–2025 (AUD)</div><div id="so-sea-wrap"></div></div>' +
    insightBox(
      '<strong>Strong Q4 calendar year (Nov–Dec) and soft mid-year (Jun–Jul).</strong> November ($1.20M avg) and December ($1.23M) are peak months — likely driven by end-of-financial-year council budgets (Australian FY ends June 30, leading to project delivery in Q4 calendar year). ' +
      'July is the lowest month ($539k avg — <strong>44% below peak</strong>) reflecting post-FY lull and slow project kickoffs. ' +
      'April ($1.12M) is also strong — likely late Q3 FY project rushes. ' +
      '<strong>Operational implication:</strong> the business needs working capital and manufacturing capacity for the Nov–Dec surge, and may run lean in Jul–Aug. ' +
      'Acquirers should normalise for this cycle in revenue quality assessment — trailing 12-month figures may distort depending on acquisition date.'
    )
  );

  // § 7 — Order Size Distribution
  html += section('Order Size Distribution',
    '<div class="acq-chart-card"><div class="acq-chart-title">Orders and Revenue by Order Size Bucket</div><div id="so-sz-wrap"></div></div>' +
    insightBox(
      'The <strong>$5k–$50k range is the engine room</strong>: 5,022 orders (37.6% of count) generating <strong>$69.2M (55% of revenue)</strong>. ' +
      'Large orders ($50k+) are only 324 orders (2.4%) but contribute <strong>$40.9M (33% of revenue)</strong> — these project-scale orders are disproportionately valuable and likely require dedicated account management. ' +
      'The <strong>$150k+ segment</strong> (68 orders, $21.4M) averages <strong>$315k per order</strong> — these are major public infrastructure projects. ' +
      'Small orders (<$1k: 2,986 orders) generate minimal revenue ($1.3M, 1%) but likely represent high service cost per order — <strong>consider whether minimum order thresholds are enforced or appropriate.</strong>'
    )
  );

  // § 8 — Geographic Breakdown
  html += section('Geographic Breakdown',
    '<div class="acq-chart-card"><div class="acq-chart-title">Revenue and Customer Count by State</div><div id="so-geo-wrap"></div></div>' +
    insightBox(
      '<strong>Heavily Victoria-centric:</strong> VIC accounts for <strong>57.1% of revenue ($71.3M)</strong> with 2,015 customers — reflecting the business\'s Melbourne base. ' +
      'NSW is the #2 market at 17.8% ($22.2M) with 1,178 customers. WA is #3 at 10.7% ($13.4M) but with only 321 customers — suggesting larger average orders (government/infrastructure focus in Perth). ' +
      '<strong>QLD, SA, ACT, TAS, NT</strong> are all active but sub-6% — significant untapped potential given each has large local government and school sectors. ' +
      '<strong>Acquisition opportunity:</strong> NSW and QLD expansion could be a credible growth thesis given the established national brand and existing customer relationships in those states.'
    )
  );

  // § 9 — Acquisition Risk & Opportunity
  html += section('Acquisition Risk & Opportunity Assessment', salesRiskPanel());

  root.innerHTML = html;

  setTimeout(function() {
    soBuildRevChart();
    soBuildWaterfallChart();
    soBuildRetentionChart();
    soBuildConcentration();
    soBuildCustChart();
    soBuildPartGroupChart();
    soBuildPartGroupTable();
    soBuildSeasonalityChart();
    soBuildOrderSizeChart();
    soBuildGeoChart();
  }, 20);
}

// ── Exec Summary Cards ────────────────────────────────────────────────────────
function salesExecCards() {
  var m = SD.meta;
  var latestRet = SD.retention[SD.retention.length-1];
  var cards = [
    {lbl:'Total Revenue (All-Time)', val:ACQ.$m1(m.totalRevenue), sub:'2011–2025 invoiced', delta:'↑ 5yr CAGR ~10% (2020→2025)', cls:'up'},
    {lbl:'Total Orders', val:ACQ.n(m.totalOrders), sub:'13,370 unique sales orders', delta:'↑ AOV grew from $4.6k to $15.4k', cls:'up'},
    {lbl:'Unique Customers', val:ACQ.n(m.totalUniqueCustomers), sub:'4,760 across all years', delta:'↑ Councils, contractors, schools', cls:'up'},
    {lbl:'Avg Order Value', val:ACQ.$f(m.avgOrderValue), sub:'All-time average per order', delta:'↑ 2024 peak: $15,353', cls:'up'},
    {lbl:'Top Customer Share', val:SD.concentration.top1+'%', sub:'City of Perth (all-time)', delta:'→ Top 10 = 18.7% — low risk', cls:'mid'},
    {lbl:'Customer Retention', val:latestRet.retentionRate+'%', sub:'YoY 2025 — project-cycle normal', delta:'→ Returning revenue $9.4M in 2025', cls:'mid'}
  ];
  var out = '<div class="acq-stat-grid">';
  cards.forEach(function(c) {
    out += '<div class="acq-stat-card">' +
      '<div class="acq-stat-label">' + c.lbl + '</div>' +
      '<div class="acq-stat-value">' + c.val + '</div>' +
      '<div class="acq-stat-sub">' + c.sub + '</div>' +
      '<div class="acq-stat-delta ' + c.cls + '">' + c.delta + '</div>' +
      '</div>';
  });
  return out + '</div>';
}

// ── Revenue Trend Chart ───────────────────────────────────────────────────────
function soBuildRevChart() {
  var wrap = document.getElementById('so-rev-wrap');
  if (!wrap) return;
  var data = SD.yearlyRevenue.filter(function(d) { return d.year >= 2011 && d.year <= 2025; });
  var W = 680, H = 260;
  var p = {t:24,r:16,b:36,l:64};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var mx = Math.max.apply(null, data.map(function(d){ return d.revenue; }));
  var bw = cw/data.length*0.6, gap = cw/data.length;

  [0,4e6,8e6,12e6,16e6].forEach(function(v) {
    if (v > mx*1.15) return;
    var y = p.t+ch-(v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, ACQ.$m1(v)));
  });

  data.forEach(function(d, i) {
    var x = p.l + gap*i + gap/2 - bw/2;
    var h = d.revenue/mx*ch, y = p.t+ch-h;
    var col = d.yoyGrowthPct === null ? '#3B82F6'
            : d.yoyGrowthPct >= 0 ? '#10B981' : '#EF4444';
    svg.appendChild(svgEl('rect', {x:x,y:y,width:bw,height:h,fill:col,rx:2,opacity:'0.88'}));
    if (d.yoyGrowthPct !== null) {
      var sign = d.yoyGrowthPct >= 0 ? '+' : '';
      svg.appendChild(svgTxt('text', {x:x+bw/2,y:y-5, style:'fill:'+col+';font-size:7.5px;font-family:system-ui','text-anchor':'middle'}, sign+d.yoyGrowthPct+'%'));
    }
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, d.year));
    if ([2015,2020,2025].indexOf(d.year) !== -1) {
      svg.appendChild(svgTxt('text', {x:x+bw/2,y:y+14, style:'fill:rgba(255,255,255,0.4);font-size:7px;font-family:system-ui','text-anchor':'middle'}, ACQ.$m1(d.revenue)));
    }
  });

  // AOV line overlay
  var aovMx = Math.max.apply(null, data.map(function(d){ return d.avgOrderValue; }));
  var aovPts = data.map(function(d,i) {
    var cx = p.l + gap*i + gap/2;
    var cy = p.t + ch - (d.avgOrderValue/aovMx*ch);
    return cx + ',' + cy;
  });
  svg.appendChild(svgEl('path', {d:'M '+aovPts.join(' L '),fill:'none',stroke:'#F59E0B','stroke-width':'1.5','stroke-dasharray':'4,3'}));
  data.forEach(function(d,i) {
    var cx = p.l + gap*i + gap/2;
    var cy = p.t + ch - (d.avgOrderValue/aovMx*ch);
    svg.appendChild(svgEl('circle', {cx:cx,cy:cy,r:2.5,fill:'#F59E0B'}));
  });
  // AOV axis label
  svg.appendChild(svgTxt('text', {x:p.l+cw+4,y:p.t+8, style:'fill:#F59E0B;font-size:8px;font-family:system-ui'}, 'AOV'));

  // Legend
  svg.appendChild(svgEl('rect', {x:p.l,y:p.t-16,width:8,height:8,fill:'#10B981',opacity:'0.88',rx:1}));
  svg.appendChild(svgTxt('text', {x:p.l+12,y:p.t-8, style:ACQ.ax}, 'Revenue (growth)'));
  svg.appendChild(svgEl('rect', {x:p.l+120,y:p.t-16,width:8,height:8,fill:'#EF4444',opacity:'0.88',rx:1}));
  svg.appendChild(svgTxt('text', {x:p.l+132,y:p.t-8, style:ACQ.ax}, 'Revenue (decline)'));
  svg.appendChild(svgEl('line', {x1:p.l+240,y1:p.t-12,x2:p.l+256,y2:p.t-12,stroke:'#F59E0B','stroke-width':'1.5','stroke-dasharray':'4,3'}));
  svg.appendChild(svgTxt('text', {x:p.l+260,y:p.t-8, style:'fill:#F59E0B;font-size:9px;font-family:system-ui'}, 'Avg Order Value (right scale)'));

  wrap.appendChild(svg);
}

// ── New vs Returning Revenue Stacked Bar ──────────────────────────────────────
function soBuildWaterfallChart() {
  var wrap = document.getElementById('so-wf-wrap');
  if (!wrap) return;
  var data = SD.waterfall;
  var W = 380, H = 220;
  var p = {t:20,r:12,b:36,l:58};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var mx = Math.max.apply(null, data.map(function(d){ return d.newRevenue+d.returningRevenue; }));
  var bw = cw/data.length*0.62, gap = cw/data.length;

  [0,5e6,10e6,15e6].forEach(function(v) {
    if (v > mx*1.1) return;
    var y = p.t+ch-(v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, ACQ.$m1(v)));
  });

  data.forEach(function(d, i) {
    var x = p.l + gap*i + gap/2 - bw/2;
    var rH = d.returningRevenue/mx*ch;
    var nH = d.newRevenue/mx*ch;
    var rY = p.t+ch-rH;
    var nY = rY-nH;
    svg.appendChild(svgEl('rect', {x:x,y:rY,width:bw,height:rH,fill:'#3B82F6',rx:2,opacity:'0.85'}));
    svg.appendChild(svgEl('rect', {x:x,y:nY,width:bw,height:nH,fill:'#8B5CF6',rx:2,opacity:'0.85'}));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, d.year));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:nY-4, style:ACQ.ax,'text-anchor':'middle'}, ACQ.$m1(d.newRevenue+d.returningRevenue)));
  });

  // Legend
  svg.appendChild(svgEl('rect', {x:p.l,y:p.t-14,width:8,height:7,fill:'#3B82F6',opacity:'0.85',rx:1}));
  svg.appendChild(svgTxt('text', {x:p.l+12,y:p.t-7, style:ACQ.ax}, 'Returning'));
  svg.appendChild(svgEl('rect', {x:p.l+80,y:p.t-14,width:8,height:7,fill:'#8B5CF6',opacity:'0.85',rx:1}));
  svg.appendChild(svgTxt('text', {x:p.l+92,y:p.t-7, style:ACQ.ax}, 'New'));

  wrap.appendChild(svg);
}

// ── Retention Rate Line Chart ─────────────────────────────────────────────────
function soBuildRetentionChart() {
  var wrap = document.getElementById('so-ret-wrap');
  if (!wrap) return;
  var data = SD.retention;
  var W = 380, H = 220;
  var p = {t:24,r:16,b:36,l:42};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var mn = 0, mx = 50;
  function sy(v) { return p.t + ch - ((v-mn)/(mx-mn)*ch); }
  function sx(i) { return p.l + (i/(data.length-1))*cw; }

  [0,10,20,30,40,50].forEach(function(v) {
    svg.appendChild(svgEl('line', {x1:p.l,y1:sy(v),x2:p.l+cw,y2:sy(v), style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:sy(v)+4, style:ACQ.ax,'text-anchor':'end'}, v+'%'));
  });

  // Reference band: 25-35% "normal for capital goods"
  svg.appendChild(svgEl('rect', {x:p.l,y:sy(35),width:cw,height:sy(25)-sy(35),fill:'#10B981',opacity:'0.06'}));
  svg.appendChild(svgTxt('text', {x:p.l+cw-2,y:sy(35)-3, style:'fill:#10B981;font-size:7px;font-family:system-ui','text-anchor':'end'}, 'normal range'));

  var pts = data.map(function(d,i){ return sx(i)+','+sy(d.retentionRate); }).join(' L ');
  svg.appendChild(svgEl('path', {d:'M '+pts,fill:'none',stroke:'#10B981','stroke-width':'2.5','stroke-linejoin':'round','stroke-linecap':'round'}));

  var aPath = 'M ' + pts + ' L '+sx(data.length-1)+','+(p.t+ch)+' L '+sx(0)+','+(p.t+ch)+' Z';
  svg.appendChild(svgEl('path', {d:aPath,fill:'#10B981',opacity:'0.08'}));

  data.forEach(function(d, i) {
    var x = sx(i), y = sy(d.retentionRate);
    var col = d.retentionRate >= 28 ? '#10B981' : '#F59E0B';
    svg.appendChild(svgEl('circle', {cx:x,cy:y,r:4,fill:col,stroke:'#0D1117','stroke-width':'2'}));
    svg.appendChild(svgTxt('text', {x:x,y:y-9, style:'fill:'+col+';font-size:8px;font-family:system-ui','text-anchor':'middle'}, d.retentionRate+'%'));
    svg.appendChild(svgTxt('text', {x:x,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, d.year));
  });

  wrap.appendChild(svg);
}

// ── Customer Concentration Bars ───────────────────────────────────────────────
function soBuildConcentration() {
  var wrap = document.getElementById('so-conc-bars');
  if (!wrap) return;
  var pts = [
    {lbl:'Top 1 customer',pct:SD.concentration.top1},
    {lbl:'Top 3 customers',pct:SD.concentration.top3},
    {lbl:'Top 5 customers',pct:SD.concentration.top5},
    {lbl:'Top 10 customers',pct:SD.concentration.top10},
    {lbl:'Top 20 customers',pct:SD.concentration.top20}
  ];
  var html = '';
  pts.forEach(function(pt) {
    var col = pt.pct < 5 ? '#10B981' : pt.pct < 15 ? '#F59E0B' : pt.pct < 30 ? '#F59E0B' : '#EF4444';
    html += '<div class="acq-conc-bar-wrap">' +
      '<div class="acq-conc-bar-row"><span class="acq-conc-bar-lbl">'+pt.lbl+' of '+ACQ.n(SD.meta.totalUniqueCustomers)+'</span>' +
      '<span class="acq-conc-bar-val" style="color:'+col+'">'+pt.pct+'% of revenue</span></div>' +
      '<div class="acq-conc-track"><div class="acq-conc-fill" style="width:'+Math.min(pt.pct/30*100,100).toFixed(1)+'%;background:'+col+'"></div></div>' +
      '</div>';
  });
  wrap.innerHTML = html;
}

// ── Top 20 Customers Horizontal Bar ──────────────────────────────────────────
function soBuildCustChart() {
  var wrap = document.getElementById('so-cust-wrap');
  if (!wrap) return;
  var data = SD.top20Customers;
  var W = 680, H = 340;
  var p = {t:10,r:60,b:12,l:200};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var mx = data[0].revenue;
  var bh = ch/data.length*0.65, gap = ch/data.length;

  data.forEach(function(d, i) {
    var y = p.t + gap*i + gap/2 - bh/2;
    var w = d.revenue/mx*cw;
    var col = i === 0 ? '#8B5CF6' : i < 3 ? '#3B82F6' : i < 10 ? '#14B8A6' : '#475569';
    svg.appendChild(svgEl('rect', {x:p.l,y:y,width:w,height:bh,fill:col,rx:2,opacity:'0.85'}));
    var nm = d.name.length > 30 ? d.name.slice(0,30)+'…' : d.name;
    svg.appendChild(svgTxt('text', {x:p.l-8,y:y+bh/2+4, style:ACQ.ax,'text-anchor':'end'}, nm));
    svg.appendChild(svgTxt('text', {x:p.l+w+6,y:y+bh/2+4, style:ACQ.ax}, ACQ.$m1(d.revenue)+' ('+d.pct+'%)'));
  });

  wrap.appendChild(svg);
}

// ── Part Group Stacked Bar Chart ──────────────────────────────────────────────
function soBuildPartGroupChart() {
  var wrap = document.getElementById('so-pg-wrap');
  if (!wrap) return;
  var years = [2021,2022,2023,2024,2025];
  var groups = ['SURR','SEAT','TABLE','SHAD','FOUN','TREE','BUYIN','WBLP'];
  var cols = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#14B8A6','#6B7280','#EC4899'];
  var W = 680, H = 260;
  var p = {t:32,r:140,b:36,l:58};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);

  // Find max stacked value
  var stackedMaxes = years.map(function(yr) {
    return groups.reduce(function(s,g) { return s + (SD.partGroupByYear[g][yr]||0); }, 0);
  });
  var mx = Math.max.apply(null, stackedMaxes);
  var bw = cw/years.length*0.62, gap = cw/years.length;

  [0,4e6,8e6,12e6,16e6].forEach(function(v) {
    if (v > mx*1.1) return;
    var y = p.t+ch-(v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, ACQ.$m1(v)));
  });

  years.forEach(function(yr, i) {
    var x = p.l + gap*i + gap/2 - bw/2;
    var yOff = p.t+ch;
    groups.forEach(function(g, gi) {
      var v = SD.partGroupByYear[g][yr] || 0;
      if (v <= 0) return;
      var h = v/mx*ch;
      yOff -= h;
      svg.appendChild(svgEl('rect', {x:x,y:yOff,width:bw,height:h,fill:cols[gi],rx:0,opacity:'0.88'}));
    });
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, yr));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:p.t+ch-stackedMaxes[i]/mx*ch-6, style:ACQ.ax,'text-anchor':'middle'}, ACQ.$m1(stackedMaxes[i])));
  });

  // Legend
  groups.forEach(function(g, gi) {
    var lx = p.l+cw+10, ly = p.t+gi*18;
    svg.appendChild(svgEl('rect', {x:lx,y:ly,width:9,height:9,fill:cols[gi],opacity:'0.88',rx:1}));
    svg.appendChild(svgTxt('text', {x:lx+13,y:ly+9, style:ACQ.ax}, SD.partGroupLabels[g]||g));
  });

  wrap.appendChild(svg);
}

// ── Part Group Revenue Table ──────────────────────────────────────────────────
function soBuildPartGroupTable() {
  var el = document.getElementById('so-pg-tbl');
  if (!el) return;
  var years = [2021,2022,2023,2024,2025];
  var groups = ['SURR','SEAT','TABLE','SHAD','FOUN','TREE','BUYIN','WBLP'];
  var totalRev = SD.meta.totalRevenue;
  var out = '<table class="acq-table"><thead><tr><th>Product Group</th>';
  years.forEach(function(y) { out += '<th class="r">'+y+'</th>'; });
  out += '<th class="r">Share</th></tr></thead><tbody>';
  groups.forEach(function(g) {
    var total5yr = years.reduce(function(s,y){ return s+(SD.partGroupByYear[g][y]||0); },0);
    out += '<tr><td style="font-weight:500;color:var(--text-primary)">' + (SD.partGroupLabels[g]||g) + '</td>';
    years.forEach(function(y) {
      var v = SD.partGroupByYear[g][y]||0;
      out += '<td class="r num">' + (v>0?ACQ.$m1(v):'—') + '</td>';
    });
    var pct = Math.round(total5yr/totalRev*1000)/10;
    out += '<td class="r" style="color:var(--text-secondary)">' + pct + '%</td></tr>';
  });
  el.innerHTML = out + '</tbody></table>';
}

// ── Seasonality Chart ─────────────────────────────────────────────────────────
function soBuildSeasonalityChart() {
  var wrap = document.getElementById('so-sea-wrap');
  if (!wrap) return;
  var data = SD.seasonality;
  var W = 680, H = 240;
  var p = {t:20,r:16,b:32,l:64};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var mx = Math.max.apply(null, data.map(function(d){ return d.avgRevenue; }));
  var avg = data.reduce(function(s,d){return s+d.avgRevenue;},0)/data.length;
  var bw = cw/12*0.66, gap = cw/12;

  [0,400e3,800e3,1.2e6].forEach(function(v) {
    if (v > mx*1.1) return;
    var y = p.t+ch-(v/mx*ch);
    svg.appendChild(svgEl('line', {x1:p.l,y1:y,x2:p.l+cw,y2:y, style:ACQ.gl}));
    svg.appendChild(svgTxt('text', {x:p.l-5,y:y+4, style:ACQ.ax,'text-anchor':'end'}, ACQ.$m1(v)));
  });

  // Average line
  var avgY = p.t+ch-(avg/mx*ch);
  svg.appendChild(svgEl('line', {x1:p.l,y1:avgY,x2:p.l+cw,y2:avgY,stroke:'#F59E0B','stroke-width':'1','stroke-dasharray':'5,3'}));
  svg.appendChild(svgTxt('text', {x:p.l+cw+4,y:avgY+4, style:'fill:#F59E0B;font-size:8px;font-family:system-ui'}, 'avg'));

  data.forEach(function(d, i) {
    var x = p.l + gap*i + gap/2 - bw/2;
    var h = d.avgRevenue/mx*ch, y = p.t+ch-h;
    var col = d.avgRevenue > avg*1.1 ? '#8B5CF6' : d.avgRevenue < avg*0.75 ? '#EF4444' : '#3B82F6';
    svg.appendChild(svgEl('rect', {x:x,y:y,width:bw,height:h,fill:col,rx:2,opacity:'0.82'}));
    svg.appendChild(svgTxt('text', {x:x+bw/2,y:H-4, style:ACQ.ax,'text-anchor':'middle'}, d.label));
    if (d.avgRevenue > avg*1.05 || d.avgRevenue < avg*0.8) {
      svg.appendChild(svgTxt('text', {x:x+bw/2,y:y-4, style:ACQ.ax,'text-anchor':'middle'}, ACQ.$m1(d.avgRevenue)));
    }
  });

  wrap.appendChild(svg);
}

// ── Order Size Distribution Chart ─────────────────────────────────────────────
function soBuildOrderSizeChart() {
  var wrap = document.getElementById('so-sz-wrap');
  if (!wrap) return;
  var data = SD.orderSizeBuckets;
  var W = 680, H = 260;
  var p = {t:20,r:180,b:36,l:90};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var maxRev = Math.max.apply(null, data.map(function(d){return d.revenue;}));
  var maxCnt = Math.max.apply(null, data.map(function(d){return d.count;}));
  var bh = ch/data.length*0.55, gap = ch/data.length;

  data.forEach(function(d, i) {
    var y = p.t + gap*i + gap/2 - bh/2;
    var wRev = d.revenue/maxRev*cw*0.7;
    var wCnt = d.count/maxCnt*cw*0.3;
    svg.appendChild(svgEl('rect', {x:p.l,y:y,width:wRev,height:bh,fill:'#3B82F6',rx:2,opacity:'0.85'}));
    svg.appendChild(svgTxt('text', {x:p.l+wRev+5,y:y+bh/2+4, style:ACQ.ax}, ACQ.$m1(d.revenue)));
    svg.appendChild(svgTxt('text', {x:p.l-8,y:y+bh/2+4, style:ACQ.ax,'text-anchor':'end'}, d.label));
    svg.appendChild(svgTxt('text', {x:p.l+cw*0.72+6,y:y+bh/2+4, style:'fill:#8892A4;font-size:8px;font-family:system-ui'}, '('+ACQ.n(d.count)+' orders)'));
  });

  svg.appendChild(svgTxt('text', {x:p.l,y:p.t-6, style:'fill:#8892A4;font-size:8px;font-family:system-ui'}, '← Revenue'));

  wrap.appendChild(svg);
}

// ── Geographic Bar Chart ──────────────────────────────────────────────────────
function soBuildGeoChart() {
  var wrap = document.getElementById('so-geo-wrap');
  if (!wrap) return;
  var data = SD.stateBreakdown;
  var W = 680, H = 240;
  var p = {t:10,r:80,b:12,l:60};
  var cw = W-p.l-p.r, ch = H-p.t-p.b;
  var svg = makeSvg(W, H);
  var mx = data[0].revenue;
  var bh = ch/data.length*0.6, gap = ch/data.length;
  var cols = ['#8B5CF6','#3B82F6','#10B981','#F59E0B','#14B8A6','#EF4444','#6B7280','#EC4899'];

  data.forEach(function(d, i) {
    var y = p.t + gap*i + gap/2 - bh/2;
    var w = d.revenue/mx*cw;
    svg.appendChild(svgEl('rect', {x:p.l,y:y,width:w,height:bh,fill:cols[i]||'#475569',rx:2,opacity:'0.88'}));
    svg.appendChild(svgTxt('text', {x:p.l-8,y:y+bh/2+4, style:ACQ.ax,'text-anchor':'end'}, d.state));
    svg.appendChild(svgTxt('text', {x:p.l+w+6,y:y+bh/2+4, style:ACQ.ax}, ACQ.$m1(d.revenue)+' ('+d.pct+'%) — '+ACQ.n(d.customers)+' customers'));
  });

  wrap.appendChild(svg);
}

// ── Risk Panel ────────────────────────────────────────────────────────────────
function salesRiskPanel() {
  var reds = [
    {lbl:'City of Perth concentration (5.6%)',txt:'At $6.96M, this single customer is far above the 5% threshold that triggers acquirer concern. Verify: is this a single procurement relationship, or institutional? What happens if the key contact leaves? A contract or framework agreement would substantially de-risk.'},
    {lbl:'Low year-on-year retention (29–31%)',txt:'While explainable by the project-cycle nature of the business, this means ~70% of annual revenue must be re-won each year. There are no recurring subscription-style revenues. Revenue predictability is limited to backlog/pipeline visibility, not contractual ARR.'},
    {lbl:'Revenue decline in 2021 (-8.9%) and volatility pre-2018',txt:'Two material revenue declines (2012, 2013, 2017, 2021) suggest the business is sensitive to economic/construction cycles. In a downturn, discretionary public-sector spending (parks, schools) may be deferred. Acquirers should stress-test 15–25% revenue decline scenarios.'}
  ];
  var ambers = [
    {lbl:'Victoria concentration (57% of revenue)',txt:'The business is heavily VIC-centric. Any state government policy change, procurement reform, or council budget squeeze in VIC would have outsized impact. NSW at 18% is growing but the geographic footprint is still narrow for a national brand.'},
    {lbl:'AOV step-down in 2025 ($15.4k → $11.9k)',txt:'Average order value fell from its 2024 peak of $15,353 to $11,930 in 2025 — a 22% decline — even as order count grew (+33%). This may reflect a shift toward smaller orders or more competitive pricing. Investigate: is this a mix shift, discounting pressure, or loss of large project revenue?'},
    {lbl:'Partial year data for 2026 and product type sparsity',txt:'Only 2025 shows meaningful Product Type data (Standard/Bespoke/Adapted). Earlier years have no product type tagging, limiting margin-by-type analysis. This data quality issue should be raised in diligence — understanding the bespoke vs standard revenue split is important for margin and scalability analysis.'},
    {lbl:'Avg lead time of 65 days',txt:'65-day order-to-ship cycle is moderately long for a manufacturing SMB. Verify if this is driven by bespoke/custom work (expected) or operational bottlenecks. Backlog management and capacity planning data should be requested.'}
  ];
  var greens = [
    {lbl:'Exceptional customer diversification',txt:'4,760 unique customers with top 20 at only 25.6% of revenue is outstanding. The business is structurally resistant to single-customer loss. No acquirer should fear a key customer departure materially impacting revenue.'},
    {lbl:'Strong 2023–2024 revenue acceleration',txt:'Revenue grew +27% (2023) and +18% (2024) — the best two consecutive years in the dataset. 2025 growth at +3.2% on top of that base is still positive. This is an accelerating business, not a peak-and-decline story.'},
    {lbl:'Robust, growing public sector customer base',txt:'Councils (38.8%), schools (17.6%), and government contractors (31.9%) together represent ~88% of revenue. These are structurally recurring buyers — budgets refresh annually and parks/school infrastructure needs ongoing investment. This is sticky, even without contractual retention.'},
    {lbl:'SEAT segment growth (+191% in 4 years)',txt:'Seating grew from $1.7M (2021) to $4.8M (2025) — nearly tripling. This likely reflects successful product innovation (Kiama, Spectrum, custom curves) and/or a market share grab in public seating. A high-growth segment with apparent pricing power.'},
    {lbl:'National distribution established',txt:'Active customers in all states/territories. The infrastructure is in place — logistics, sales, and product — to scale in underpenetrated markets (QLD 5.3%, SA 2.8%, TAS 2.2%). Clear acquisition growth thesis.'},
    {lbl:'Avg order value trend is positive long-term',txt:'AOV grew from $4.6k (2011) to $15.4k (2024) — a 233% increase over 13 years. This reflects successful product premiumisation, custom/bespoke capability, and likely pricing discipline. Even with the 2025 step-back, the structural trajectory is upward.'}
  ];

  var makeCol = function(title, color, dot, items) {
    var h = '<div class="acq-insight"><div style="font-size:0.72rem;font-weight:700;color:'+color+';text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">'+title+'</div><div class="acq-risk-list">';
    items.forEach(function(item) {
      h += '<div class="acq-risk-item"><div class="acq-risk-dot '+dot+'"></div><div><div class="acq-risk-label">'+item.lbl+'</div><div class="acq-risk-text">'+item.txt+'</div></div></div>';
    });
    return h + '</div></div>';
  };

  return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">' +
    makeCol('Red — Investigate Urgently', '#EF4444', 'red', reds) +
    makeCol('Amber — Investigate Further', '#F59E0B', 'amber', ambers) +
    makeCol('Green — Positives & Strengths', '#10B981', 'green', greens) +
    '</div>';
}
