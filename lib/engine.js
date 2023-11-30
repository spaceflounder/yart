
import mustache from "./mustache.js";


// these values must be serialized
let pageName = '';
let bufferText = '';
let achievementText = '';

// these values don't have to be saved
let story = {};



function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function handleTemplates(s) {

    const matchSearch = s.matchAll(/\{\{.*\}\}/gm);
    if (matchSearch) {
        for (const m of matchSearch) {
            let text = m[0];
            const originalText = m[0];
            const toUpper = text.indexOf('^') > -1;
            if (toUpper) {
                text = text.replaceAll('^', '');
            }
            text = text.replaceAll('{{', '');
            text = text.replaceAll('}}', '');
            text = text.trim();
            if (text.indexOf('.') === -1) {
                text = pageName + '.' + text;
            }
            let sub = mustache.render(`{{${text}}}`, story).trim();
            if (toUpper) {
                sub = capitalizeFirstLetter(sub);
            }
            s = s.replace(originalText, sub);
        }
    }
    return s;

}


function clearOutput() {
    const output = document.querySelector("#out");
    output.innerHTML = '';
}


function displayMsg(page) {
    const output = document.querySelector("#out");
    const state = page?.state ?? 'default';
    let s = ''
    if (state === 'default') {
        s = handleTemplates(page['content']);
    } else {
        if (page[state]['content']) {
            s = handleTemplates(page[state]['content']);
        } else {
            s = handleTemplates(page['content']);
        }
    }
    if (bufferText !== '') {
        s = `\n\n${bufferText}\n\n` + s;
        bufferText = '';
    }
    if (achievementText !== '') {
        s += achievementText;
        achievementText = '';
    }
    s = SmartyPants(s);
    s = markdownProcess(s);
    output.innerHTML = s;
}


function parsePathMarkup(g) {
    if (g && g[0] === '.' && g[1] === '/') {
        const elements = pageName.split('/');
        elements.pop();
        const address = elements.join('/');
        g = g.replace('.' ,'');
        return address + g;
    }
    return g;
}



function MergeRecursive(obj1, obj2) {
    for (const p in obj2) {
      try {
        if ( obj2[p].constructor == Object ) {
          obj1[p] = MergeRecursive(obj1[p], obj2[p]);
  
        } else {
          obj1[p] = obj2[p];
  
        }
  
      } catch (_e) {
        obj1[p] = obj2[p];
  
      }
    }
    return obj1;
}


function processMapMarkup(markup) {
    markup = markup.split('\n').
        map(x => handleTemplates(x)).
        map(x => {
            if (x.indexOf('---') > -1) {
                x = x.split('---');
                return x.map(x => x.trim()).join('---');
            }
            return x;
        }).
        join('\n\n');
    return markup;
}


function execute(page) {
    if (!page) {
        page = story[pageName];
    }
    if (!page.content && !page.map) {
        throw `Error: Page not implemented yet!`;
    }
    clearOutput();
    if (page.start) {
        handleListStart(page.start);
    }
    if (page.award) {
        handleAward(page.award);
    }
    if (page.content) {
        displayMsg(page);
    }
    if (page.map) {
        const markup = processMapMarkup(page.map);
        renderChart(markup);
    }
    refreshActions(page);
}


function showError(error) {
    const output = document.getElementById('out');
    output.append(error);
}


function restartStory() {
    
    const storyFile = stl;
    actions = {};
    try {
        story = JSON.parse(storyFile);
    } catch (e) {
        showError(e);
        throw (e);
    }
    const debugMode = story['gameInfo']['debug'] ? true : false;
    if (debugMode) {
        const d = story['debug'] ?? {};
        MergeRecursive(story, d);
    }
    handleStyle();
    initializeAchievements();
    const firstPage = story['gameInfo']['start'];
    document.title = story['gameInfo']['title'];
    pageName = firstPage;
    handleLists(story);
    execute(story[firstPage]);

}


function run() {

    restartStory();

}

run();
