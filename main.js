import { teamMembers } from './team.js';
import { getCFProfile, getCCProfile, getCFHistory, getCCHistory } from './api.js';

Chart.defaults.color = '#9ca3af';
Chart.defaults.font.family = '"Fira Code", monospace';

function renderGraph(canvasId, datasets) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const mappedData = datasets.flatMap(member => {
        if (member.cfAccounts) {
            return member.cfAccounts.map(acc => ({
                name: acc,
                history: member.histories[acc],
                color: member.cfColors[acc],
                bgColor: member.bgColors[acc]
            }));
        }

        return [{
            name: member.name,
            history: member.history,
            color: member.color,
            bgColor: member.bgColor
        }];
    });

    const styledDatasets = mappedData.map(d => ({
        label: d.name,
        data: d.history,
        borderColor: d.color,
        backgroundColor: d.bgColor,
        fill: false,
        tension: 0.15
    }));

    const w = window.innerWidth;
    const isSm = w < 640;
    const isMd = w >= 640 && w < 1024;

    const borderWidth = isSm ? 2 : isMd ? 3 : 4;
    const pointRadius = isSm ? 2 : isMd ? 3 : 5;
    const pointHoverRadius = isSm ? 4 : isMd ? 6 : 9;
    const legendPadding = isSm ? 10 : isMd ? 20 : 30;
    const legendFontSize = isSm ? 11 : isMd ? 13 : 15;
    const tickFontSize = isSm ? 10 : isMd ? 11 : 13;
    const maxXTicks = isSm ? 6 : isMd ? 8 : 12;
    const maxYTicks = isSm ? 5 : isMd ? 6 : 8;
    const tooltipPadding = isSm ? 8 : 15;

    const finalData = styledDatasets.map(d => ({
        ...d,
        borderWidth,
        pointRadius,
        pointHoverRadius,
        pointBackgroundColor: d.borderColor,
        pointBorderColor: '#000',
        pointBorderWidth: 2
    }));

    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            datasets: finalData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: legendPadding,
                        font: {
                            size: legendFontSize,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10,10,10,0.95)',
                    titleFont: {
                        size: isSm ? 12 : 14
                    },
                    bodyFont: {
                        size: isSm ? 12 : 14,
                        weight: 'bold'
                    },
                    padding: tooltipPadding,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'MMM d, yyyy'
                    },
                    min: '2025-09-01T00:00:00Z',
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: tickFontSize
                        },
                        maxTicksLimit: maxXTicks
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: tickFontSize
                        },
                        maxTicksLimit: maxYTicks
                    }
                }
            }
        }
    });
}

async function startEngine() {
    console.log("🚀 GUB_Dragons Telemetry System Booting...");

    // 1. Load Profiles
    for (const member of teamMembers) {

        // Codeforces
        for (const acc of member.cfAccounts) {
            const cf = await getCFProfile(acc);

            document.getElementById(`cf-cur-rating-${acc}`).textContent = cf.curRating;
            document.getElementById(`cf-cur-tier-${acc}`).textContent = cf.curTier;
            document.getElementById(`cf-max-rating-${acc}`).textContent = cf.maxRating;
            document.getElementById(`cf-max-tier-${acc}`).textContent = cf.maxTier;
        }

        // CodeChef
        const cc = await getCCProfile(member.cc);

        document.getElementById(`cc-cur-rating-${member.cc}`).textContent = cc.curRating;
        document.getElementById(`cc-cur-tier-${member.cc}`).textContent = cc.curTier;
        document.getElementById(`cc-max-rating-${member.cc}`).textContent = cc.maxRating;
        document.getElementById(`cc-max-tier-${member.cc}`).textContent = cc.maxTier;
    }

    // 2. Build Codeforces Graph
    const cfData = [];

    for (const member of teamMembers) {
        const histories = {};

        for (const acc of member.cfAccounts) {
            histories[acc] = await getCFHistory(acc);
        }

        cfData.push({
            ...member,
            histories
        });
    }

    document.getElementById('cf-loader').classList.add('hidden');
    document.getElementById('cf-canvas-container').classList.remove('hidden');

    renderGraph('cfChart', cfData);

    // 3. Build CodeChef Graph
    const ccData = [];

    for (const member of teamMembers) {
        ccData.push({
            ...member,
            history: await getCCHistory(member.cc)
        });
    }

    document.getElementById('cc-loader').classList.add('hidden');
    document.getElementById('cc-canvas-container').classList.remove('hidden');

    renderGraph('ccChart', ccData);

    console.log("✅ Boot Sequence Complete.");
}

window.addEventListener('load', startEngine);
