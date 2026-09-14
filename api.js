import {BASE_TIMESTAMP} from "./team.js";

const CF_API = "https://codeforces.com/api";
const CC_API = "https://codechef-stats-api-two.vercel.app";

const FETCH_TIMEOUT = 2500;
const CF_TOTAL_TIMEOUT = 9000;
const CF_DELAY = 2000;
const CACHE_TIME = 30 * 60 * 1000;

const cache = new Map();

function sleep(ms) {
    return new Promise(
        resolve => setTimeout(resolve,ms)
    );
}

async function fetchJSON(url,timeout=FETCH_TIMEOUT) {
    const old = cache.get(url);

    if (
        old &&
        Date.now()-old.time < CACHE_TIME
    ) {
        return old.data;
    }

    const controller =
        new AbortController();

    const timer =
        setTimeout(
            () => controller.abort(),
            timeout
        );

    try {
        const res =
            await fetch(
                url,
                {
                    signal:controller.signal,
                    headers:{
                        Accept:"application/json"
                    }
                }
            );

        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);

        const data =
            await res.json();

        cache.set(
            url,
            {
                time:Date.now(),
                data
            }
        );

        return data;
    } finally {
        clearTimeout(timer);
    }
}

function emptyCF(status="error") {
    return {
        current:0,
        max:0,
        history:[],
        available:false,
        status
    };
}

function emptyCC(status="error") {
    return {
        current:0,
        max:0,
        stars:0,
        history:[],
        available:false,
        status
    };
}

function normalizeCF(data) {
    const arr =
        Array.isArray(data?.result)
            ? data.result
            : [];

    const all =
        arr
            .filter(x =>
                Number.isFinite(
                    Number(x.newRating)
                ) &&
                Number.isFinite(
                    Number(x.ratingUpdateTimeSeconds)
                )
            )
            .map(x => ({
                time:
                    Number(
                        x.ratingUpdateTimeSeconds
                    ) * 1000,

                rating:
                    Number(x.newRating),

                oldRating:
                    Number(x.oldRating),

                contestName:
                    x.contestName ||
                    "Unknown Contest",

                contestId:
                    x.contestId ?? null,

                rank:
                    x.rank ?? null
            }))
            .sort(
                (a,b) =>
                    a.time-b.time
            );

    if (!all.length)
        return emptyCF("unavailable");

    return {
        current:
            all[all.length-1].rating,

        max:
            Math.max(
                ...all.map(
                    x => x.rating
                )
            ),

        history:
            all.filter(
                x =>
                    x.time >=
                    BASE_TIMESTAMP
            ),

        available:true,
        status:"ok"
    };
}

async function loadCF(member,remaining) {
    if (!member.cf)
        return emptyCF("unavailable");

    const url =
        `${CF_API}/user.rating?handle=${
            encodeURIComponent(member.cf)
        }`;

    try {
        const data =
            await fetchJSON(
                url,
                Math.max(
                    500,
                    Math.min(
                        FETCH_TIMEOUT,
                        remaining
                    )
                )
            );

        return normalizeCF(data);
    } catch (err) {
        console.warn(
            `CF failed for ${member.cf}:`,
            err
        );

        if (
            err?.name === "AbortError" ||
            String(err?.message)
                .toLowerCase()
                .includes("abort")
        ) {
            return emptyCF("timeout");
        }

        return emptyCF("error");
    }
}


/*
    The private CodeChef account is intentionally
    reconstructed instead of being stored as plain text.
*/
function getPrivateCC(member) {
    if (member.id !== "252002055")
        return null;

    return [
        "k",
        "r",
        "y",
        "v",
        "e",
        "n"
    ].join("");
}

function normalizeStars(value,rating) {
    let stars =
        Number(value);

    if (
        Number.isFinite(stars) &&
        stars > 0
    ) {
        return stars;
    }

    if (rating >= 2500) return 7;
    if (rating >= 2200) return 6;
    if (rating >= 2000) return 5;
    if (rating >= 1800) return 4;
    if (rating >= 1600) return 3;
    if (rating >= 1400) return 2;
    if (rating > 0) return 1;

    return 0;
}

function normalizeCC(data) {
    const root =
        data?.data || {};

    const current =
        Number(
            root.rating
        ) || 0;

    const max =
        Number(
            root.maxRating ??
            root.highestRating ??
            root.max_rating
        ) || current;

    const stars =
        normalizeStars(
            root.stars,
            current
        );

    const raw =
        Array.isArray(root.history)
            ? root.history
            : [];

    const history = [];

    for (let i=0; i<raw.length; i++) {
        const x = raw[i];

        const rating =
            Number(x.rating);

        let time =
            Number(x.timestamp);

        if (
            !Number.isFinite(time) &&
            x.date
        ) {
            time =
                Date.parse(x.date);
        }

        if (
            Number.isFinite(time) &&
            time < 10000000000
        ) {
            time *= 1000;
        }

        if (
            !Number.isFinite(rating) ||
            !Number.isFinite(time)
        ) {
            continue;
        }

        const previous =
            i > 0 &&
            Number.isFinite(
                Number(raw[i-1].rating)
            )
                ? Number(
                    raw[i-1].rating
                )
                : null;

        history.push({
            time,
            rating,

            oldRating:
                previous,

            contestName:
                x.name ||
                "CodeChef Contest",

            contestId:
                x.contestId ??
                x.contest_id ??
                null,

            rank:
                x.ranking ??
                x.rank ??
                null
        });
    }

    history.sort(
        (a,b) =>
            a.time-b.time
    );

    const filtered =
        history.filter(
            x =>
                x.time >=
                BASE_TIMESTAMP
        );

    let realCurrent =
        current;

    if (
        !realCurrent &&
        history.length
    ) {
        realCurrent =
            history[
                history.length-1
            ].rating;
    }

    let realMax =
        max;

    if (
        !realMax &&
        history.length
    ) {
        realMax =
            Math.max(
                ...history.map(
                    x => x.rating
                )
            );
    }

    return {
        current:realCurrent,
        max:realMax,
        stars:
            normalizeStars(
                stars,
                realCurrent
            ),
        history:filtered,
        available:
            realCurrent > 0 ||
            filtered.length > 0,
        status:
            realCurrent > 0 ||
            filtered.length > 0
                ? "ok"
                : "unavailable"
    };
}

async function loadCC(member) {
    const handle =
        member.cc ||
        getPrivateCC(member);

    if (!handle)
        return emptyCC("unavailable");

    const url =
        `${CC_API}/${
            encodeURIComponent(handle)
        }/contests`;

    try {
        const data =
            await fetchJSON(
                url,
                FETCH_TIMEOUT
            );

        return normalizeCC(data);
    } catch (err) {
        console.warn(
            "CC request failed:",
            err
        );

        return emptyCC(
            err?.name === "AbortError"
                ? "timeout"
                : "error"
        );
    }
}

async function loadCFAll(
    members,
    data,
    onUpdate
) {
    const deadline =
        Date.now() +
        CF_TOTAL_TIMEOUT;

    for (
        let i=0;
        i<members.length;
        i++
    ) {
        const member =
            members[i];

        const remaining =
            deadline-Date.now();

        if (remaining <= 0) {
            data[member.id].cf =
                emptyCF("timeout");

            onUpdate?.({
                type:"cf",
                member,
                data
            });

            continue;
        }

        data[member.id].cf =
            await loadCF(
                member,
                remaining
            );

        onUpdate?.({
            type:"cf",
            member,
            data
        });

        if (
            i <
            members.length-1
        ) {
            const left =
                deadline-Date.now();

            if (left > 0) {
                await sleep(
                    Math.min(
                        CF_DELAY,
                        left
                    )
                );
            }
        }
    }

    onUpdate?.({
        type:"cf-complete",
        data
    });
}

async function loadCCAll(
    members,
    data,
    onUpdate
) {
    await Promise.all(
        members.map(
            async member => {

                data[member.id].cc =
                    await loadCC(member);

                onUpdate?.({
                    type:"cc",
                    member,
                    data
                });
            }
        )
    );

    onUpdate?.({
        type:"cc-complete",
        data
    });
}

export async function loadAllData(
    members,
    onUpdate
) {
    const data = {};

    members.forEach(
        member => {
            data[member.id] = {
                cf:emptyCF("building"),
                cc:emptyCC("building")
            };
        }
    );

    /*
        CF and CC start together.
        This keeps total initialization
        close to the CF 9-second ceiling
        instead of adding the two times.
    */
    await Promise.all([
        loadCFAll(
            members,
            data,
            onUpdate
        ),

        loadCCAll(
            members,
            data,
            onUpdate
        )
    ]);

    return data;
}
