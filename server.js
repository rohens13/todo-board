require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const multer = require('multer');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Load data
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (e) {}
    return {
        columns: [
            { id: 'todo', title: 'To Do', color: '#8b5cf6' },
            { id: 'inprogress', title: 'In Progress', color: '#f59e0b' },
            { id: 'done', title: 'Done', color: '#10b981' }
        ],
        tasks: [],
        companies: [],
        podcasts: []
    };
}

// Save data
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get all data
app.get('/api/data', (req, res) => {
    res.json(loadData());
});

// Replace all data (for undo)
app.put('/api/data', (req, res) => {
    saveData(req.body);
    res.json({ success: true });
});

// Add task
app.post('/api/tasks', (req, res) => {
    const data = loadData();
    const task = {
        id: Date.now().toString(),
        title: req.body.title,
        notes: req.body.notes || '',
        column: req.body.column || 'todo',
        color: req.body.color || '#6366f1',
        createdAt: new Date().toISOString()
    };
    data.tasks.push(task);
    saveData(data);
    res.json(task);
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
    const data = loadData();
    const task = data.tasks.find(t => t.id === req.params.id);
    if (task) {
        Object.assign(task, req.body);
        saveData(data);
        res.json(task);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
    const data = loadData();
    data.tasks = data.tasks.filter(t => t.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// --- Podcasts ---

app.get('/api/podcasts', (req, res) => {
    const data = loadData();
    res.json(data.podcasts || []);
});

app.post('/api/podcasts', (req, res) => {
    const data = loadData();
    if (!data.podcasts) data.podcasts = [];
    const podcast = { id: Date.now().toString(), episodes: [], ...req.body, createdAt: new Date().toISOString() };
    data.podcasts.push(podcast);
    saveData(data);
    res.json(podcast);
});

app.put('/api/podcasts/:id', (req, res) => {
    const data = loadData();
    const idx = (data.podcasts || []).findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data.podcasts[idx] = { ...data.podcasts[idx], ...req.body };
    saveData(data);
    res.json(data.podcasts[idx]);
});

app.delete('/api/podcasts/:id', (req, res) => {
    const data = loadData();
    data.podcasts = (data.podcasts || []).filter(p => p.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

app.post('/api/podcasts/:id/episodes', (req, res) => {
    const data = loadData();
    const podcast = (data.podcasts || []).find(p => p.id === req.params.id);
    if (!podcast) return res.status(404).json({ error: 'Not found' });
    const episode = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
    if (!podcast.episodes) podcast.episodes = [];
    podcast.episodes.unshift(episode);
    saveData(data);
    res.json(episode);
});

app.put('/api/podcasts/:id/episodes/:eid', (req, res) => {
    const data = loadData();
    const podcast = (data.podcasts || []).find(p => p.id === req.params.id);
    if (!podcast) return res.status(404).json({ error: 'Not found' });
    const idx = (podcast.episodes || []).findIndex(e => e.id === req.params.eid);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    podcast.episodes[idx] = { ...podcast.episodes[idx], ...req.body };
    saveData(data);
    res.json(podcast.episodes[idx]);
});

app.delete('/api/podcasts/:id/episodes/:eid', (req, res) => {
    const data = loadData();
    const podcast = (data.podcasts || []).find(p => p.id === req.params.id);
    if (!podcast) return res.status(404).json({ error: 'Not found' });
    podcast.episodes = (podcast.episodes || []).filter(e => e.id !== req.params.eid);
    saveData(data);
    res.json({ success: true });
});

// ── YouTube Import ────────────────────────────────────────────────────────

// Generic HTTP/HTTPS fetcher with redirect handling
function fetchUrl(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': 'CONSENT=YES+cb; SOCS=CAISHAgCEhJnd3NfMjAyMzEwMTktMF9SQzIaAmVuIAEaBgiA_LSmBg',
                ...opts.headers
            }
        }, (res) => {
            if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
                const loc = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : `https://www.youtube.com${res.headers.location}`;
                return resolve(fetchUrl(loc, opts));
            }
            let data = '';
            let size = 0;
            const maxSize = opts.maxSize || 4 * 1024 * 1024;
            res.on('data', chunk => { size += chunk.length; if (size < maxSize) data += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
        });
        req.on('error', reject);
        req.setTimeout(20000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
    });
}

// Resolve a YouTube channel URL to a channel ID
async function resolveChannelId(url) {
    const direct = url.match(/youtube\.com\/channel\/(UC[\w-]+)/);
    if (direct) return direct[1];

    const r = await fetchUrl(url);
    const html = r.body;

    // Try multiple patterns for channel ID in page source
    for (const pattern of [
        /"channelId":"(UC[\w-]+)"/,
        /"externalId":"(UC[\w-]+)"/,
        /data-channel-external-id="(UC[\w-]+)"/,
        /"browseId":"(UC[\w-]+)"/
    ]) {
        const m = html.match(pattern);
        if (m) return m[1];
    }
    throw new Error('Could not resolve channel ID from URL. Try using a direct channel URL like youtube.com/channel/UC...');
}

// Fetch latest N videos from a channel's RSS feed
async function getChannelVideos(channelId, count = 4) {
    const r = await fetchUrl(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const xml = r.body;

    const channelTitle = (xml.match(/<title>([^<]+)<\/title>/) || [])[1] || 'Unknown Channel';
    const publisher = (xml.match(/<author><name>([^<]+)<\/name>/) || [])[1] || '';

    const entries = [];
    const entryRx = /<entry>([\s\S]*?)<\/entry>/g;
    let m;
    while ((m = entryRx.exec(xml)) !== null && entries.length < count) {
        const e = m[1];
        const videoId = (e.match(/<yt:videoId>([^<]+)/) || [])[1];
        const title = (e.match(/<title>([^<]+)/) || [])[1]?.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
        const published = (e.match(/<published>([^<]+)/) || [])[1];
        // description in media:group → media:description
        const descMatch = e.match(/<media:description>([\s\S]*?)<\/media:description>/);
        const description = descMatch ? descMatch[1].replace(/&amp;/g,'&').replace(/&#10;/g,'\n').trim() : '';
        if (videoId && title) {
            entries.push({
                videoId,
                title: title.trim(),
                published: published ? published.split('T')[0] : '',
                description: description.slice(0, 3000) // cap for prompt
            });
        }
    }
    return { channelTitle, publisher, entries };
}

// Fetch YouTube auto-captions via the timedtext API
async function getTranscript(videoId) {
    try {
        const page = await fetchUrl(`https://www.youtube.com/watch?v=${videoId}`);
        const html = page.body;

        // Find captionTracks array in page JSON
        const idx = html.indexOf('"captionTracks":');
        if (idx === -1) return null;

        const arrStart = html.indexOf('[', idx);
        let depth = 0, i = arrStart;
        for (; i < html.length; i++) {
            if (html[i] === '[') depth++;
            else if (html[i] === ']') { depth--; if (depth === 0) break; }
        }
        const tracks = JSON.parse(html.substring(arrStart, i + 1));
        const engTrack = tracks.find(t => t.languageCode === 'en' && !t.kind)  // prefer manual EN
            || tracks.find(t => t.languageCode === 'en')                        // auto-generated EN
            || tracks[0];

        if (!engTrack?.baseUrl) return null;

        const captionUrl = engTrack.baseUrl.replace(/\\u0026/g, '&') + '&fmt=srv3';
        const cr = await fetchUrl(captionUrl, { maxSize: 1024 * 1024 });

        return parseTranscriptXml(cr.body);
    } catch {
        return null;
    }
}

function parseTranscriptXml(xml) {
    const lines = [];
    const rx = /<s[^>]+t="(\d+)"[^>]*>([\s\S]*?)<\/s>/g;
    // srv3 format: <s t="ms">text</s>
    let m;
    while ((m = rx.exec(xml)) !== null) {
        const ms = parseInt(m[1]);
        const text = m[2].replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\n/g,' ').trim();
        if (text) {
            const secs = Math.floor(ms / 1000);
            lines.push({ secs, text });
        }
    }

    // Fallback: try xml format <text start="s">text</text>
    if (lines.length === 0) {
        const rx2 = /<text[^>]+start="([^"]+)"[^>]*>([^<]*)<\/text>/g;
        while ((m = rx2.exec(xml)) !== null) {
            const secs = Math.floor(parseFloat(m[1]));
            const text = m[2].replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
            if (text) lines.push({ secs, text });
        }
    }

    if (lines.length === 0) return null;

    // Condense: one block per minute, with leading timestamp
    const blocks = [];
    let curMin = -1, curBlock = '';
    for (const { secs, text } of lines) {
        const mins = Math.floor(secs / 60);
        if (mins !== curMin) {
            if (curBlock) blocks.push(curBlock.trim());
            const mm = String(mins).padStart(2,'0');
            const ss = String(secs % 60).padStart(2,'0');
            curBlock = `[${mm}:${ss}] ${text}`;
            curMin = mins;
        } else {
            curBlock += ' ' + text;
        }
    }
    if (curBlock) blocks.push(curBlock.trim());

    // Return max ~12000 chars (enough for 60-90 min podcast)
    return blocks.join('\n').slice(0, 12000);
}

// Call Claude claude-sonnet-4-6 API without SDK
function callClaude(prompt) {
    return new Promise((resolve, reject) => {
        if (!process.env.ANTHROPIC_API_KEY) {
            return reject(new Error('ANTHROPIC_API_KEY not set in .env'));
        }
        const body = JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
        });
        const req = https.request({
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) return reject(new Error(parsed.error.message));
                    resolve(parsed.content[0].text);
                } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.setTimeout(90000, () => { req.destroy(); reject(new Error('Claude API timeout')); });
        req.write(body);
        req.end();
    });
}

async function analyzeEpisode(video) {
    const context = video.transcript
        ? `TRANSCRIPT (timestamped):\n${video.transcript}`
        : `DESCRIPTION:\n${video.description || '(no description available)'}`;

    const prompt = `You are analyzing a financial/macro/investment podcast episode. Your job is to extract ALL investment ideas discussed and provide a thorough, research-quality analysis.

Episode title: ${video.title}
Date: ${video.published}

${context}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "guests": "guest name(s) from transcript, or empty string",
  "summary": "2-3 sentence episode summary covering the main themes",
  "insights": "- Key insight 1\\n- Key insight 2\\n- Key insight 3\\n(5-8 bullet points covering the most important macro/investment takeaways)",
  "investmentIdeas": [
    {
      "asset": "Asset or company name",
      "tickers": "TICKER1, TICKER2 (or empty if none mentioned)",
      "direction": "Long or Short or Watch or Neutral",
      "timestamp": "MM:SS from transcript when this was discussed, or empty",
      "thesis": "1-2 sentence investment thesis as discussed in the podcast",
      "podConviction": 4,
      "myConviction": 3,
      "myAnalysis": "2-3 sentences of independent analysis using current market knowledge: supporting data, risks, entry considerations"
    }
  ]
}

Rules:
- podConviction (1-5): how strongly the podcast advocated this trade
- myConviction (1-5): your independent view based on fundamentals, current data, and risk/reward
- Capture ALL investment ideas mentioned, even briefly (aim for 3-8 ideas per episode)
- For timestamps: use the [MM:SS] markers in the transcript to cite when each idea was discussed
- Be specific with tickers (e.g. LNG not just "LNG exporters")
- myAnalysis must include at least one piece of specific current data (price, earnings, ratio, etc.)`;

    const raw = await callClaude(prompt);

    // Strip any markdown code fences if present
    const clean = raw.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'').trim();
    return JSON.parse(clean);
}

// YouTube import endpoint (Server-Sent Events for live progress)
app.get('/api/podcasts/import-youtube', async (req, res) => {
    const url = (req.query.url || '').trim();
    if (!url) return res.status(400).json({ error: 'url query param required' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
        send('progress', { message: 'Resolving YouTube channel...' });
        const channelId = await resolveChannelId(url);

        send('progress', { message: 'Fetching episode list from RSS feed...' });
        const { channelTitle, publisher, entries } = await getChannelVideos(channelId, 4);

        if (entries.length === 0) throw new Error('No public videos found for this channel');

        send('progress', { message: `Found "${channelTitle}" — ${entries.length} episodes. Starting analysis...` });

        const episodes = [];
        for (let i = 0; i < entries.length; i++) {
            const video = entries[i];
            send('progress', { message: `[${i+1}/${entries.length}] Getting transcript: "${video.title.slice(0,50)}..."` });
            video.transcript = await getTranscript(video.videoId);
            const hasTranscript = !!video.transcript;

            send('progress', { message: `[${i+1}/${entries.length}] Analyzing with AI${hasTranscript ? ' (with transcript)' : ' (description only)'}...` });
            const analysis = await analyzeEpisode(video);

            episodes.push({
                title: video.title,
                date: video.published,
                guests: analysis.guests || '',
                url: `https://www.youtube.com/watch?v=${video.videoId}`,
                summary: analysis.summary || '',
                insights: analysis.insights || '',
                investmentIdeas: analysis.investmentIdeas || []
            });
        }

        send('complete', {
            podcast: { name: channelTitle, publisher, website: url, description: '' },
            episodes
        });
    } catch (err) {
        send('error', { message: err.message });
    }

    res.end();
});

// --- DD Companies ---

app.get('/api/companies', (req, res) => {
    const data = loadData();
    res.json(data.companies || []);
});

app.post('/api/companies', (req, res) => {
    const data = loadData();
    if (!data.companies) data.companies = [];
    const company = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
    data.companies.push(company);
    saveData(data);
    res.json(company);
});

app.put('/api/companies/:id', (req, res) => {
    const data = loadData();
    const idx = (data.companies || []).findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data.companies[idx] = { ...data.companies[idx], ...req.body };
    saveData(data);
    res.json(data.companies[idx]);
});

app.delete('/api/companies/:id', (req, res) => {
    const data = loadData();
    data.companies = (data.companies || []).filter(c => c.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// HubSpot API helper
function hubspotRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'api.hubapi.com',
            path,
            method,
            headers: {
                'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
                'Content-Type': 'application/json',
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

// HubSpot metrics endpoint
app.get('/api/hubspot', async (req, res) => {
    try {
        const [contacts, deals, dealsCount, companies, pipelines] = await Promise.all([
            hubspotRequest('/crm/v3/objects/contacts/search', 'POST', { filterGroups: [], limit: 1 }),
            hubspotRequest('/crm/v3/objects/deals?limit=100&properties=dealstage,amount,closedate,pipeline'),
            hubspotRequest('/crm/v3/objects/deals/search', 'POST', { filterGroups: [], limit: 1 }),
            hubspotRequest('/crm/v3/objects/companies/search', 'POST', { filterGroups: [], limit: 1 }),
            hubspotRequest('/crm/v3/pipelines/deals')
        ]);

        // Build stage ID -> label map
        const stageLabels = {};
        (pipelines.results || []).forEach(pipeline => {
            (pipeline.stages || []).forEach(stage => {
                stageLabels[stage.id] = stage.label;
            });
        });

        // Calculate deal metrics
        const allDeals = deals.results || [];
        const totalPipelineValue = allDeals.reduce((sum, d) => {
            const amt = parseFloat(d.properties?.amount || 0);
            return sum + amt;
        }, 0);

        const dealsByStage = {};
        allDeals.forEach(d => {
            const stageId = d.properties?.dealstage || 'unknown';
            const stage = stageLabels[stageId] || stageId;
            dealsByStage[stage] = (dealsByStage[stage] || 0) + 1;
        });

        // New contacts in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentContacts = await hubspotRequest(
            '/crm/v3/objects/contacts/search', 'POST', {
                filterGroups: [{ filters: [{ propertyName: 'createdate', operator: 'GTE', value: thirtyDaysAgo.getTime().toString() }] }],
                limit: 1
            }
        );

        res.json({
            totalContacts: contacts.total || 0,
            totalCompanies: companies.total || 0,
            totalDeals: dealsCount.total || 0,
            totalPipelineValue,
            dealsByStage,
            newContactsLast30Days: recentContacts.total || 0,
            recentDeals: allDeals.slice(0, 5).map(d => ({
                id: d.id,
                stage: stageLabels[d.properties?.dealstage] || d.properties?.dealstage || 'unknown',
                amount: parseFloat(d.properties?.amount || 0),
                closedate: d.properties?.closedate
            }))
        });
    } catch (err) {
        console.error('HubSpot API error:', err);
        res.status(500).json({ error: 'Failed to fetch HubSpot data' });
    }
});

// HubSpot pipeline stages
app.get('/api/hubspot/pipelines', async (req, res) => {
    try {
        const pipelines = await hubspotRequest('/crm/v3/pipelines/deals');
        res.json(pipelines);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch pipelines' });
    }
});

// HubSpot owner funnel endpoint
app.get('/api/hubspot/owner-funnel', async (req, res) => {
    try {
        const { period } = req.query;

        // Compute date filter from period
        const now = new Date();
        let fromMs = null;
        if (period === 'week')  fromMs = now - 7 * 86400000;
        else if (period === 'month') fromMs = now - 30 * 86400000;
        else if (period === 'ytd')   fromMs = new Date(now.getFullYear(), 0, 1).getTime();
        else if (period === 'year')  fromMs = now - 365 * 86400000;

        const filterGroups = fromMs
            ? [{ filters: [{ propertyName: 'createdate', operator: 'GTE', value: String(Math.round(fromMs)) }] }]
            : [];

        // Fetch owners list and pipelines in parallel
        const [ownersRes, pipelinesRes] = await Promise.all([
            hubspotRequest('/crm/v3/owners?limit=100'),
            hubspotRequest('/crm/v3/pipelines/deals')
        ]);

        // Build owner ID -> name map
        const ownerMap = {};
        (ownersRes.results || []).forEach(o => {
            ownerMap[String(o.id)] = [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email || String(o.id);
        });

        // Build stage ID -> label map
        const stageLabels = {};
        (pipelinesRes.results || []).forEach(pipeline => {
            (pipeline.stages || []).forEach(stage => {
                stageLabels[stage.id] = stage.label;
            });
        });

        // Paginate through all deals
        const allDeals = [];
        let after = undefined;
        do {
            const body = {
                filterGroups,
                properties: ['hubspot_owner_id', 'dealstage', 'amount', 'dealname'],
                limit: 100,
                ...(after ? { after } : {})
            };
            const page = await hubspotRequest('/crm/v3/objects/deals/search', 'POST', body);
            allDeals.push(...(page.results || []));
            after = page.paging && page.paging.next ? page.paging.next.after : undefined;
        } while (after);

        // Group by owner
        const byOwner = {};
        allDeals.forEach(deal => {
            const ownerId = String(deal.properties?.hubspot_owner_id || 'unassigned');
            const stageId = deal.properties?.dealstage || 'unknown';
            const stageName = stageLabels[stageId] || stageId;
            const amount = parseFloat(deal.properties?.amount || 0);

            if (!byOwner[ownerId]) {
                byOwner[ownerId] = { totalDeals: 0, totalValue: 0, stageBreakdown: {} };
            }
            byOwner[ownerId].totalDeals += 1;
            byOwner[ownerId].totalValue += amount;
            byOwner[ownerId].stageBreakdown[stageName] = (byOwner[ownerId].stageBreakdown[stageName] || 0) + 1;
        });

        // Format and sort by totalDeals desc
        const result = Object.entries(byOwner)
            .map(([ownerId, stats]) => ({
                ownerId,
                ownerName: ownerMap[ownerId] || ownerId,
                totalDeals: stats.totalDeals,
                totalValue: stats.totalValue,
                stageBreakdown: stats.stageBreakdown
            }))
            .sort((a, b) => b.totalDeals - a.totalDeals);

        res.json(result);
    } catch (err) {
        console.error('HubSpot owner funnel error:', err);
        res.status(500).json({ error: 'Failed to fetch owner funnel data' });
    }
});

// HubSpot deal funnel endpoint (aggregate + per-owner)
app.get('/api/hubspot/funnel', async (req, res) => {
    try {
        const { period, view } = req.query;
        const historical = view !== 'current';
        const now = new Date();
        let fromMs = null;
        if (period === 'week')  fromMs = now - 7 * 86400000;
        else if (period === 'month') fromMs = now - 30 * 86400000;
        else if (period === 'ytd')   fromMs = new Date(now.getFullYear(), 0, 1).getTime();
        else if (period === 'year')  fromMs = now - 365 * 86400000;

        const filterGroups = fromMs
            ? [{ filters: [{ propertyName: 'createdate', operator: 'GTE', value: String(Math.round(fromMs)) }] }]
            : [];

        const [pipelinesRes, ownersRes] = await Promise.all([
            hubspotRequest('/crm/v3/pipelines/deals'),
            hubspotRequest('/crm/v3/owners?limit=100')
        ]);

        // Split pipeline stages into: main funnel (before any isClosed stage),
        // exit stages (isClosed=true), and side-track stages (after an isClosed stage)
        const pipeline = (pipelinesRes.results || [])[0] || {};
        const allPipelineStages = (pipeline.stages || []).sort((a, b) => a.displayOrder - b.displayOrder);

        const funnelStages = [], sideStages = [];
        let passedClosed = false;
        allPipelineStages.forEach(s => {
            if (s.metadata?.isClosed === 'true') { passedClosed = true; return; }
            if (passedClosed) sideStages.push(s);
            else funnelStages.push(s);
        });

        const clean = name => name.replace(/\s*\([^)]*\)\s*$/, '');
        const orderedStages = funnelStages.map(s => ({ id: s.id, name: clean(s.label) }));
        const sideStageList = sideStages.map(s => ({ id: s.id, name: clean(s.label) }));
        const sideStageIds = new Set(sideStages.map(s => s.id));

        const ownerMap = {};
        (ownersRes.results || []).forEach(o => {
            ownerMap[String(o.id)] = [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email || String(o.id);
        });

        // For historical view: hs_v2_date_entered_<stageId> is non-null if a deal has EVER been in that stage.
        // For current view: we only need dealstage to see where each deal is right now.
        const enteredProps = historical ? [
            ...orderedStages.map(s => `hs_v2_date_entered_${s.id}`),
            ...sideStageList.map(s => `hs_v2_date_entered_${s.id}`)
        ] : [];

        // Paginate all deals
        const allDeals = [];
        let after;
        do {
            const body = {
                filterGroups,
                properties: ['hubspot_owner_id', 'dealstage', 'amount', ...enteredProps],
                limit: 100,
                ...(after ? { after } : {})
            };
            const page = await hubspotRequest('/crm/v3/objects/deals/search', 'POST', body);
            allDeals.push(...(page.results || []));
            after = page.paging?.next?.after;
        } while (after);

        // Build a stageIndex map for current-view cumulative counting
        const stageIndexMap = {};
        orderedStages.forEach((s, i) => { stageIndexMap[s.id] = i; });
        const sideStageIdSet = new Set(sideStageList.map(s => s.id));

        function buildFunnel(deals) {
            const total = deals.length;
            if (total === 0) return { total: 0, stages: [], parked: [] };

            let stageCounts;
            if (historical) {
                // Count deals that have EVER been in each stage
                stageCounts = orderedStages.map(s =>
                    deals.filter(d => d.properties?.[`hs_v2_date_entered_${s.id}`] != null).length
                );
            } else {
                // Count deals currently at or past each stage index (cumulative)
                stageCounts = orderedStages.map((s, i) =>
                    deals.filter(d => {
                        const idx = stageIndexMap[d.properties?.dealstage];
                        return idx !== undefined && idx >= i;
                    }).length
                );
            }

            const stages = [];
            stageCounts.forEach((count, i) => {
                if (count === 0) return;
                const prevCount = i === 0 ? total : (stageCounts[i - 1] || total);
                stages.push({
                    id: orderedStages[i].id,
                    name: orderedStages[i].name,
                    count,
                    conversionToStage: +(count / total * 100).toFixed(1),
                    nextStepConversion: prevCount > 0 ? +(count / prevCount * 100).toFixed(1) : 0
                });
            });

            // Parked (side-track) stages
            const parked = sideStageList.map(s => ({
                id: s.id,
                name: s.name,
                count: historical
                    ? deals.filter(d => d.properties?.[`hs_v2_date_entered_${s.id}`] != null).length
                    : deals.filter(d => d.properties?.dealstage === s.id).length
            })).filter(s => s.count > 0);

            return { total, stages, parked };
        }

        const aggregate = buildFunnel(allDeals);

        const byOwnerMap = {};
        allDeals.forEach(d => {
            const id = String(d.properties?.hubspot_owner_id || 'unassigned');
            if (!byOwnerMap[id]) byOwnerMap[id] = [];
            byOwnerMap[id].push(d);
        });

        const byOwner = Object.entries(byOwnerMap)
            .map(([ownerId, deals]) => ({ ownerId, ownerName: ownerMap[ownerId] || ownerId, ...buildFunnel(deals) }))
            .sort((a, b) => b.total - a.total);

        res.json({ aggregate, byOwner });
    } catch (err) {
        console.error('HubSpot funnel error:', err);
        res.status(500).json({ error: 'Failed to fetch funnel data' });
    }
});

// Deal drilldown — deals behind a funnel stage count
app.get('/api/hubspot/funnel/deals', async (req, res) => {
    try {
        const { stageId, view, period, ownerId } = req.query;
        const historical = view !== 'current';

        const now = new Date();
        let fromMs = null;
        if (period === 'week')  fromMs = now - 7 * 86400000;
        else if (period === 'month') fromMs = now - 30 * 86400000;
        else if (period === 'ytd')   fromMs = new Date(now.getFullYear(), 0, 1).getTime();
        else if (period === 'year')  fromMs = now - 365 * 86400000;

        const filterGroups = fromMs
            ? [{ filters: [{ propertyName: 'createdate', operator: 'GTE', value: String(Math.round(fromMs)) }] }]
            : [];

        const [pipelinesRes, ownersRes] = await Promise.all([
            hubspotRequest('/crm/v3/pipelines/deals'),
            hubspotRequest('/crm/v3/owners?limit=100')
        ]);

        const ownerMap = {};
        (ownersRes.results || []).forEach(o => {
            ownerMap[String(o.id)] = [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email || String(o.id);
        });

        const pipeline = (pipelinesRes.results || [])[0] || {};
        const allPipelineStages = (pipeline.stages || []).sort((a, b) => a.displayOrder - b.displayOrder);
        const stageLabels = {};
        allPipelineStages.forEach(s => { stageLabels[s.id] = s.label; });

        const funnelStages = [];
        const sideStageIdSet = new Set();
        let passedClosed = false;
        allPipelineStages.forEach(s => {
            if (s.metadata?.isClosed === 'true') { passedClosed = true; return; }
            if (passedClosed) sideStageIdSet.add(s.id);
            else funnelStages.push(s);
        });

        const stageIndexMap = {};
        funnelStages.forEach((s, i) => { stageIndexMap[s.id] = i; });
        const targetStageIndex = stageIndexMap[stageId] ?? -1;
        const isParked = sideStageIdSet.has(stageId);

        const enteredProp = `hs_v2_date_entered_${stageId}`;
        const props = ['dealname', 'amount', 'dealstage', 'hubspot_owner_id', 'closedate', 'createdate'];
        if (historical && stageId !== '__all__') props.push(enteredProp);

        // Paginate all deals
        const allDeals = [];
        let after;
        do {
            const body = {
                filterGroups,
                properties: props,
                limit: 100,
                ...(after ? { after } : {})
            };
            const page = await hubspotRequest('/crm/v3/objects/deals/search', 'POST', body);
            allDeals.push(...(page.results || []));
            after = page.paging?.next?.after;
        } while (after);

        // Filter to the clicked stage
        let filtered;
        if (stageId === '__all__') {
            filtered = allDeals;
        } else if (isParked) {
            filtered = historical
                ? allDeals.filter(d => d.properties?.[enteredProp] != null)
                : allDeals.filter(d => d.properties?.dealstage === stageId);
        } else if (historical) {
            filtered = allDeals.filter(d => d.properties?.[enteredProp] != null);
        } else {
            // Current cumulative: at or past this stage index
            filtered = allDeals.filter(d => {
                const idx = stageIndexMap[d.properties?.dealstage];
                return idx !== undefined && idx >= targetStageIndex;
            });
        }

        // Filter by owner if specified
        if (ownerId) {
            filtered = filtered.filter(d => String(d.properties?.hubspot_owner_id || 'unassigned') === ownerId);
        }

        const deals = filtered.map(d => ({
            id: d.id,
            name: d.properties?.dealname || '(no name)',
            amount: parseFloat(d.properties?.amount || 0),
            stage: stageLabels[d.properties?.dealstage] || d.properties?.dealstage || 'unknown',
            owner: ownerMap[String(d.properties?.hubspot_owner_id)] || '—',
            closeDate: d.properties?.closedate || null,
            createdAt: d.properties?.createdate || null
        })).sort((a, b) => b.amount - a.amount);

        res.json({ deals, total: deals.length });
    } catch (err) {
        console.error('HubSpot funnel deals error:', err);
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
});

// --- DD Document Analysis ---

function callClaudeWithContent(contentArray) {
    return new Promise((resolve, reject) => {
        if (!process.env.ANTHROPIC_API_KEY) {
            return reject(new Error('ANTHROPIC_API_KEY not set in .env'));
        }
        const body = JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            messages: [{ role: 'user', content: contentArray }]
        });
        const req = https.request({
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) return reject(new Error(parsed.error.message));
                    resolve(parsed.content[0].text);
                } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.setTimeout(120000, () => { req.destroy(); reject(new Error('Claude API timeout')); });
        req.write(body);
        req.end();
    });
}

const DD_ANALYSIS_PROMPT = `You are an experienced investment analyst performing due diligence on a company document. Extract all relevant information and return ONLY valid JSON (no markdown, no explanation) with this exact structure:

{
  "name": "Company name",
  "website": "Company website URL if mentioned, else empty string",
  "description": "2-3 sentence business description: what they do, business model, key differentiators",
  "documentSummary": "3-5 sentence investment-oriented summary of the document: key findings, financial highlights, strategic context",
  "investmentThesis": "2-3 sentence bull case: why this could be a good investment, competitive advantages, growth drivers",
  "keyRisks": "- Risk 1\\n- Risk 2\\n- Risk 3\\n(3-6 bullet points covering the main investment risks)",
  "years": ["Year label 1", "Year label 2", "Year label 3"],
  "revenue": [null, null, null],
  "ebitda": [null, null, null],
  "grossProfit": [null, null, null],
  "netIncome": [null, null, null],
  "sga": [null, null, null],
  "customerMetrics": {
    "nrr": null,
    "grr": null,
    "logoChurnRate": null,
    "revenueChurnRate": null,
    "top1CustomerPct": null,
    "top3CustomerPct": null,
    "top5CustomerPct": null,
    "top10CustomerPct": null,
    "customerCount": null,
    "arpu": null,
    "ltvCacRatio": null,
    "cacPaybackMonths": null,
    "ruleOf40": null,
    "expansionRevenuePct": null,
    "cohortInsights": "",
    "valueChurnByYear": [],
    "logoChurnByYear": [],
    "cohortNRR": [],
    "customerCohortRows": [],
    "cohortTableData": []
  },
  "balanceSheet": {
    "cash": [null, null, null],
    "accountsReceivable": [null, null, null],
    "inventory": [null, null, null],
    "totalCurrentAssets": [null, null, null],
    "totalAssets": [null, null, null],
    "accountsPayable": [null, null, null],
    "shortTermDebt": [null, null, null],
    "totalCurrentLiabilities": [null, null, null],
    "longTermDebt": [null, null, null],
    "totalLiabilities": [null, null, null],
    "totalEquity": [null, null, null]
  }
}

Rules for financial data:
- years: use actual year labels like "FY2022", "FY2023", "FY2024" or "2022A", "2023A", "2024E" etc. If only 1 or 2 years found, set remaining to empty string
- All financial values in the arrays must be numbers (not strings) representing the actual dollar/currency amount, or null if not found
- revenue, ebitda, grossProfit, netIncome, sga: arrays of 3 values [oldest, middle, latest] - use null for any not found
- If document uses millions, convert: e.g. "$5.2M" → 5200000
- If document uses thousands, convert: e.g. "$5,200k" → 5200000
- EBITDA: if not explicitly stated, do not calculate it — leave null
- Extract gross profit = revenue minus cost of goods/services if stated
- SG&A = selling, general & administrative expenses if stated
- Be conservative: only extract numbers explicitly stated, don't guess

Rules for customerMetrics — IMPORTANT: actively calculate these from raw data in the document, do not just look for pre-labeled metrics:
- nrr: Net Revenue Retention %. If you have per-customer revenue across two periods, calculate: (revenue from customers present in both periods, including growth) / (prior period total revenue) × 100
- grr: Gross Revenue Retention %. Calculate: (revenue retained from prior-period customers, capped at prior amount, no expansion) / prior period total × 100. Maximum 100.
- logoChurnRate: % of customers from prior period not present in current period. Calculate from customer lists if available.
- revenueChurnRate: % of prior period revenue from customers who churned (not present in latest period).
- top1CustomerPct / top3CustomerPct / top5CustomerPct / top10CustomerPct: CALCULATE THESE from raw customer revenue data if present. Sum total revenue, divide top N customers' revenue by total. Express as percentage (e.g. 23.5 for 23.5%). Use the most recent year available.
- customerCount: count of unique active customers in the most recent period
- arpu: total revenue / customer count for most recent period (annualise if monthly)
- ltvCacRatio: LTV:CAC ratio if stated or calculable
- cacPaybackMonths: CAC payback in months
- ruleOf40: revenue growth % + EBITDA margin % if calculable
- expansionRevenuePct: % of revenue growth from existing customers expanding
- cohortInsights: describe what the data shows about retention, concentration risk, customer growth trends
- valueChurnByYear: CALCULATE from multi-year customer data. For each year pair, identify customers present in year N but absent in year N+1, sum their revenue = churned value. Format: [{"year":"FY2023","churned":500000,"churnRatePct":8.5}]. Use actual dollar amounts. Include ALL years where you can calculate this.
- logoChurnByYear: CALCULATE from multi-year customer lists. Count customers in year N missing from year N+1. Format: [{"year":"FY2023","logosLost":12,"churnRatePct":6.0}]. Include ALL years calculable.
- cohortNRR: if you have per-customer revenue data across multiple years, calculate NRR for top 10 customers as a cohort: for each period, (their total revenue) / (their first-period revenue) × 100. Format: [{"period":"FY2022","nrr":100},{"period":"FY2023","nrr":108},{"period":"FY2024","nrr":115}]
- Set to null/[] only if truly not calculable — always try to compute from raw data first

Rules for balanceSheet — extract from any balance sheet tab or section, aligned to the same year order as the P&L arrays above:
- cash: cash and cash equivalents (or "cash & short-term investments")
- accountsReceivable: trade receivables / accounts receivable, net
- inventory: inventory / stock on hand (null if service business)
- totalCurrentAssets: total current assets
- totalAssets: total assets
- accountsPayable: accounts payable / trade payables
- shortTermDebt: short-term borrowings, current portion of long-term debt, revolving credit
- totalCurrentLiabilities: total current liabilities
- longTermDebt: long-term debt, notes payable, term loans (non-current portion only)
- totalLiabilities: total liabilities
- totalEquity: total shareholders' equity / stockholders' equity / net assets
- All values as raw numbers in the document's native currency. null if not found.
- If balance sheet covers different periods than the P&L, align to the closest matching year and leave others null`;

app.post('/api/dd/analyze-document', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { mimetype, buffer, originalname } = req.file;
    let contentArray;

    try {
        if (mimetype === 'application/pdf') {
            // Use Claude's native PDF support
            contentArray = [
                {
                    type: 'document',
                    source: {
                        type: 'base64',
                        media_type: 'application/pdf',
                        data: buffer.toString('base64')
                    }
                },
                { type: 'text', text: DD_ANALYSIS_PROMPT }
            ];
        } else {
            // Extract text from DOCX, Excel, or plain text
            let text;
            if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                originalname.endsWith('.docx')) {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value;
            } else if (
                mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                mimetype === 'application/vnd.ms-excel' ||
                originalname.endsWith('.xlsx') || originalname.endsWith('.xls')
            ) {
                const workbook = XLSX.read(buffer, { type: 'buffer' });
                text = workbook.SheetNames.map(name => {
                    const sheet = workbook.Sheets[name];
                    return `=== Sheet: ${name} ===\n${XLSX.utils.sheet_to_csv(sheet)}`;
                }).join('\n\n');
            } else {
                text = buffer.toString('utf8');
            }
            if (!text.trim()) return res.status(400).json({ error: 'Could not extract text from file' });
            // Limit text to ~100k chars to stay within token limits
            const trimmed = text.length > 100000 ? text.slice(0, 100000) + '\n...[truncated]' : text;
            contentArray = [
                { type: 'text', text: `DOCUMENT CONTENT:\n\n${trimmed}\n\n---\n\n${DD_ANALYSIS_PROMPT}` }
            ];
        }

        const raw = await callClaudeWithContent(contentArray);
        const clean = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
        const analysis = JSON.parse(clean);
        analysis.sourceFile = originalname;
        res.json(analysis);
    } catch (err) {
        console.error('DD analyze-document error:', err);
        res.status(500).json({ error: err.message || 'Analysis failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Todo Board running at http://localhost:${PORT}`);
});
