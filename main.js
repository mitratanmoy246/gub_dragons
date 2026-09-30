import {
    teamMembers,
    achievements
} from "./team.js";

import {
    loadAllData,
    loadCFStatus
} from "./api.js";

import {
    renderCFChart,
    renderCCChart,
    getCCStars
} from "./charts.js";

const $ =
    id =>
        document.getElementById(id);

const state = {
    data: {},
    activity: [],
    activityFilter: "all",
    achievementFilter: "all"
};

function esc(value) {
    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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
        getCCStars(
            value
        );

    if (!n)
        return "—";

    return "★".repeat(n);
}

function formatRank(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "—";
    }

    return `#${Number(value).toLocaleString()}`;
}

function formatDate(
    timestamp
) {
    return new Date(
        timestamp
    ).toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function setText(
    id,
    value
) {
    const el =
        $(id);

    if (el)
        el.textContent =
            value;
}

function setChartState(
    id,
    text,
    hide = false
) {
    const el =
        $(id);

    if (!el)
        return;

    el.innerHTML =
        hide
            ? ""
            : `<i></i>${esc(text)}`;

    el.style.display =
        hide
            ? "none"
            : "";
}

function hasCFData(
    data
) {
    return teamMembers.some(
        member =>
            data[
                member.id
            ]?.cf
                ?.history
                ?.length > 0
    );
}

function hasCCData(
    data
) {
    return teamMembers.some(
        member =>
            member.showCC === true &&
            data[
                member.id
            ]?.cc
                ?.history
                ?.length > 0
    );
}

function renderOperators(
    data = {}
) {
    const grid =
        $("teamGrid");

    if (!grid)
        return;

    grid.innerHTML =
        teamMembers.map(
            (
                member,
                index
            ) => {
                const d =
                    data[
                        member.id
                    ] || {};

                const cf =
                    d.cf || {};

                const cc =
                    d.cc || {};

                const ccVisible =
                    member.showCC === true;

                return `
                    <article
                        class="operator-card"
                        style="--member:${member.color}"
                    >
                        <div class="operator-head">
                            <div class="operator-index">
                                ${String(
                                    index + 1
                                ).padStart(2, "0")}
                            </div>

                            <div class="operator-role">
                                ${esc(
                                    member.role
                                )}
                            </div>
                        </div>

                        <div class="operator-name">
                            ${esc(
                                member.name
                            )}
                        </div>

                        <div class="operator-code">
                            ID // ${esc(
                                member.id
                            )}
                        </div>

                        <div class="operator-ratings">
                            <div class="rating-box">
                                <span>CF MAX</span>
                                <strong>
                                    ${rating(
                                        cf.max
                                    )}
                                </strong>
                            </div>

                            <div class="rating-box">
                                <span>CC MAX</span>
                                <strong class="${
                                    ccVisible
                                        ? ""
                                        : "hidden-value"
                                }">
                                    ${
                                        ccVisible
                                            ? rating(
                                                cc.max
                                            )
                                            : "HIDDEN"
                                    }
                                </strong>
                            </div>

                            <div class="rating-box">
                                <span>CF CURRENT</span>
                                <strong>
                                    ${rating(
                                        cf.current
                                    )}
                                </strong>
                            </div>

                            <div class="rating-box">
                                <span>CC CURRENT</span>
                                <strong class="${
                                    ccVisible
                                        ? ""
                                        : "hidden-value"
                                }">
                                    ${
                                        ccVisible
                                            ? rating(
                                                cc.current
                                            )
                                            : "HIDDEN"
                                    }
                                </strong>
                            </div>
                        </div>

                        <div class="operator-platforms">
                            <div>
                                <span>CODEFORCES</span>
                                <b>
                                    ${esc(
                                        member.cf
                                    )}
                                </b>
                            </div>

                            ${
                                ccVisible
                                    ? `
                                        <div>
                                            <span>CODECHEF</span>
                                            <b>
                                                ${
                                                    member.cc
                                                        ? esc(
                                                            member.cc
                                                        )
                                                        : "PRIVATE"
                                                }
                                            </b>
                                        </div>
                                    `
                                    : `
                                        <div class="platform-hidden">
                                            <span>CODECHEF</span>
                                            <b>
                                                DATA HIDDEN
                                            </b>
                                        </div>
                                    `
                            }
                        </div>

                        <div class="operator-accent"></div>
                    </article>
                `;
            }
        ).join("");
}

function renderSnapshot(
    data = {}
) {
    const grid =
        $("snapshotGrid");

    if (!grid)
        return;

    grid.innerHTML =
        teamMembers.map(
            member => {
                const d =
                    data[
                        member.id
                    ] || {};

                const cf =
                    d.cf || {};

                const cc =
                    d.cc || {};

                const ccVisible =
                    member.showCC === true;

                return `
                    <div
                        class="snapshot-card"
                        style="--member:${member.color}"
                    >
                        <div class="snapshot-top">
                            <span>
                                ${esc(
                                    member.name
                                )}
                            </span>

                            <i></i>
                        </div>

                        <div class="snapshot-values">
                            <div>
                                <small>CF</small>
                                <strong>
                                    ${rating(
                                        cf.current
                                    )}
                                </strong>
                            </div>

                            <div>
                                <small>CC</small>
                                <strong class="${
                                    ccVisible
                                        ? ""
                                        : "hidden-value"
                                }">
                                    ${
                                        ccVisible
                                            ? rating(
                                                cc.current
                                            )
                                            : "HIDDEN"
                                    }
                                </strong>
                            </div>
                        </div>

                        <div class="snapshot-foot">
                            <span>
                                CF MAX
                                ${rating(
                                    cf.max
                                )}
                            </span>

                            <span>
                                ${
                                    ccVisible
                                        ? `CC ${stars(
                                            cc.current
                                        )}`
                                        : "CC PRIVATE"
                                }
                            </span>
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

    const filter =
        state.achievementFilter;

    const filtered =
        achievements.filter(
            item =>
                filter === "all" ||
                item.type === filter
        );

    grid.innerHTML =
        filtered.map(
            (
                item,
                index
            ) => {
                const media =
                    item.image
                        ? `
                            <div class="achievement-media">
                                <img
                                    src="${esc(
                                        item.image
                                    )}"
                                    alt="${esc(
                                        item.title
                                    )}"
                                    loading="lazy"
                                    onerror="
                                        this.style.display='none';
                                        this.parentElement.classList.add('image-missing');
                                    "
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
                                ${String(
                                    index + 1
                                ).padStart(2, "0")}
                            </div>

                            <h3>
                                ${esc(
                                    item.title
                                )}
                            </h3>

                            <div class="achievement-place">
                                ${esc(
                                    item.place
                                )}
                            </div>

                            <div class="achievement-meta">
                                ${esc(
                                    item.teams
                                )}
                            </div>

                            <div class="achievement-team">
                                ${esc(
                                    item.team
                                )}
                            </div>

                            <div class="achievement-members">
                                ${esc(
                                    item.members
                                )}
                            </div>
                        </div>
                    </article>
                `;
            }
        ).join("");

    setText(
        "achievementCount",
        String(
            achievements.length
        ).padStart(2, "0")
    );
}

function renderStats() {
    setText(
        "statOperators",
        String(
            teamMembers.length
        ).padStart(2, "0")
    );

    setText(
        "statCore",
        String(
            teamMembers.filter(
                x =>
                    x.role ===
                    "CORE"
            ).length
        ).padStart(2, "0")
    );

    setText(
        "heroOperators",
        String(
            teamMembers.length
        ).padStart(2, "0")
    );
}

function collectActivity(
    data
) {
    const list = [];

    teamMembers.forEach(
        member => {
            const d =
                data[
                    member.id
                ] || {};

            const cf =
                d.cf?.history ||
                [];

            const cc =
                member.showCC === true
                    ? d.cc?.history ||
                        []
                    : [];

            cf.forEach(
                item => {
                    list.push({
                        type: "cf",
                        member,
                        contestName:
                            item.contestName,
                        time:
                            item.time,
                        rating:
                            item.rating,
                        oldRating:
                            item.oldRating,
                        delta:
                            item.oldRating === null ||
                            item.oldRating === undefined
                                ? null
                                : item.rating -
                                    item.oldRating,
                        rank:
                            item.rank
                    });
                }
            );

            cc.forEach(
                item => {
                    const previous =
                        item.oldRating;

                    list.push({
                        type: "cc",
                        member,
                        contestName:
                            item.contestName,
                        time:
                            item.time,
                        rating:
                            item.rating,
                        oldRating:
                            previous,
                        delta:
                            previous === null ||
                            previous === undefined
                                ? null
                                : item.rating -
                                    previous,
                        rank:
                            item.rank
                    });
                }
            );
        }
    );

    list.sort(
        (a, b) =>
            b.time - a.time
    );

    state.activity =
        list;
}

function renderActivity() {
    const grid =
        $("activityList");

    if (!grid)
        return;

    const filter =
        state.activityFilter;

    const filtered =
        state.activity
            .filter(
                item =>
                    filter === "all" ||
                    item.type === filter
            )
            .slice(
                0,
                12
            );

    if (!filtered.length) {
        grid.innerHTML = `
            <div class="empty-state">
                NO CONTEST ACTIVITY AVAILABLE
            </div>
        `;
        return;
    }

    grid.innerHTML =
        filtered.map(
            item => {
                const delta =
                    item.delta;

                const deltaClass =
                    delta === null
                        ? ""
                        : delta >= 0
                            ? "positive"
                            : "negative";

                const deltaText =
                    delta === null
                        ? "—"
                        : `${
                            delta >= 0
                                ? "+"
                                : ""
                        }${delta}`;

                return `
                    <div
                        class="activity-row"
                        style="--member:${item.member.color}"
                    >
                        <div class="activity-platform ${item.type}">
                            ${
                                item.type === "cf"
                                    ? "CF"
                                    : "CC"
                            }
                        </div>

                        <div class="activity-main">
                            <strong>
                                ${esc(
                                    item.contestName
                                )}
                            </strong>

                            <span>
                                ${esc(
                                    item.member.name
                                )}
                                //
                                ${formatDate(
                                    item.time
                                )}
                            </span>
                        </div>

                        <div class="activity-rating">
                            <span>RATING</span>
                            <b>
                                ${rating(
                                    item.rating
                                )}
                            </b>
                        </div>

                        <div class="activity-delta">
                            <span>DELTA</span>
                            <b class="${deltaClass}">
                                ${deltaText}
                            </b>
                        </div>

                        <div class="activity-rank">
                            <span>RANK</span>
                            <b>
                                ${formatRank(
                                    item.rank
                                )}
                            </b>
                        </div>
                    </div>
                `;
            }
        ).join("");
}

function renderTeamAnalytics(
    data
) {
    const cfValues =
        teamMembers
            .map(
                member => ({
                    member,
                    value:
                        Number(
                            data[
                                member.id
                            ]?.cf?.current
                        ) || 0
                })
            )
            .filter(
                x =>
                    x.value > 0
            );

    const ccValues =
        teamMembers
            .filter(
                member =>
                    member.showCC === true
            )
            .map(
                member => ({
                    member,
                    value:
                        Number(
                            data[
                                member.id
                            ]?.cc?.current
                        ) || 0
                })
            )
            .filter(
                x =>
                    x.value > 0
            );

    renderBars(
        "teamCFBars",
        cfValues,
        3000
    );

    renderBars(
        "teamCCBars",
        ccValues,
        3000
    );

    if (cfValues.length) {
        const avg =
            cfValues.reduce(
                (
                    sum,
                    x
                ) =>
                    sum + x.value,
                0
            ) /
            cfValues.length;

        setText(
            "teamCFCurrent",
            Math.round(
                avg
            ).toLocaleString()
        );
    }

    if (ccValues.length) {
        const avg =
            ccValues.reduce(
                (
                    sum,
                    x
                ) =>
                    sum + x.value,
                0
            ) /
            ccValues.length;

        setText(
            "teamCCCurrent",
            Math.round(
                avg
            ).toLocaleString()
        );
    }
}

function renderBars(
    id,
    values,
    max
) {
    const el =
        $(id);

    if (!el)
        return;

    if (!values.length) {
        el.innerHTML = `
            <div class="empty-state">
                DATA UNAVAILABLE
            </div>
        `;
        return;
    }

    el.innerHTML =
        values.map(
            item => {
                const width =
                    Math.min(
                        100,
                        item.value /
                            max *
                            100
                    );

                return `
                    <div
                        class="team-bar"
                        style="--member:${item.member.color}"
                    >
                        <div class="team-bar-label">
                            <span>
                                ${esc(
                                    item.member.name
                                )}
                            </span>

                            <b>
                                ${rating(
                                    item.value
                                )}
                            </b>
                        </div>

                        <div class="team-bar-track">
                            <i
                                style="width:${width}%"
                            ></i>
                        </div>
                    </div>
                `;
            }
        ).join("");
}

function renderMilestones(
    data
) {
    let cfContests = 0;
    let ccContests = 0;
    let totalContests = 0;

    teamMembers.forEach(
        member => {
            const d =
                data[
                    member.id
                ] || {};

            const cf =
                d.cf?.history ||
                [];

            const cc =
                member.showCC === true
                    ? d.cc?.history ||
                        []
                    : [];

            cfContests +=
                cf.length;

            ccContests +=
                cc.length;
        }
    );

    totalContests =
        cfContests +
        ccContests;

    const peakCF =
        Math.max(
            0,
            ...teamMembers.map(
                member =>
                    Number(
                        data[
                            member.id
                        ]?.cf?.max
                    ) || 0
            )
        );

    const peakCC =
        Math.max(
            0,
            ...teamMembers
                .filter(
                    x =>
                        x.showCC === true
                )
                .map(
                    member =>
                        Number(
                            data[
                                member.id
                            ]?.cc?.max
                        ) || 0
                )
        );

    const values = [
        {
            value:
                teamMembers.length,
            label: "ACTIVE OPERATORS",
            code: "PERSONNEL"
        },
        {
            value:
                totalContests,
            label: "CONTEST ENTRIES",
            code: "ACTIVITY"
        },
        {
            value:
                peakCF,
            label: "HIGHEST CF PEAK",
            code: "RATING"
        },
        {
            value:
                peakCC,
            label: "HIGHEST CC PEAK",
            code: "RATING"
        },
        {
            value:
                achievements.length,
            label: "VERIFIED RECORDS",
            code: "ARCHIVE"
        }
    ];

    const grid =
        $("milestoneGrid");

    if (!grid)
        return;

    grid.innerHTML =
        values.map(
            (
                item,
                index
            ) => `
                <div class="milestone-card">
                    <span>
                        ${String(
                            index + 1
                        ).padStart(2, "0")}
                    </span>

                    <strong>
                        ${Number(
                            item.value
                        ).toLocaleString()}
                    </strong>

                    <b>
                        ${esc(
                            item.label
                        )}
                    </b>

                    <small>
                        ${esc(
                            item.code
                        )}
                    </small>
                </div>
            `
        ).join("");
}

function renderCF(
    data
) {
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

function renderCC(
    data
) {
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

function renderEverything() {
    renderOperators(
        state.data
    );

    renderSnapshot(
        state.data
    );

    renderStats();

    renderTeamAnalytics(
        state.data
    );

    collectActivity(
        state.data
    );

    renderActivity();

    renderMilestones(
        state.data
    );
}

function bindFilters() {
    document
        .querySelectorAll(
            "[data-filter]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        document
                            .querySelectorAll(
                                "[data-filter]"
                            )
                            .forEach(
                                x =>
                                    x.classList
                                        .remove(
                                            "active"
                                        )
                            );

                        button.classList.add(
                            "active"
                        );

                        state.activityFilter =
                            button.dataset.filter;

                        renderActivity();
                    }
                );
            }
        );

    document
        .querySelectorAll(
            "[data-achievement-filter]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        document
                            .querySelectorAll(
                                "[data-achievement-filter]"
                            )
                            .forEach(
                                x =>
                                    x.classList
                                        .remove(
                                            "active"
                                        )
                            );

                        button.classList.add(
                            "active"
                        );

                        state.achievementFilter =
                            button.dataset
                                .achievementFilter;

                        renderAchievements();
                    }
                );
            }
        );
}

function startClock() {
    const tick =
        () => {
            const now =
                new Date();

            setText(
                "liveClock",
                now.toLocaleTimeString(
                    undefined,
                    {
                        hour12: false
                    }
                )
            );
        };

    tick();

    setInterval(
        tick,
        1000
    );
}

function setSystemState(
    text,
    bad = false
) {
    setText(
        "systemState",
        text
    );

    const light =
        document.querySelector(
            ".state-light"
        );

    if (light) {
        light.classList.toggle(
            "bad",
            bad
        );
    }
}

function setAPIState(
    id,
    text,
    bad = false
) {
    const el =
        $(id);

    if (!el)
        return;

    el.innerHTML =
        `<i class="${
            bad
                ? "bad"
                : ""
        }"></i>${esc(text)}`;
}

async function boot() {
    const progress =
        $("bootProgress");

    const text =
        $("bootText");

    const steps = [
        "LOADING GUB_DRAGONS CORE...",
        "MOUNTING OPERATOR DATABASE...",
        "CONNECTING CODEFORCES...",
        "CONNECTING CODECHEF...",
        "BUILDING TELEMETRY...",
        "VERIFYING ARCHIVE...",
        "SYSTEM ONLINE"
    ];

    for (
        let i = 0;
        i < steps.length;
        i++
    ) {
        if (text)
            text.textContent =
                steps[i];

        if (progress) {
            progress.style.width =
                `${(
                    (i + 1) /
                    steps.length
                ) * 100}%`;
        }

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    i ===
                        steps.length - 1
                            ? 180
                            : 120
                )
        );
    }

    const bootScreen =
        $("bootScreen");

    if (bootScreen) {
        bootScreen.classList.add(
            "boot-complete"
        );

        setTimeout(
            () =>
                bootScreen.remove(),
            500
        );
    }
}

async function init() {
    startClock();

    bindFilters();

    renderAchievements();

    renderEverything();

    setChartState(
        "cfChartState",
        "BUILDING"
    );

    setChartState(
        "ccChartState",
        "BUILDING"
    );

    setSystemState(
        "SYNCING"
    );

    setAPIState(
        "cfSystemStatus",
        "SYNCING"
    );

    setAPIState(
        "ccSystemStatus",
        "SYNCING"
    );

    try {
        await loadAllData(
            teamMembers,
            update => {
                if (!update)
                    return;

                if (update.data) {
                    Object.assign(
                        state.data,
                        update.data
                    );
                }

                renderEverything();

                if (
                    update.type ===
                    "cf"
                ) {
                    if (
                        hasCFData(
                            state.data
                        )
                    ) {
                        renderCF(
                            state.data
                        );
                    }
                }

                if (
                    update.type ===
                    "cc"
                ) {
                    if (
                        hasCCData(
                            state.data
                        )
                    ) {
                        renderCC(
                            state.data
                        );
                    }
                }

                if (
                    update.type ===
                    "cf-complete"
                ) {
                    if (
                        hasCFData(
                            state.data
                        )
                    ) {
                        renderCF(
                            state.data
                        );

                        setAPIState(
                            "cfSystemStatus",
                            "ONLINE"
                        );
                    } else {
                        setChartState(
                            "cfChartState",
                            "DATA UNAVAILABLE"
                        );

                        setAPIState(
                            "cfSystemStatus",
                            "UNAVAILABLE",
                            true
                        );
                    }
                }

                if (
                    update.type ===
                    "cc-complete"
                ) {
                    if (
                        hasCCData(
                            state.data
                        )
                    ) {
                        renderCC(
                            state.data
                        );

                        setAPIState(
                            "ccSystemStatus",
                            "ONLINE"
                        );
                    } else {
                        setChartState(
                            "ccChartState",
                            "DATA UNAVAILABLE"
                        );

                        setAPIState(
                            "ccSystemStatus",
                            "UNAVAILABLE",
                            true
                        );
                    }
                }
            }
        );

        renderEverything();

        if (
            hasCFData(
                state.data
            )
        ) {
            renderCF(
                state.data
            );
        } else {
            setChartState(
                "cfChartState",
                "DATA UNAVAILABLE"
            );
        }

        if (
            hasCCData(
                state.data
            )
        ) {
            renderCC(
                state.data
            );
        } else {
            setChartState(
                "ccChartState",
                "CODECHEF DATA UNAVAILABLE"
            );
        }

        setSystemState(
            "SYSTEM ONLINE"
        );

        setText(
            "lastSync",
            new Date().toLocaleTimeString(
                undefined,
                {
                    hour12: false
                }
            )
        );

    } catch (err) {
        console.error(
            "GUB_Dragons initialization failed:",
            err
        );

        setSystemState(
            "PARTIAL SYSTEM",
            true
        );

        setAPIState(
            "cfSystemStatus",
            "ERROR",
            true
        );

        setAPIState(
            "ccSystemStatus",
            "ERROR",
            true
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
}

boot().then(
    init
);


// =========================================================
//  SECURE VAULT LOGIC (CF TRACKER)
// =========================================================

const vaultBtn = $("vaultBtn");
const vaultOverlay = $("vaultOverlay");
const vaultLogin = $("vaultLogin");
const vaultContent = $("vaultContent");
const vaultPin = $("vaultPin");
const vaultSubmit = $("vaultSubmit");
const vaultClose = $("vaultClose");
const vaultError = $("vaultError");

const VAULT_CODES = {
    "55": "Tanmoy Mitra",
    "93": "Abdul Kayum",
    "104": "Anikur Rahman"
};

vaultBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    vaultOverlay.classList.remove("hidden");
    vaultLogin.classList.remove("hidden");
    vaultContent.classList.add("hidden");
    vaultPin.value = "";
    vaultError.textContent = "";
});

vaultClose?.addEventListener("click", () => {
    vaultOverlay.classList.add("hidden");
});

vaultSubmit?.addEventListener("click", async () => {
    const pin = vaultPin.value.trim();
    if (VAULT_CODES[pin]) {
        await openVault(VAULT_CODES[pin]);
    } else {
        vaultError.textContent = "ACCESS DENIED";
    }
});

vaultPin?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") vaultSubmit.click();
});

async function openVault(currentUser) {
    vaultLogin.classList.add("hidden");
    vaultContent.classList.remove("hidden");
    
    $("vaultTbody").innerHTML = `<tr><td colspan='7' style='text-align:center; padding: 40px;'>FETCHING SECURE DATA...</td></tr>`;

    // Fetch data for everyone simultaneously
    const promises = [];
    teamMembers.forEach(m => {
        promises.push(loadCFStatus(m.cf).then(res => ({ member: m.name, data: res })));
        if (m.privateCf) {
            promises.push(loadCFStatus(m.privateCf).then(res => ({ member: m.name, data: res })));
        }
    });

    const results = await Promise.all(promises);

    // Keep track of who solved what
    const solved = {};
    teamMembers.forEach(m => solved[m.name] = {});

    const allSubs = [];
    
    results.forEach(res => {
        res.data.forEach(sub => {
            const probId = sub.problem.contestId ? `${sub.problem.contestId}${sub.problem.index}` : sub.problem.name;
            
            // Mark as solved if verdict is OK
            if (sub.verdict === "OK") {
                solved[res.member][probId] = true;
            }
            
            allSubs.push({
                probId,
                name: sub.problem.name,
                submitter: res.member,
                verdict: sub.verdict,
                time: sub.creationTimeSeconds
            });
        });
    });

    // Sort to easily grab latest submissions
    allSubs.sort((a, b) => b.time - a.time);

    // Only keep unique problems for the tracker view
    const recentProbs = [];
    const seen = new Set();
    for (const sub of allSubs) {
        if (!seen.has(sub.probId)) {
            seen.add(sub.probId);
            recentProbs.push(sub);
            if (recentProbs.length >= 75) break; 
        }
    }

    // Set Dynamic Table Headers (Highlights the current logged-in user in White)
    teamMembers.forEach((m, index) => {
        const th = $(`vaultTh${index}`);
        if (th) {
            th.textContent = m.name.split(" ")[0].toUpperCase();
            if (m.name === currentUser) {
                th.style.color = "#fff";
                th.style.borderBottom = "1px solid #fff";
            } else {
                th.style.color = "var(--red)";
                th.style.borderBottom = "1px solid var(--border)";
            }
        }
    });

    // Render table
    $("vaultTbody").innerHTML = recentProbs.map(sub => {
        const getVerdictHtml = (v) => {
            if (v === "OK") return `<span class="verdict-ok">Accepted</span>`;
            if (v === "WRONG_ANSWER") return `<span class="verdict-wa">Wrong Answer</span>`;
            if (v === "TIME_LIMIT_EXCEEDED") return `<span class="verdict-wa">TLE</span>`;
            return `<span class="verdict-other">${(v || "UNKNOWN").replace(/_/g, ' ')}</span>`;
        };

        // Map over all 3 team members to generate a status column for each one
        const statusCells = teamMembers.map(m => {
            const isSolved = solved[m.name][sub.probId];
            return `<td style="text-align:center;">${isSolved ? "✅" : "❌"}</td>`;
        }).join("");

        return `
            <tr>
                <td>${esc(sub.probId)}</td>
                <td><b>${esc(sub.name)}</b></td>
                <td style="color:var(--muted);">${esc(sub.submitter.split(" ")[0])}</td>
                <td>${getVerdictHtml(sub.verdict)}</td>
                ${statusCells}
            </tr>
        `;
    }).join("");
}