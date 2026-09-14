import {
    teamMembers,
    achievements
} from "./team.js";

import {
    loadAllData
} from "./api.js";

import {
    renderCFChart,
    renderCCChart,
    getCCStars
} from "./charts.js";

const $ =
    id =>
        document.getElementById(id);

function esc(value) {
    return String(value ?? "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function rating(value) {
    if (
        value === null ||
        value === undefined ||
        !Number(value)
    ) {
        return "—";
    }

    return Number(value)
        .toLocaleString();
}

function stars(value) {
    const n =
        getCCStars(value);

    if (!n)
        return "—";

    return "★".repeat(n);
}

function renderOperators(data={}) {
    const grid =
        $("teamGrid");

    if (!grid)
        return;

    grid.innerHTML =
        teamMembers.map(
            (member,index) => {

                const d =
                    data[member.id] || {};

                const cf =
                    d.cf || {};

                const cc =
                    d.cc || {};

                return `
                    <article
                        class="operator-card"
                        style="--member:${member.color}"
                    >

                        <div class="operator-head">

                            <div class="operator-id">
                                ${String(index+1)
                                    .padStart(2,"0")}
                            </div>

                            <div class="operator-role">
                                ${esc(member.role)}
                            </div>

                        </div>

                        <div class="operator-name">
                            ${esc(member.name)}
                        </div>

                        <div class="operator-code">
                            ID // ${esc(member.id)}
                        </div>

                        <div class="operator-ratings">

                            <div class="rating-box">
                                <span>CF MAX</span>
                                <strong>
                                    ${rating(cf.max)}
                                </strong>
                            </div>

                            <div class="rating-box">
                                <span>CC MAX</span>
                                <strong>
                                    ${rating(cc.max)}
                                </strong>
                            </div>

                            <div class="rating-box">
                                <span>CF CURRENT</span>
                                <strong>
                                    ${rating(cf.current)}
                                </strong>
                            </div>

                            <div class="rating-box">
                                <span>CC CURRENT</span>
                                <strong>
                                    ${rating(cc.current)}
                                </strong>
                            </div>

                        </div>

                        <div class="operator-platforms">

                            <div>
                                <span>CODEFORCES</span>
                                <b>
                                    ${esc(member.cf)}
                                </b>
                            </div>

                            <div>
                                <span>CODECHEF</span>
                                <b>
                                    ${
                                        member.cc
                                            ? esc(member.cc)
                                            : "PRIVATE"
                                    }
                                </b>
                            </div>

                        </div>

                    </article>
                `;
            }
        ).join("");
}

function renderSnapshot(data={}) {
    const grid =
        $("snapshotGrid");

    if (!grid)
        return;

    grid.innerHTML =
        teamMembers.map(
            member => {

                const d =
                    data[member.id] || {};

                const cf =
                    d.cf || {};

                const cc =
                    d.cc || {};

                return `
                    <div
                        class="snapshot-card"
                        style="--member:${member.color}"
                    >

                        <div class="snapshot-top">
                            <span>
                                ${esc(member.name)}
                            </span>

                            <i></i>
                        </div>

                        <div class="snapshot-values">

                            <div>
                                <small>CF</small>

                                <strong>
                                    ${rating(cf.current)}
                                </strong>
                            </div>

                            <div>
                                <small>CC</small>

                                <strong>
                                    ${rating(cc.current)}
                                </strong>
                            </div>

                        </div>

                    </div>
                `;
            }
        ).join("");
}

function renderAchievements() {
    const grid =
        $("achievementGrid");

    if (!grid)
        return;

    grid.innerHTML =
        achievements.map(
            (item,index) => {

                const media =
                    item.image
                        ? `
                            <div class="achievement-media">
                                <img
                                    src="${esc(item.image)}"
                                    alt="${esc(item.title)}"
                                    loading="lazy"
                                >
                                <div class="image-fallback">
                                    IMAGE UNAVAILABLE
                                </div>
                            </div>
                        `
                        : `
                            <div class="achievement-media image-missing">
                                <div class="image-fallback">
                                    ARCHIVE IMAGE UNAVAILABLE
                                </div>
                            </div>
                        `;

                return `
                    <article class="achievement-card">

                        ${media}

                        <div class="achievement-content">

                            <div class="achievement-index">
                                ARCHIVE //
                                ${String(index+1)
                                    .padStart(2,"0")}
                            </div>

                            <h3>
                                ${esc(item.title)}
                            </h3>

                            <div class="achievement-place">
                                ${esc(item.place)}
                            </div>

                            <div class="achievement-meta">
                                ${esc(item.teams)}
                            </div>

                            <div class="achievement-team">
                                ${esc(item.team)}
                            </div>

                            <div class="achievement-members">
                                ${esc(item.members)}
                            </div>

                        </div>

                    </article>
                `;
            }
        ).join("");

    const archiveImages = grid.querySelectorAll('.achievement-media img');
    archiveImages.forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            this.parentElement.classList.add('image-missing');
        });
    });

    const count =
        $("achievementCount");

    if (count) {
        count.textContent =
            String(achievements.length)
                .padStart(2,"0");
    }
}

function renderStats() {
    const operators =
        $("statOperators");

    const core =
        $("statCore");

    const hero =
        $("heroOperators");

    if (operators) {
        operators.textContent =
            String(
                teamMembers.length
            ).padStart(2,"0");
    }

    if (core) {
        core.textContent =
            String(
                teamMembers.filter(
                    x =>
                        x.role === "CORE"
                ).length
            ).padStart(2,"0");
    }

    if (hero) {
        hero.textContent =
            String(
                teamMembers.length
            ).padStart(2,"0");
    }
}

function setChartState(
    id,
    text,
    hide=false
) {
    const el =
        $(id);

    if (!el)
        return;

    el.textContent =
        text;

    el.style.display =
        hide
            ? "none"
            : "";
}

function hasCFData(data) {
    return teamMembers.some(
        member =>
            data[member.id]
                ?.cf
                ?.history
                ?.length > 0
    );
}

function hasCCData(data) {
    return teamMembers.some(
        member =>
            data[member.id]
                ?.cc
                ?.history
                ?.length > 0
    );
}

function renderCF(data) {
    if (!hasCFData(data))
        return;

    setChartState(
        "cfChartState",
        "",
        true
    );

    requestAnimationFrame(
        () => {
            renderCFChart(
                "cfChart",
                teamMembers,
                data
            );
        }
    );
}

function renderCC(data) {
    if (!hasCCData(data))
        return;

    setChartState(
        "ccChartState",
        "",
        true
    );

    requestAnimationFrame(
        () => {
            renderCCChart(
                "ccChart",
                teamMembers,
                data
            );
        }
    );
}

async function init() {
    const start =
        performance.now();

    const data = {};

    renderOperators(data);
    renderSnapshot(data);
    renderAchievements();
    renderStats();

    setChartState(
        "cfChartState",
        "BUILDING"
    );

    setChartState(
        "ccChartState",
        "BUILDING"
    );

    await loadAllData(
        teamMembers,
        update => {

            if (!update)
                return;

            if (
                update.data
            ) {
                Object.assign(
                    data,
                    update.data
                );
            }

            if (
                update.type === "cf"
            ) {
                renderOperators(data);
                renderSnapshot(data);

                if (
                    hasCFData(data)
                ) {
                    renderCF(data);
                }
            }

            if (
                update.type === "cc"
            ) {
                renderOperators(data);
                renderSnapshot(data);

                if (
                    hasCCData(data)
                ) {
                    renderCC(data);
                }
            }

            if (
                update.type ===
                "cf-complete"
            ) {
                if (
                    hasCFData(data)
                ) {
                    renderCF(data);
                } else {
                    setChartState(
                        "cfChartState",
                        "DATA UNAVAILABLE"
                    );
                }
            }

            if (
                update.type ===
                "cc-complete"
            ) {
                if (
                    hasCCData(data)
                ) {
                    renderCC(data);
                } else {
                    setChartState(
                        "ccChartState",
                        "CODECHEF DATA UNAVAILABLE"
                    );
                }
            }
        }
    );

    renderOperators(data);
    renderSnapshot(data);
    renderStats();

    if (hasCFData(data)) {
        renderCF(data);
    } else {
        setChartState(
            "cfChartState",
            "DATA UNAVAILABLE"
        );
    }

    if (hasCCData(data)) {
        renderCC(data);
    } else {
        setChartState(
            "ccChartState",
            "CODECHEF DATA UNAVAILABLE"
        );
    }

    const elapsed =
        Math.round(
            performance.now() -
            start
        );

    console.log(
        `GUB_Dragons initialized in ${elapsed}ms`
    );
}

init().catch(
    err => {

        console.error(
            "Portal initialization failed:",
            err
        );

        setChartState(
            "cfChartState",
            "INITIALIZATION ERROR"
        );

        setChartState(
            "ccChartState",
            "INITIALIZATION ERROR"
        );
    }
);
