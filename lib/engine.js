

// these values must be serialized
let pageName = '';
let bufferText = '';

// these values don't have to be saved
let story = {};



function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function handleTemplates(s) {

    const matchSearch = s.matchAll(/\{\{.*\}\}/gm);
    if (matchSearch) {
        for (const m of matchSearch) {
            let match = m[0].replaceAll('{{', '').replaceAll('}}', '');
            if (match[0] === '.') {
                match = match.replace('.', '+');
            }
            if (match.indexOf('.') === -1) {
                const obj = pageName;
                const prop = match;
                if (/[A-Z]/.test(prop[0])) {
                    prop = prop[0].toLocaleLowerCase() + prop.slice(1);
                    let content = handleListTemplate(obj, prop);
                    content = capitalizeFirstLetter(content);
                    s = s.replaceAll(`{{${match}}}`, content);
                } else {
                    let content = handleListTemplate(obj, prop);
                    s = s.replaceAll(`{{${match}}}`, content);
                }
            } else {
                let obj = match.split('.')[0].trim();
                let prop = match.split('.')[1].trim();
                if (match[0] === '+') {
                    obj = obj.replace('+', '.');
                    match = match.replace('+', '.');
                }
                obj = parsePathMarkup(obj);
                if (/[A-Z]/.test(prop[0])) {
                    prop = prop[0].toLocaleLowerCase() + prop.slice(1);
                    let content = handleListTemplate(obj, prop);
                    content = handleTemplates(content);
                    content = capitalizeFirstLetter(content);
                    s = s.replaceAll(`{{${match}}}`, content);
                } else {
                    const content = handleListTemplate(obj, prop);
                    content = handleTemplates(content);
                    s = s.replaceAll(`{{${match}}}`, content);
                }    
            }
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
    } catch {
        showError(storyFile);
        throw (storyFile);
    }
    const debugMode = story['gameInfo']['debug'] ? true : false;
    if (debugMode) {
        const d = story['debug'] ?? {};
        MergeRecursive(story, d);
    }
    const importedStyle = story['gameInfo']['import'];
    if (importedStyle) {
        const styleElement = document.createElement("style");
        styleElement.innerHTML = importedStyle;
        document.head.appendChild(styleElement);
    }
    const style = document.createElement("style");
    const colorHighlight = story['gameInfo']['highlight'] ?? 'rgba(255, 255, 255, 0.9)';
    const colorForeground = story['gameInfo']['foreground'] ?? 'rgba(255, 255, 255, 0.7)';
    const colorBackground = story['gameInfo']['background'] ?? '#0d0d0d';
    style.innerHTML = `
    :root {
        background-color: ${colorBackground};
        color: ${colorForeground};
        font-family: ${story['gameInfo']['font']};
    }
    h1, h2, h3, h4 {
        font-family: ${story['gameInfo']['header font']};
        color: ${colorHighlight};
    }
    a {
        color: ${colorHighlight};
        font-family: ${story['gameInfo']['header font']};
    }
    `;
    document.head.appendChild(style);

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
