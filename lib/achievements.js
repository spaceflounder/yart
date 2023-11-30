

const buildText = (score, content) => `

:::aside
Achievement: ${content}

[Your score has just gone up ${score} points.]
:::

` 


function initializeAchievements() {

    let totalScore = 0;
    if (!story.achievements) {
        story.achievements = {};
    }
    for (const achievement in story.achievements) {
        const a = {...story.achievements[achievement]} ?? {};
        const score = a?.score ?? 0;
        totalScore += score;
        story.achievements[achievement]['awarded'] = false;
    }
    story.achievements.total = totalScore;
    story.achievements.score = 0;

}


function handleAward(award) {

    if (!story['achievements'][award]['awarded']) {
        story['achievements'][award]['awarded'] = true;
        const score = story['achievements'][award]?.score ?? 0;
        const content = story['achievements'][award]?.content ?? award;
        story['achievements'].score += score;
        achievementText += buildText(score, content);
    }    

}

