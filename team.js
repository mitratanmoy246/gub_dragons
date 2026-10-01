const BASE_DATE = "2025-09-01T00:00:00Z";
const BASE_TIMESTAMP = new Date(BASE_DATE).getTime();

const teamMembers = [
    {
        name: "Tanmoy Mitra",
        shortName: "Tanmoy",
        id: "252002055",
        role: "CORE",
        publicCf: "mitratanmoy246",
        privateCf: "kryven",
        cc: null,
        showCC: true,
        color: "#ef4444"
    },
    {
        name: "Anikur Rahman",
        shortName: "Anik",
        id: "252002104",
        role: "CORE",
        publicCf: "Onex",
        privateCf: null,
        cc: "anik909",
        showCC: true,
        color: "#22c55e"
    },
    {
        name: "Abdul Kayum",
        shortName: "Kayum",
        id: "252002093",
        role: "CORE",
        publicCf: "abdulkayum",
        privateCf: null,
        cc: "abdulkayum",
        showCC: true,
        color: "#3b82f6"
    }
];

const achievements = [
    {
        title: "July Memorial Contest",
        place: "CHAMPION",
        teams: "30 TEAMS",
        team: "CODE GREY",
        members: "Anikur Rahman · Abdul Kayum",
        image: "code_grey_champ.jpg",
        type: "champion"
    },
    {
        title: "Intra Green Programming Contest",
        place: "1ST RUNNER-UP",
        teams: "70 TEAMS",
        team: "CODE GREY",
        members: "Tanmoy Mitra · Anikur Rahman",
        image: "code_grey_ru.png",
        type: "runner"
    }
];