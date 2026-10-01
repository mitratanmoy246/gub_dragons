const $ = id => document.getElementById(id);

const state = {
    data: {},
    activity: [],
    activityFilter: "all",
    achievementFilter: "all"
};

function getShortName(name) {
    if (name.includes("Anikur")) return "Anik";
    if (name.includes("Abdul Kayum") || name.includes("Kayum")) return "Kayum";
    if (name.includes("Tanmoy")) return "Tanmoy";
    return name.split(" ")[0];
}

function esc(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function rating(value) { return (value === null || value === undefined || !Number(value)) ? "—" : Number(value).toLocaleString(); }
function stars(value) { const n = getCCStars(value); return !n ? "—" : "★".repeat(n); }
function formatRank(value) { return (value === null || value === undefined) ? "—" : `#${Number(value).toLocaleString()}`; }
function formatDate(timestamp) { return new Date(timestamp).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); }
function formatTime(timestamp) { return new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }); }
function setText(id, value) { const el = $(id); if (el) el.textContent = value; }
function setChartState(id, text, hide = false) {
    const el = $(id);
    if (!el) return;
    el.innerHTML = hide ? "" : `<i></i>${esc(text)}`;
    el.style.display = hide ? "none" : "";
}

function hasCFData(data) { return teamMembers.some(member => data[member.id]?.cf?.history?.length > 0); }
function hasCCData(data) { return teamMembers.some(member => member.showCC === true && data[member.id]?.cc?.history?.length > 0); }

// ---------------------------------------------------------
// PUBLIC UI RENDERING
// ---------------------------------------------------------

function renderOperators(data = {}) {
    const grid = $("teamGrid");
    if (!grid) return;
    grid.innerHTML = teamMembers.map((member, index) => {
        const d = data[member.id] || {};
        const cf = d.cf || {};
        const cc = d.cc || {};
        const ccVisible = member.showCC === true;
        return `
            <article class="operator-card" style="--member:${member.color}">
                <div class="operator-head">
                    <div class="operator-index">${String(index + 1).padStart(2, "0")}</div>
                    <div class="operator-role">${esc(member.role)}</div>
                </div>
                <div class="operator-name">${esc(member.name)}</div>
                <div class="operator-code">ID // ${esc(member.id)}</div>
                <div class="operator-ratings">
                    <div class="rating-box"><span>CF MAX</span><strong>${rating(cf.max)}</strong></div>
                    <div class="rating-box"><span>CC MAX</span><strong class="${ccVisible ? "" : "hidden-value"}">${ccVisible ? rating(cc.max) : "HIDDEN"}</strong></div>
                    <div class="rating-box"><span>CF CURRENT</span><strong>${rating(cf.current)}</strong></div>
                    <div class="rating-box"><span>CC CURRENT</span><strong class="${ccVisible ? "" : "hidden-value"}">${ccVisible ? rating(cc.current) : "HIDDEN"}</strong></div>
                </div>
                <div class="operator-platforms">
                    <div><span>CODEFORCES</span><b>${esc(member.publicCf || member.cf)}</b></div>
                    ${ccVisible ? `<div><span>CODECHEF</span><b>${member.cc ? esc(member.cc) : "PRIVATE"}</b></div>` : `<div class="platform-hidden"><span>CODECHEF</span><b>DATA HIDDEN</b></div>`}
                </div>
                <div class="operator-accent"></div>
            </article>
        `;
    }).join("");
}

function renderSnapshot(data = {}) {
    const grid = $("snapshotGrid");
    if (!grid) return;
    grid.innerHTML = teamMembers.map(member => {
        const d = data[member.id] || {};
        const cf = d.cf || {};
        const cc = d.cc || {};
        const ccVisible = member.showCC === true;
        return `
            <div class="snapshot-card" style="--member:${member.color}">
                <div class="snapshot-top"><span>${esc(getShortName(member.name))}</span><i></i></div>
                <div class="snapshot-values">
                    <div><small>CF</small><strong>${rating(cf.current)}</strong></div>
                    <div><small>CC</small><strong class="${ccVisible ? "" : "hidden-value"}">${ccVisible ? rating(cc.current) : "HIDDEN"}</strong></div>
                </div>
                <div class="snapshot-foot">
                    <span>CF MAX ${rating(cf.max)}</span>
                    <span>${ccVisible ? `CC ${stars(cc.current)}` : "CC PRIVATE"}</span>
                </div>
            </div>
        `;
    }).join("");
}

function renderAchievements() {
    const grid = $("achievementGrid");
    if (!grid) return;
    const filter = state.achievementFilter;
    const filtered = achievements.filter(item => filter === "all" || item.type === filter);
    grid.innerHTML = filtered.map((item, index) => {
        const media = item.image ? `<div class="achievement-media"><img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('image-missing');"><div class="image-fallback">IMAGE UNAVAILABLE</div></div>` : `<div class="achievement-media image-missing"><div class="image-fallback">ARCHIVE IMAGE UNAVAILABLE</div></div>`;
        return `
            <article class="achievement-card">
                ${media}
                <div class="achievement-content">
                    <div class="achievement-index">ARCHIVE // ${String(index + 1).padStart(2, "0")}</div>
                    <h3>${esc(item.title)}</h3>
                    <div class="achievement-place">${esc(item.place)}</div>
                    <div class="achievement-meta">${esc(item.teams)}</div>
                    <div class="achievement-team">${esc(item.team)}</div>
                    <div class="achievement-members">${esc(item.members)}</div>
                </div>
            </article>
        `;
    }).join("");
    setText("achievementCount", String(achievements.length).padStart(2, "0"));
}

function renderStats() {
    setText("statOperators", String(teamMembers.length).padStart(2, "0"));
    setText("statCore", String(teamMembers.filter(x => x.role === "CORE").length).padStart(2, "0"));
    setText("heroOperators", String(teamMembers.length).padStart(2, "0"));
}

function collectActivity(data) {
    const list = [];
    teamMembers.forEach(member => {
        const d = data[member.id] || {};
        const cf = d.cf?.history || [];
        const cc = member.showCC === true ? d.cc?.history || [] : [];
        cf.forEach(item => { list.push({ type: "cf", member, contestName: item.contestName, time: item.time, rating: item.rating, oldRating: item.oldRating, delta: item.oldRating == null ? null : item.rating - item.oldRating, rank: item.rank }); });
        cc.forEach(item => { list.push({ type: "cc", member, contestName: item.contestName, time: item.time, rating: item.rating, oldRating: item.oldRating, delta: item.oldRating == null ? null : item.rating - item.oldRating, rank: item.rank }); });
    });
    list.sort((a, b) => b.time - a.time);
    state.activity = list;
}

function renderActivity() {
    const grid = $("activityList");
    if (!grid) return;
    const filter = state.activityFilter;
    const filtered = state.activity.filter(item => filter === "all" || item.type === filter).slice(0, 12);
    if (!filtered.length) { grid.innerHTML = `<div class="empty-state">NO CONTEST ACTIVITY AVAILABLE</div>`; return; }
    grid.innerHTML = filtered.map(item => {
        const delta = item.delta;
        const deltaClass = delta === null ? "" : delta >= 0 ? "positive" : "negative";
        const deltaText = delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta}`;
        return `
            <div class="activity-row" style="--member:${item.member.color}">
                <div class="activity-platform ${item.type}">${item.type === "cf" ? "CF" : "CC"}</div>
                <div class="activity-main">
                    <strong>${esc(item.contestName)}</strong>
                    <span>${esc(getShortName(item.member.name))} // ${formatDate(item.time)}</span>
                </div>
                <div class="activity-rating"><span>RATING</span><b>${rating(item.rating)}</b></div>
                <div class="activity-delta"><span>DELTA</span><b class="${deltaClass}">${deltaText}</b></div>
                <div class="activity-rank"><span>RANK</span><b>${formatRank(item.rank)}</b></div>
            </div>
        `;
    }).join("");
}

function renderTeamAnalytics(data) {
    const cfValues = teamMembers.map(member => ({ member, value: Number(data[member.id]?.cf?.current) || 0 })).filter(x => x.value > 0);
    const ccValues = teamMembers.filter(member => member.showCC === true).map(member => ({ member, value: Number(data[member.id]?.cc?.current) || 0 })).filter(x => x.value > 0);
    renderBars("teamCFBars", cfValues, 3000);
    renderBars("teamCCBars", ccValues, 3000);
    if (cfValues.length) { const avg = cfValues.reduce((sum, x) => sum + x.value, 0) / cfValues.length; setText("teamCFCurrent", Math.round(avg).toLocaleString()); }
    if (ccValues.length) { const avg = ccValues.reduce((sum, x) => sum + x.value, 0) / ccValues.length; setText("teamCCCurrent", Math.round(avg).toLocaleString()); }
}

function renderBars(id, values, max) {
    const el = $(id);
    if (!el) return;
    if (!values.length) { el.innerHTML = `<div class="empty-state">DATA UNAVAILABLE</div>`; return; }
    el.innerHTML = values.map(item => {
        const width = Math.min(100, item.value / max * 100);
        return `
            <div class="team-bar" style="--member:${item.member.color}">
                <div class="team-bar-label"><span>${esc(getShortName(item.member.name))}</span><b>${rating(item.value)}</b></div>
                <div class="team-bar-track"><i style="width:${width}%"></i></div>
            </div>
        `;
    }).join("");
}

function renderMilestones(data) {
    let cfContests = 0; let ccContests = 0; let totalContests = 0;
    teamMembers.forEach(member => {
        const d = data[member.id] || {};
        cfContests += (d.cf?.history || []).length;
        if (member.showCC === true) ccContests += (d.cc?.history || []).length;
    });
    totalContests = cfContests + ccContests;
    const peakCF = Math.max(0, ...teamMembers.map(m => Number(data[m.id]?.cf?.max) || 0));
    const peakCC = Math.max(0, ...teamMembers.filter(x => x.showCC === true).map(m => Number(data[m.id]?.cc?.max) || 0));
    const values = [
        { value: teamMembers.length, label: "ACTIVE OPERATORS", code: "PERSONNEL" },
        { value: totalContests, label: "CONTEST ENTRIES", code: "ACTIVITY" },
        { value: peakCF, label: "HIGHEST CF PEAK", code: "RATING" },
        { value: peakCC, label: "HIGHEST CC PEAK", code: "RATING" },
        { value: achievements.length, label: "VERIFIED RECORDS", code: "ARCHIVE" }
    ];
    const grid = $("milestoneGrid");
    if (!grid) return;
    grid.innerHTML = values.map((item, index) => `
        <div class="milestone-card">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <strong>${Number(item.value).toLocaleString()}</strong>
            <b>${esc(item.label)}</b>
            <small>${esc(item.code)}</small>
        </div>
    `).join("");
}

function renderCF(data) {
    if (!hasCFData(data)) return;
    setChartState("cfChartState", "", true);
    requestAnimationFrame(() => renderCFChart("cfChart", teamMembers, data));
}

function renderCC(data) {
    if (!hasCCData(data)) return;
    setChartState("ccChartState", "", true);
    requestAnimationFrame(() => renderCCChart("ccChart", teamMembers, data));
}

function renderEverything() {
    renderOperators(state.data);
    renderSnapshot(state.data);
    renderStats();
    renderTeamAnalytics(state.data);
    collectActivity(state.data);
    renderActivity();
    renderMilestones(state.data);
}

function bindFilters() {
    document.querySelectorAll("[data-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("[data-filter]").forEach(x => x.classList.remove("active"));
            btn.classList.add("active");
            state.activityFilter = btn.dataset.filter;
            renderActivity();
        });
    });
    document.querySelectorAll("[data-achievement-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("[data-achievement-filter]").forEach(x => x.classList.remove("active"));
            btn.classList.add("active");
            state.achievementFilter = btn.dataset.achievementFilter;
            renderAchievements();
        });
    });
}

function startClock() {
    const tick = () => { setText("liveClock", new Date().toLocaleTimeString(undefined, { hour12: false })); };
    tick();
    setInterval(tick, 1000);
}

function setSystemState(text, bad = false) {
    setText("systemState", text);
    const light = document.querySelector(".state-light");
    if (light) light.classList.toggle("bad", bad);
}

function setAPIState(id, text, bad = false) {
    const el = $(id);
    if (!el) return;
    el.innerHTML = `<i class="${bad ? "bad" : ""}"></i>${esc(text)}`;
}

async function boot() {
    const progress = $("bootProgress");
    const text = $("bootText");
    const steps = [
        "LOADING GUB_DRAGONS CORE...",
        "MOUNTING OPERATOR DATABASE...",
        "CONNECTING CODEFORCES...",
        "CONNECTING CODECHEF...",
        "BUILDING TELEMETRY...",
        "VERIFYING ARCHIVE...",
        "SYSTEM ONLINE"
    ];

    for (let i = 0; i < steps.length; i++) {
        if (text) text.textContent = steps[i];
        if (progress) progress.style.width = `${((i + 1) / steps.length) * 100}%`;
        await new Promise(res => setTimeout(res, i === steps.length - 1 ? 180 : 120));
    }

    const bootScreen = $("bootScreen");
    if (bootScreen) {
        bootScreen.classList.add("boot-complete");
        setTimeout(() => bootScreen.remove(), 500);
    }
}

async function init() {
    startClock();
    bindFilters();
    renderAchievements();
    renderEverything();

    setChartState("cfChartState", "BUILDING");
    setChartState("ccChartState", "BUILDING");
    setSystemState("SYNCING");
    setAPIState("cfSystemStatus", "SYNCING");
    setAPIState("ccSystemStatus", "SYNCING");

    try {
        await loadAllData(teamMembers, update => {
            if (!update) return;
            if (update.data) Object.assign(state.data, update.data);
            renderEverything();

            if (update.type === "cf") { if (hasCFData(state.data)) renderCF(state.data); }
            if (update.type === "cc") { if (hasCCData(state.data)) renderCC(state.data); }

            if (update.type === "cf-complete") {
                if (hasCFData(state.data)) {
                    renderCF(state.data);
                    setAPIState("cfSystemStatus", "ONLINE");
                } else {
                    setChartState("cfChartState", "DATA UNAVAILABLE");
                    setAPIState("cfSystemStatus", "UNAVAILABLE", true);
                }
            }

            if (update.type === "cc-complete") {
                if (hasCCData(state.data)) {
                    renderCC(state.data);
                    setAPIState("ccSystemStatus", "ONLINE");
                } else {
                    setChartState("ccChartState", "DATA UNAVAILABLE");
                    setAPIState("ccSystemStatus", "UNAVAILABLE", true);
                }
            }
        });

        renderEverything();

        if (hasCFData(state.data)) renderCF(state.data);
        else setChartState("cfChartState", "DATA UNAVAILABLE");

        if (hasCCData(state.data)) renderCC(state.data);
        else setChartState("ccChartState", "CODECHEF DATA UNAVAILABLE");

        setSystemState("SYSTEM ONLINE");
        setText("lastSync", new Date().toLocaleTimeString(undefined, { hour12: false }));

    } catch (err) {
        console.error("GUB_Dragons initialization failed:", err);
        setSystemState("PARTIAL SYSTEM", true);
        setAPIState("cfSystemStatus", "ERROR", true);
        setAPIState("ccSystemStatus", "ERROR", true);
        setChartState("cfChartState", "INITIALIZATION ERROR");
        setChartState("ccChartState", "INITIALIZATION ERROR");
    }
}

// Ensure boot error destroys loading screen
boot().then(init).catch(err => {
    console.error("Boot Sequence Failed:", err);
    const bs = $("bootScreen");
    if(bs) bs.style.display = "none";
});

// =========================================================
//  SECURE VAULT LOGIC (CF INTERNAL COMMAND CENTER + PRO MAX)
// =========================================================

const vaultBtn = $("vaultBtn");
const vaultOverlay = $("vaultOverlay");
const vaultLogin = $("vaultLogin");
const vaultContent = $("vaultContent");
const vaultPin = $("vaultPin");
const vaultSubmit = $("vaultSubmit");
const vaultClose = $("vaultClose");
const vaultLogout = $("vaultLogout");
const vaultError = $("vaultError");

const VAULT_CODES = { "55": "Tanmoy Mitra", "93": "Abdul Kayum", "104": "Anikur Rahman" };

let vaultCacheTime = 0;
let vaultCacheData = null;

vaultBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    vaultOverlay.classList.remove("hidden");
    
    // Persistent Session Check
    const savedAuth = localStorage.getItem("gd_vault_session");
    if (savedAuth && VAULT_CODES[savedAuth]) {
        openVault(VAULT_CODES[savedAuth]);
    } else {
        localStorage.removeItem("gd_vault_session");
        vaultLogin.classList.remove("hidden");
        vaultContent.classList.add("hidden");
        vaultPin.value = "";
        vaultError.textContent = "";
    }
});

vaultClose?.addEventListener("click", () => {
    vaultOverlay.classList.add("hidden");
});

vaultLogout?.addEventListener("click", () => {
    localStorage.removeItem("gd_vault_session");
    vaultContent.classList.add("hidden");
    vaultLogin.classList.remove("hidden");
    vaultPin.value = "";
    vaultError.textContent = "";
});

vaultSubmit?.addEventListener("click", async () => {
    const pin = vaultPin.value.trim();
    if (VAULT_CODES[pin]) {
        localStorage.setItem("gd_vault_session", pin);
        await openVault(VAULT_CODES[pin]);
    } else {
        vaultError.textContent = "ACCESS DENIED";
    }
});

vaultPin?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") vaultSubmit.click();
});

document.querySelectorAll(".vault-nav button").forEach(btn => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll(".vault-nav button").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".vault-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        $(`vPanel-${btn.dataset.vtab}`).classList.add("active");
        
        if(btn.dataset.vtab === "analyzer" && vaultCacheData) {
            const activeAnalyzerTab = document.querySelector(".analyzer-subnav button.active");
            const tabName = activeAnalyzerTab ? activeAnalyzerTab.dataset.atab : "team";
            renderAnalyzerTab(tabName, vaultCacheData);
        }
    });
});

async function openVault(currentUser) {
    try {
        const currentMember = teamMembers.find(m => m.name === currentUser);
        if (!currentMember) {
            localStorage.removeItem("gd_vault_session");
            vaultLogin.classList.remove("hidden");
            vaultContent.classList.add("hidden");
            return;
        }

        vaultLogin.classList.add("hidden");
        vaultContent.classList.remove("hidden");
        $("vaultOpName").textContent = `OPERATOR: ${getShortName(currentMember.name).toUpperCase()}`;

        if (Date.now() - vaultCacheTime > 300000 || !vaultCacheData) { 
            $("vaultTbody").innerHTML = `<tr><td colspan='7' style='text-align:center; padding: 40px;'>SYNCING SECURE DATA...</td></tr>`;
            $("vaultStatsGrid").innerHTML = `<div class="vault-stat-box" style="text-align:center; grid-column:1/-1;">SYNCING INTELLIGENCE NETWORK...</div>`;
            $("vaultTimeline").innerHTML = `<div style="text-align:center; color:var(--dim);">SYNCING...</div>`;
            $("analyzerBody").innerHTML = `<div style="text-align:center; color:var(--dim); padding:20px;">SYNCING PRO MAX ANALYZER...</div>`;
            
            const results = [];
            for(let m of teamMembers) {
                const handleToFetch = m.privateCf ? m.privateCf : (m.publicCf || m.cf);
                const data = await loadCFStatus(handleToFetch);
                results.push({ member: m.name, shortName: getShortName(m.name), data: data });
                await new Promise(r => setTimeout(r, 600)); 
            }

            vaultCacheData = compileVaultData(results);
            vaultCacheTime = Date.now();
        }

        renderVaultDashboard(currentUser, vaultCacheData);
        setupAnalyzerNav();
        
    } catch (err) {
        console.error("Vault Error:", err);
        $("vaultTbody").innerHTML = `<tr><td colspan='7' style='text-align:center; padding: 40px; color:var(--red);'>A CRITICAL ERROR OCCURRED WHILE FETCHING VAULT DATA.</td></tr>`;
    }
}

function compileVaultData(results) {
    const problems = {};
    const timeline = [];
    const users = {};
    const team = {
        totalSubs: 0, totalAC: 0, tags: {}, ratings: {}, unsolvedQ: new Set(),
        solvedAll: 0, shared: 0, unique: 0
    };

    teamMembers.forEach(m => {
        const sName = getShortName(m.name);
        users[sName] = {
            name: m.name, shortName: sName,
            totalSubs: 0, verdicts: {}, languages: {}, tags: {}, ratings: {}, 
            attemptsToAC: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6+": 0 }, 
            performance: [], solvedSet: new Set(), attemptedSet: new Set()
        };
    });
    
    results.forEach(res => {
        const sName = res.shortName;
        const sortedData = [...res.data].sort((a,b) => a.creationTimeSeconds - b.creationTimeSeconds);
        const u = users[sName];

        const localAttempts = {}; 

        sortedData.forEach(sub => {
            if (!sub.problem) return;
            const probId = sub.problem.contestId ? `${sub.problem.contestId}${sub.problem.index}` : sub.problem.name;
            const isAC = sub.verdict === "OK";
            const rating = sub.problem.rating || 0;
            
            if (!problems[probId]) {
                problems[probId] = { id: probId, name: sub.problem.name, rating: rating, solves: {}, latestSubmitter: "", latestVerdict: "", latestTime: 0 };
                teamMembers.forEach(m => problems[probId].solves[getShortName(m.name)] = false);
            }
            
            if (isAC) problems[probId].solves[sName] = true;
            if (sub.creationTimeSeconds > problems[probId].latestTime) {
                problems[probId].latestTime = sub.creationTimeSeconds;
                problems[probId].latestSubmitter = sName;
                problems[probId].latestVerdict = sub.verdict;
            }
            timeline.push({ shortName: sName, probId, name: sub.problem.name, verdict: sub.verdict, time: sub.creationTimeSeconds * 1000, rating });

            u.totalSubs++;
            team.totalSubs++;
            
            const safeVerdict = sub.verdict || "UNKNOWN";
            u.verdicts[safeVerdict] = (u.verdicts[safeVerdict] || 0) + 1;
            
            const lang = sub.programmingLanguage || "Unknown";
            u.languages[lang] = (u.languages[lang] || 0) + 1;
            
            u.attemptedSet.add(probId);
            
            if (!u.solvedSet.has(probId)) {
                localAttempts[probId] = (localAttempts[probId] || 0) + 1;
                if (isAC) {
                    u.solvedSet.add(probId);
                    let tries = localAttempts[probId];
                    if (tries > 6) tries = "6+";
                    else tries = tries.toString();
                    u.attemptsToAC[tries]++;
                    
                    if (rating > 0) {
                        u.ratings[rating] = (u.ratings[rating] || 0) + 1;
                        team.ratings[rating] = (team.ratings[rating] || 0) + 1;
                        u.performance.push({x: rating, y: sub.timeConsumedMillis});
                    }
                    if (sub.problem.tags) {
                        sub.problem.tags.forEach(t => {
                            u.tags[t] = (u.tags[t] || 0) + 1;
                            team.tags[t] = (team.tags[t] || 0) + 1;
                        });
                    }
                }
            }
        });
    });

    timeline.sort((a, b) => b.time - a.time);

    const unsolvedMap = {}; 
    const probArray = Object.values(problems).sort((a, b) => b.latestTime - a.latestTime);

    probArray.forEach(p => {
        let solveCount = 0;
        let attemptedBy = [];
        let solvedBy = [];

        teamMembers.forEach(m => {
            const mShort = getShortName(m.name);
            if (p.solves[mShort]) { solveCount++; solvedBy.push(mShort); }
            if (users[mShort].attemptedSet.has(p.id)) attemptedBy.push(mShort);
        });

        if (solveCount > 0) team.totalAC++;
        if (solveCount === 1) team.unique++;
        if (solveCount === 2) team.shared++;
        if (solveCount === 3) team.solvedAll++;

        if (attemptedBy.length > 0 && solveCount < teamMembers.length) {
            unsolvedMap[p.id] = { id: p.id, name: p.name, rating: p.rating, attemptedBy, solvedBy };
        }
    });

    return { problems: probArray, timeline: timeline.slice(0, 100), users, team, unsolvedMap };
}

function renderVaultDashboard(currentUser, data) {
    const { problems, timeline, team } = data;

    $("vaultStatsGrid").innerHTML = `
        <div class="vault-stat-box"><span>PROBLEMS TRACKED</span><strong>${problems.length}</strong></div>
        <div class="vault-stat-box"><span>TEAM SOLVED</span><strong class="green-text">${team.totalAC}</strong></div>
        <div class="vault-stat-box"><span>UNIQUE SOLVES</span><strong class="blue-text">${team.unique}</strong></div>
        <div class="vault-stat-box"><span>COMMON KNOWLEDGE</span><strong>${team.solvedAll}</strong></div>
    `;

    $("vaultTimeline").innerHTML = timeline.map(t => {
        const vClass = t.verdict === "OK" ? "green" : (t.verdict === "WRONG_ANSWER" || t.verdict === "TIME_LIMIT_EXCEEDED" ? "red" : "dim");
        const safeVerdict = (t.verdict || "UNKNOWN").replace(/_/g, ' ');
        return `
            <div class="vault-timeline-item">
                <div class="vault-timeline-time">${formatTime(t.time)} &middot; ${formatDate(t.time)}</div>
                <div class="vault-timeline-content">
                    <span style="color:var(--${vClass});">${t.shortName.toUpperCase()}</span> 
                    got <span style="color:var(--${vClass});">${safeVerdict}</span> 
                    on <b>${t.probId} — ${esc(t.name)}</b>
                </div>
            </div>
        `;
    }).join("");

    teamMembers.forEach((m, index) => {
        const th = $(`vaultTh${index}`);
        if (th) {
            th.textContent = getShortName(m.name).toUpperCase();
            if (m.name === currentUser) {
                th.style.color = "#fff"; th.style.borderBottom = "1px solid #fff";
            } else {
                th.style.color = "var(--red)"; th.style.borderBottom = "1px solid var(--border)";
            }
        }
    });

    $("vaultTbody").innerHTML = problems.slice(0, 150).map(p => {
        const getVerdictHtml = (v) => {
            if (v === "OK") return `<span class="verdict-ok">Accepted</span>`;
            if (v === "WRONG_ANSWER") return `<span class="verdict-wa">Wrong Answer</span>`;
            if (v === "TIME_LIMIT_EXCEEDED") return `<span class="verdict-wa">TLE</span>`;
            return `<span class="verdict-other">${(v || "UNKNOWN").replace(/_/g, ' ')}</span>`;
        };
        const statusCells = teamMembers.map(m => {
            const mShort = getShortName(m.name);
            const isSolved = p.solves[mShort];
            return `<td style="text-align:center;">
                        <span style="display:block; font-size:8px; color:var(--dim); margin-bottom:2px;" class="desktop-hide">${mShort.toUpperCase()}</span>
                        <span class="${isSolved ? 'solve-yes' : 'solve-no'}">${isSolved ? '✅' : '❌'}</span>
                    </div>`;
        });
        const probLink = p.id.match(/^\d+/) ? `https://codeforces.com/problemset/problem/${p.id.replace(/[A-Z].*/, '')}/${p.id.replace(/^\d+/, '')}` : `https://codeforces.com/problemset`;

        return `
            <tr>
                <td data-label="PROBLEM">
                    <a href="${probLink}" target="_blank" style="color:var(--blue-light); font-weight:bold;">${esc(p.id)}</a>
                    ${p.rating ? `<span class="vault-diff">${p.rating}</span>` : ''}
                </td>
                <td data-label="LATEST ATTEMPT">
                    <b style="display:block; margin-bottom:2px;">${esc(p.name)}</b>
                    <span style="color:var(--muted); font-size:9px;">BY ${esc(p.latestSubmitter.toUpperCase())}</span>
                </td>
                <td data-label="VERDICT">${getVerdictHtml(p.latestVerdict)}</td>
                <td class="mobile-status-grid" colspan="3" style="padding:0;">
                    <div style="display:flex; width:100%; justify-content:space-around; align-items:center; padding:10px 0;">
                        ${statusCells.join("")}
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function setupAnalyzerNav() {
    let navHtml = `<button class="active" data-atab="team">TEAM OVERVIEW</button>
                   <button data-atab="compare">COMPARE</button>
                   <button data-atab="unsolved">UNSOLVED QUEUE</button>`;
    teamMembers.forEach(m => {
        const sName = getShortName(m.name);
        navHtml += `<button data-atab="${sName}">${sName.toUpperCase()}</button>`;
    });
    $("analyzerSubnav").innerHTML = navHtml;

    document.querySelectorAll(".analyzer-subnav button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".analyzer-subnav button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderAnalyzerTab(btn.dataset.atab, vaultCacheData);
        });
    });
}

function renderAnalyzerTab(mode, data) {
    const body = $("analyzerBody");
    body.innerHTML = ""; 
    
    if (mode === "team") {
        body.innerHTML = `
            <div class="analyzer-profile-header">
                <div>
                    <h2>TEAM OVERVIEW</h2>
                    <span>COMBINED KNOWLEDGE BASE</span>
                </div>
            </div>
            <div class="analyzer-grid">
                <div class="analyzer-card"><h4>TEAM RATING DISTRIBUTION</h4><div class="analyzer-chart-box"><canvas id="azTeamRating"></canvas></div></div>
                <div class="analyzer-card"><h4>TOP SHARED TAGS</h4><div class="analyzer-chart-box"><canvas id="azTeamTags"></canvas></div></div>
            </div>
        `;
        requestAnimationFrame(() => {
            const rt = sortObj(data.team.ratings);
            renderAnalyzerBarChart("azTeamRating", Object.keys(rt), Object.values(rt), "rgba(40,120,255,0.7)");
            const tg = topNObj(data.team.tags, 10);
            renderAnalyzerBarChart("azTeamTags", Object.keys(tg), Object.values(tg), "rgba(168,85,247,0.7)", true);
        });
    } 
    else if (mode === "compare") {
        let thead = `<tr><th>METRIC</th>` + teamMembers.map(m => `<th>${getShortName(m.name).toUpperCase()}</th>`).join("") + `</tr>`;
        let rows = [
            { label: "PROBLEMS AC'D", key: (u) => u.solvedSet.size },
            { label: "TOTAL SUBS", key: (u) => u.totalSubs },
            { label: "ONE-SHOT AC", key: (u) => u.attemptsToAC["1"] || 0 },
            { label: "STRUGGLED (6+ TRIES)", key: (u) => u.attemptsToAC["6+"] || 0 },
            { label: "FAV LANGUAGE", key: (u) => Object.keys(topNObj(u.languages,1))[0] || "—" },
            { label: "FAV TAG", key: (u) => Object.keys(topNObj(u.tags,1))[0] || "—" }
        ];

        let tbody = rows.map(r => {
            return `<tr><td>${r.label}</td>` + teamMembers.map(m => `<td><b style="color:var(--blue-light);">${r.key(data.users[getShortName(m.name)])}</b></td>`).join("") + `</tr>`;
        }).join("");

        body.innerHTML = `
            <div class="analyzer-profile-header">
                <div><h2>COMPARE OPERATORS</h2><span>SIDE-BY-SIDE METRICS</span></div>
            </div>
            <div class="analyzer-card full-width" style="padding:0; overflow-x:auto;">
                <table class="analyzer-compare-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>
            </div>
        `;
    }
    else if (mode === "unsolved") {
        const uProbs = Object.values(data.unsolvedMap).sort((a,b) => b.rating - a.rating);
        let trs = uProbs.map(p => {
            const att = p.attemptedBy.join(", ");
            const sol = p.solvedBy.length > 0 ? p.solvedBy.join(", ") : "<span style='color:var(--red);'>NONE</span>";
            return `<tr>
                <td><a href="https://codeforces.com/problemset/problem/${p.id.replace(/[A-Z].*/, '')}/${p.id.replace(/^\d+/, '')}" target="_blank" style="color:#fff;">${p.id}</a> <span class="vault-diff">${p.rating||0}</span></td>
                <td>${esc(p.name)}</td>
                <td style="color:var(--dim);">${att}</td>
                <td style="color:var(--green);">${sol}</td>
            </tr>`;
        }).join("");

        body.innerHTML = `
            <div class="analyzer-profile-header">
                <div><h2>UNSOLVED QUEUE</h2><span>ATTEMPTED BUT NOT CLEARED BY ALL</span></div>
            </div>
            <div class="analyzer-card full-width" style="padding:0; overflow-x:auto; max-height:600px; overflow-y:auto;">
                <table class="analyzer-compare-table" style="text-align:left;">
                    <thead style="position:sticky; top:0; background:var(--panel-solid);"><tr><th>PROBLEM</th><th>NAME</th><th>ATTEMPTED BY</th><th>SOLVED BY</th></tr></thead>
                    <tbody>${trs}</tbody>
                </table>
            </div>
        `;
    }
    else { 
        const u = data.users[mode];
        if(!u) return;

        const acRate = u.totalSubs > 0 ? ((u.verdicts["OK"] || 0) / u.totalSubs * 100).toFixed(1) : "0.0";
        const oneShotRate = u.solvedSet.size > 0 ? ((u.attemptsToAC["1"] || 0) / u.solvedSet.size * 100).toFixed(1) : "0.0";
        const isKryven = u.name === "Tanmoy Mitra";
        const memberRef = teamMembers.find(m => getShortName(m.name) === mode);
        const cfId = isKryven ? 'INTERNAL DATASTREAM (KRYVEN)' : (memberRef.publicCf || memberRef.cf);

        body.innerHTML = `
            <div class="analyzer-profile-header">
                <div>
                    <h2>${u.name.toUpperCase()}</h2>
                    <span>ID: ${cfId}</span>
                </div>
            </div>

            <div class="analyzer-summary">
                <div class="az-stat"><span>ATTEMPTED</span><b>${u.attemptedSet.size}</b></div>
                <div class="az-stat"><span>SOLVED</span><b class="green-text">${u.solvedSet.size}</b></div>
                <div class="az-stat"><span>AC RATE</span><b>${acRate}%</b></div>
                <div class="az-stat"><span>ONE-SHOT AC</span><b class="blue-text">${oneShotRate}%</b></div>
            </div>

            <div class="analyzer-grid">
                <div class="analyzer-card"><h4>RATING DISTRIBUTION</h4><div class="analyzer-chart-box"><canvas id="azIndRating"></canvas></div></div>
                <div class="analyzer-card"><h4>VERDIcripts</h4><div class="analyzer-chart-box"><canvas id="azIndVerdict"></canvas></div></div>
                <div class="analyzer-card"><h4>ATTEMPTS TO AC</h4><div class="analyzer-chart-box"><canvas id="azIndAttempts"></canvas></div></div>
                <div class="analyzer-card"><h4>EXECUTION TIME VS RATING</h4><div class="analyzer-chart-box"><canvas id="azIndScatter"></canvas></div></div>
                <div class="analyzer-card full-width"><h4>TOP TAGS</h4><div class="analyzer-chart-box" style="height:200px;"><canvas id="azIndTags"></canvas></div></div>
            </div>
        `;
        
        requestAnimationFrame(() => {
            const rt = sortObj(u.ratings);
            renderAnalyzerBarChart("azIndRating", Object.keys(rt), Object.values(rt), "rgba(40,120,255,0.7)");
            
            const verdKeys = ["OK", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", "RUNTIME_ERROR", "COMPILATION_ERROR", "MEMORY_LIMIT_EXCEEDED"];
            const verdLabels = ["AC", "WA", "TLE", "RE", "CE", "MLE"];
            const verdColors = ["#22c55e", "#ef4444", "#f59e0b", "#a855f7", "#718096", "#ec4899"];
            const verdData = verdKeys.map(k => u.verdicts[k] || 0);
            renderAnalyzerDoughnutChart("azIndVerdict", verdLabels, verdData, verdColors);
            
            const attKeys = ["1", "2", "3", "4", "5", "6+"];
            const attData = attKeys.map(k => u.attemptsToAC[k] || 0);
            renderAnalyzerBarChart("azIndAttempts", attKeys, attData, "rgba(239,68,68,0.7)");

            renderAnalyzerScatterChart("azIndScatter", u.performance, memberRef ? memberRef.color : "rgba(40,120,255,0.7)");

            const tg = topNObj(u.tags, 10);
            renderAnalyzerBarChart("azIndTags", Object.keys(tg), Object.values(tg), "rgba(34,197,94,0.7)", true);
        });
    }
}

function sortObj(obj) {
    return Object.keys(obj).sort((a,b)=>Number(a)-Number(b)).reduce((acc, key) => { acc[key] = obj[key]; return acc; }, {});
}
function topNObj(obj, n) {
    return Object.keys(obj).sort((a,b)=>obj[b]-obj[a]).slice(0,n).reduce((acc, key) => { acc[key] = obj[key]; return acc; }, {});
}