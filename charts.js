export function renderTeamGraph(ctx, teamData) {
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: teamData.map((member, index) => ({
                label: member.name,
                data: member.history.map(h => h.rating),
                borderColor: index === 0 ? '#3a66d4' : '#f59e0b',
                tension: 0.3
            }))
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}