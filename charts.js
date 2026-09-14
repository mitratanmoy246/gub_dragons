import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Tooltip,
    Legend
} from "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/+esm";

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Tooltip,
    Legend
);

const CF_BANDS = [
    [0,1199,"NEWBIE"],
    [1200,1399,"PUPIL"],
    [1400,1599,"SPECIALIST"],
    [1600,1899,"EXPERT"],
    [1900,2099,"CANDIDATE MASTER"],
    [2100,2299,"MASTER"],
    [2300,2399,"INTERNATIONAL MASTER"],
    [2400,2599,"GRANDMASTER"],
    [2600,2999,"INTERNATIONAL GRANDMASTER"],
    [3000,4000,"LEGENDARY GRANDMASTER"]
];

const CC_BANDS = [
    [0,1399,"1★"],
    [1400,1599,"2★"],
    [1600,1799,"3★"],
    [1800,1999,"4★"],
    [2000,2199,"5★"],
    [2200,2499,"6★"],
    [2500,3500,"7★"]
];

const CF_COLORS = [
    "rgba(130,130,130,.20)",
    "rgba(34,197,94,.18)",
    "rgba(59,130,246,.18)",
    "rgba(168,85,247,.18)",
    "rgba(239,68,68,.18)",
    "rgba(245,158,11,.18)",
    "rgba(234,179,8,.18)",
    "rgba(236,72,153,.18)",
    "rgba(220,38,38,.18)",
    "rgba(255,255,255,.16)"
];

const CC_COLORS = [
    "rgba(130,130,130,.20)",
    "rgba(255,255,255,.18)",
    "rgba(59,130,246,.18)",
    "rgba(34,197,94,.18)",
    "rgba(245,158,11,.18)",
    "rgba(249,115,22,.18)",
    "rgba(236,72,153,.18)"
];

function getHistory(
    member,
    data,
    type
) {
    const d =
        data[member.id] || {};

    return type === "cf"
        ? d.cf?.history || []
        : d.cc?.history || [];
}

function makePoints(history) {
    return history.map(
        (x,i) => {

            const previous =
                x.oldRating ??
                (
                    i > 0
                        ? history[i-1].rating
                        : null
                );

            return {
                x:x.time,
                y:x.rating,

                contestName:
                    x.contestName ||
                    "Unknown Contest",

                contestId:
                    x.contestId ??
                    "—",

                date:
                    new Date(
                        x.time
                    ).toLocaleDateString(
                        undefined,
                        {
                            day:"2-digit",
                            month:"short",
                            year:"numeric"
                        }
                    ),

                rating:
                    x.rating,

                previous,

                delta:
                    previous === null
                        ? null
                        : x.rating-previous,

                rank:
                    x.rank ??
                    "—"
            };
        }
    );
}

function bandPlugin(
    bands,
    colors
) {
    return {
        id:"ratingBands",

        beforeDraw(chart) {
            const {
                ctx,
                chartArea,
                scales
            } = chart;

            const y =
                scales?.y;

            if (!chartArea || !y)
                return;

            ctx.save();

            for (
                let i=0;
                i<bands.length;
                i++
            ) {
                const band =
                    bands[i];

                const low =
                    Math.max(
                        band[0],
                        y.min
                    );

                const high =
                    Math.min(
                        band[1] + 1,
                        y.max
                    );

                if (low >= high)
                    continue;

                const top =
                    y.getPixelForValue(
                        high
                    );

                const bottom =
                    y.getPixelForValue(
                        low
                    );

                ctx.fillStyle =
                    colors[i];

                ctx.fillRect(
                    chartArea.left,
                    top,
                    chartArea.right -
                        chartArea.left,
                    bottom-top
                );
            }

            ctx.restore();
        },

        afterDraw(chart) {
            const {
                ctx,
                chartArea,
                scales
            } = chart;

            const y =
                scales?.y;

            if (!chartArea || !y)
                return;

            ctx.save();

            ctx.font =
                "600 9px monospace";

            ctx.textAlign =
                "right";

            ctx.textBaseline =
                "bottom";

            for (
                let i=0;
                i<bands.length;
                i++
            ) {
                const band =
                    bands[i];

                if (
                    band[1] < y.min ||
                    band[0] > y.max
                ) {
                    continue;
                }

                const value =
                    Math.max(
                        band[0],
                        y.min
                    );

                const py =
                    y.getPixelForValue(
                        value
                    );

                if (
                    py < chartArea.top ||
                    py > chartArea.bottom
                ) {
                    continue;
                }

                ctx.fillStyle =
                    "rgba(255,255,255,.55)";

                ctx.fillText(
                    band[2],
                    chartArea.right-8,
                    py-4
                );
            }

            ctx.restore();
        }
    };
}

function getBounds(
    members,
    data,
    type,
    bands
) {
    let low = Infinity;
    let high = -Infinity;

    members.forEach(
        member => {

            const history =
                getHistory(
                    member,
                    data,
                    type
                );

            history.forEach(
                x => {
                    low =
                        Math.min(
                            low,
                            x.rating
                        );

                    high =
                        Math.max(
                            high,
                            x.rating
                        );
                }
            );
        }
    );

    if (!Number.isFinite(low))
        return null;

    let min =
        Math.max(
            0,
            low-100
        );

    let max =
        high+150;

    const topBand =
        bands[bands.length-1][1];

    if (max > topBand)
        max = topBand;

    if (max <= min)
        max = min+100;

    return {
        min,
        max
    };
}

function createChart(
    canvasId,
    members,
    data,
    type
) {
    const canvas =
        document.getElementById(
            canvasId
        );

    if (!canvas)
        return;

    const old =
        Chart.getChart(canvas);

    if (old)
        old.destroy();

    const bands =
        type === "cf"
            ? CF_BANDS
            : CC_BANDS;

    const colors =
        type === "cf"
            ? CF_COLORS
            : CC_COLORS;

    const datasets =
        members
            .map(
                member => {

                    const history =
                        getHistory(
                            member,
                            data,
                            type
                        );

                    if (!history.length)
                        return null;

                    return {
                        label:
                            member.name,

                        data:
                            makePoints(
                                history
                            ),

                        borderColor:
                            member.color,

                        backgroundColor:
                            member.color,

                        pointBackgroundColor:
                            member.color,

                        pointBorderColor:
                            member.color,

                        pointRadius:2.5,

                        pointHoverRadius:6,

                        borderWidth:2,

                        tension:.18,

                        spanGaps:false
                    };
                }
            )
            .filter(Boolean);

    if (!datasets.length)
        return;

    const bounds =
        getBounds(
            members,
            data,
            type,
            bands
        );

    new Chart(
        canvas,
        {
            type:"line",

            data:{
                datasets
            },

            plugins:[
                bandPlugin(
                    bands,
                    colors
                )
            ],

            options:{
                responsive:true,

                maintainAspectRatio:false,

                animation:{
                    duration:350
                },

                interaction:{
                    mode:"nearest",
                    intersect:false
                },

                scales:{
                    x:{
                        type:"linear",

                        grid:{
                            color:
                                "rgba(255,255,255,.055)"
                        },

                        ticks:{
                            color:
                                "rgba(255,255,255,.55)",

                            maxTicksLimit:8,

                            callback:value =>
                                new Date(
                                    value
                                ).toLocaleDateString(
                                    undefined,
                                    {
                                        month:"short",
                                        year:"numeric"
                                    }
                                )
                        }
                    },

                    y:{
                        min:
                            bounds?.min ?? 0,

                        max:
                            bounds?.max ?? undefined,

                        grid:{
                            color:
                                "rgba(255,255,255,.07)"
                        },

                        ticks:{
                            color:
                                "rgba(255,255,255,.65)",

                            callback:value =>
                                Number(
                                    value
                                ).toLocaleString()
                        }
                    }
                },

                plugins:{
                    legend:{
                        display:true,

                        position:"top",

                        align:"start",

                        labels:{
                            color:
                                "rgba(255,255,255,.78)",

                            usePointStyle:true,

                            pointStyle:"line",

                            padding:18,

                            boxWidth:28
                        }
                    },

                    tooltip:{
                        enabled:true,

                        backgroundColor:
                            "rgba(5,8,15,.97)",

                        borderColor:
                            "rgba(255,255,255,.18)",

                        borderWidth:1,

                        padding:12,

                        titleColor:"#fff",

                        bodyColor:
                            "rgba(255,255,255,.82)",

                        displayColors:true,

                        callbacks:{
                            title(items) {
                                return (
                                    items[0]
                                        ?.raw
                                        ?.contestName ||
                                    "Contest"
                                );
                            },

                            label(context) {
                                const p =
                                    context.raw;

                                const delta =
                                    p.delta === null
                                        ? "—"
                                        : (
                                            p.delta >= 0
                                                ? "+"
                                                : ""
                                        ) + p.delta;

                                return [
                                    `MEMBER: ${context.dataset.label}`,
                                    `DATE: ${p.date}`,
                                    `RATING: ${p.rating}`,
                                    `PREVIOUS: ${p.previous ?? "—"}`,
                                    `DELTA: ${delta}`,
                                    `RANK: ${p.rank}`,
                                    `CONTEST ID: ${p.contestId}`
                                ];
                            }
                        }
                    }
                }
            }
        }
    );
}

export function renderCFChart(
    canvasId,
    members,
    data
) {
    createChart(
        canvasId,
        members,
        data,
        "cf"
    );
}

export function renderCCChart(
    canvasId,
    members,
    data
) {
    createChart(
        canvasId,
        members,
        data,
        "cc"
    );
}

export function getCCStars(value) {
    const rating =
        Number(value);

    if (!Number.isFinite(rating))
        return 0;

    if (rating >= 2500) return 7;
    if (rating >= 2200) return 6;
    if (rating >= 2000) return 5;
    if (rating >= 1800) return 4;
    if (rating >= 1600) return 3;
    if (rating >= 1400) return 2;
    if (rating > 0) return 1;

    return 0;
}
