import { BASE_TIMESTAMP, BASE_DATE } from './team.js';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// CodeChef standard tier thresholds calculation
function getCCMaxTier(rating) {
    if (rating < 1400) return '1★';
    if (rating < 1600) return '2★';
    if (rating < 1800) return '3★';
    if (rating < 2000) return '4★';
    if (rating < 2200) return '5★';
    if (rating < 2500) return '6★';
    return '7★';
}

// --- PROFILE APIS ---
export async function getCFProfile(handle) {
    try {
        await delay(300);
        const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
        const data = await res.json();
        if (data.status === 'OK' && data.result.length > 0) {
            const u = data.result[0];
            return { 
                curRating: u.rating || 0, curTier: u.rank || 'Unrated',
                maxRating: u.maxRating || 0, maxTier: u.maxRank || 'Unrated'
            };
        }
    } catch (e) { console.warn(`CF Profile Error: ${handle}`); }
    return { curRating: 'Err', curTier: 'Err', maxRating: 'Err', maxTier: 'Err' };
}

export async function getCCProfile(handle) {
    try {
        const res = await fetch(`https://codechef-stats-api-two.vercel.app/profile/${handle}`);
        const data = await res.json();
        const profile = data?.profile || data;
        
        let currentStars = parseInt(String(profile?.stars || profile?.starCount || '0').replace(/[^0-9]/g, ''), 10) || 0;
        let currentRating = profile?.currentRating || profile?.rating || 0;
        let maxRating = profile?.highestRating || profile?.maxRating || 0;
        
        return { 
            curRating: currentRating, curTier: currentStars > 0 ? `${currentStars}★` : 'Unrated',
            maxRating: maxRating, maxTier: maxRating > 0 ? getCCMaxTier(maxRating) : 'Unrated'
        };
    } catch (e) { console.warn(`CC Profile Error: ${handle}`); }
    return { curRating: 'Err', curTier: 'Err', maxRating: 'Err', maxTier: 'Err' };
}

// --- HISTORY APIS (Graphing Logic) ---
export async function getCFHistory(handle) {
    try {
        await delay(500); 
        const res = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
        const data = await res.json();
        if (data.status !== 'OK') return [];
        
        const allContests = data.result;
        
        // Grab contests happening AFTER Sept 2025
        let history = allContests
            .filter(c => c.ratingUpdateTimeSeconds >= BASE_TIMESTAMP)
            .map(c => ({
                x: new Date(c.ratingUpdateTimeSeconds * 1000).toISOString(),
                y: c.newRating
            }));
            
        // Look for the rating right BEFORE Sept 2025 to prevent artificial dropping to 0
        const priorContests = allContests.filter(c => c.ratingUpdateTimeSeconds < BASE_TIMESTAMP);
        if (priorContests.length > 0) {
            const lastPriorRating = priorContests[priorContests.length - 1].newRating;
            history.unshift({ x: BASE_DATE, y: lastPriorRating });
        }
        
        return history;
    } catch (e) { return []; }
}

export async function getCCHistory(handle) {
    try {
        const res = await fetch(`https://codechef-stats-api-two.vercel.app/rating/${handle}`);
        const data = await res.json();
        if (!data.success || !data.ratingData) return [];

        const allContests = data.ratingData.map(c => {
            const parts = c.end_date.split(' ')[0].split('-');
            return { timeSec: new Date(parts[0], parts[1] - 1, parts[2]).getTime() / 1000, rating: Number(c.rating) };
        });

        let history = allContests
            .filter(c => c.timeSec >= BASE_TIMESTAMP)
            .map(c => ({ x: new Date(c.timeSec * 1000).toISOString(), y: c.rating }));

        const priorContests = allContests.filter(c => c.timeSec < BASE_TIMESTAMP);
        if (priorContests.length > 0) {
            const lastPriorRating = priorContests[priorContests.length - 1].rating;
            history.unshift({ x: BASE_DATE, y: lastPriorRating });
        }

        return history;
    } catch (e) { return []; }
}