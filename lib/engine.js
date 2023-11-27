

// these values must be serialized
let pageName = '';
let bufferText = '';

// these values don't have to be saved
let actions = {};
let story = {};



/**
 * Get a random ordered version of an array.
 * @param {Array} array Array to shuffle.
 * @returns {Array} Returns the same array in random order.
 */
function shuffle(array) {

    // fisher-yates shuffle
    let currentIndex = array.length,
    randomIndex

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
    ]
    }

    return array
}


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function handleListTemplate(obj, prop) {
    let content = '';
    for (const key in story[obj]) {
        if (key.indexOf('--') > -1) {
            const name = key.split('--')[0].trim();
            if (name.toLocaleLowerCase() === prop.toLocaleLowerCase()) {
                const contentKey = `$$${name}-content`;
                content = story[obj][contentKey] ?? '';
            }
        }
    }
    if (content !== '') {
        return content;
    }
    content = story[obj][prop];
    if (!content) {
        return '';
    }
    return content;
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
                    const content = handleListTemplate(obj, prop);
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


function setIcon(possibleIcon) {
    const iconSet = [
        'west',
        'north',
        'south',
        'east',
        'north_west',
        'north_east',
        'south_west',
        'south_east',
        'back_hand',
        'door_open',
        'candle',
        'explosion',
        'map',
        'search',
        'vpn_key',
        'check',
        'cancel',
        'chat',
    ];
    if (possibleIcon === 'use') {
        possibleIcon = 'back_hand';
    }
    if (possibleIcon === 'key') {
        possibleIcon = 'vpn_key';
    }
    if (iconSet.indexOf(possibleIcon) > -1) {
        return `<span class="material-symbols-outlined iconSize">${possibleIcon}</span>`;
    }
    return possibleIcon;
}


function getActionActive(b) {
    if (!b.active) {
        return true;
    } else {
        return [...b.active].filter(x => conditionCheck(x)).length > 0;
    }
}


function parseList(name, listContent, commands) {

    const bl = story[pageName] ?? {};
    const indexKey = `$$${name}-indexer`;
    const contentKey = `$$${name}-content`;
    let stop = false;
    let index = bl[indexKey] ?? 0;
    if (commands.indexOf('reversed') > -1) {
        listContent = listContent.reverse();
    }
    if (commands.indexOf('shuffled') > -1) {
        listContent = shuffle(listContent);
    }
    if (commands.indexOf('stop') > -1) {
        stop = true;
    }
    const content = listContent[index] ?? '';
    bl[contentKey] = content;
    if (index < (listContent.length - 1)) {
        if (!stop) {
            index += 1;
        } else {
            if (index > -1) {
                index += 1;
            }
        }
    } else {
        if (!stop) {
            index = 0;
        }    
    }
    bl[indexKey] = index;

}


function handleLists(n) {
    for (const key in n) {
        const m = n[key];
        for (const subKey in m) {
            if (Array.isArray(m[subKey])) {
                if (subKey.indexOf('--') > -1) {
                    let [name, commands] = subKey.split('--');
                    name = name.trim();
                    commands = commands.trim();
                    if (commands.indexOf('list') > -1) {
                        const listContent = [...m[subKey]] ?? [];
                        parseList(name, listContent, commands);
                    }
                }
            }    
        }
    }
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


function handleActions(page) {
    const obj = {};
    if (page.buttons) {
        const buttons = [...page.buttons];
        for (const b of buttons) {
            const label = b?.label ?? undefined;
            const color = b?.color ?? '#111131';
            const active = getActionActive(b);
            const action = () => {
                const buttons = document.querySelector("#btns");
                buttons.innerHTML = '';
                actions = {};
                if (b.change) {
                    MergeRecursive(story, b.change);
                }
                handleLists(story);
                const nav = parsePathMarkup(b.go);
                if (nav && story[nav]) {
                    if (b['content']) {
                        bufferText = b['content'];
                        bufferText = handleTemplates(bufferText);
                    }
                    const newRoom = story[nav];
                    actions = {};
                    pageName = nav;
                    execute(newRoom);
                } else {
                    execute();
                    execute(b);    
                }            
            };
            if (label && active) {
                obj[label] = {
                   label: setIcon(label),
                   color,
                   action,
                }
            }
        }    
    }
    return obj;
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


function parseConditionToken(token) {
    let obj = '';
    let prop = '';
    if (token[0] === '.') {
        token = token.replace('.', '+');
    }
    if (token.indexOf('.') === -1) {
        obj = pageName;
        prop = token;
    } else {
        obj = token.split('.')[0] ?? undefined;
        prop = token.split('.')[1] ?? undefined;    
    }
    if (token[0] === '+') {
        token = token.replace('+', '.');
        obj = obj.replace('+', '.');
    }
    obj = parsePathMarkup(obj);
    for (const key in story[obj]) {
        if (key.indexOf('--') > -1) {
            const name = key.split('--')[0].trim();
            if (prop === name) {
                const contentKey = `$$${name}-content`;
                if (story[pageName][contentKey]) {
                    return story[pageName][contentKey];
                }
            }
        }
    }
    if (prop === 'state') {
        const state = story[obj][prop] ?? 'default';
        return state;
    }
    if (story[obj] && story[obj][prop]) {
        return story[obj][prop];
    }
    return token;
}


function singleConditionCheck(token) {
    const reverse = token.indexOf('!') > -1;
    token = token.replaceAll('!', '');
    const obj = token.split('.')[0];
    const prop = token.split('.')[1];
    if (reverse) {
        if (story[obj][prop]) {
            return false;
        }
        return true;
    }
    if (story[obj][prop]) {
        return true;
    }
    return false;
}


function conditionCheck(condition) {
    if (condition.indexOf(' ') === -1) {
        return singleConditionCheck(condition);
    }
    const [left, op, right] = condition.split(' ');
    if (op === 'is') {
        return parseConditionToken(left) === parseConditionToken(right);
    }
    if (op === 'not') {
        return parseConditionToken(left) !== parseConditionToken(right);
    }
    throw `Condition command not understood: ${condition}`;
}


function getSortedActions() {

    const keys = Object.keys(actions);
    let arr = [];

    const verbs = [
        'check',
        'cancel',
        'use',
        'search',
        'chat',
    ];

    const directions = [
        'north_west',
        'north',
        'north_east',
        'east',
        'south_east',
        'south',
        'south_west',
        'west',
    ];

    arr = [...verbs.filter(k => keys.indexOf(k) > -1)];
    arr = [...arr, ...keys.filter(k => verbs.indexOf(k) === -1 && directions.indexOf(k) === -1)];
    arr = [...arr, ...directions.filter(k => keys.indexOf(k) > -1)];

    return arr;

}


function refreshActions(page) {
    const state = page?.state ?? 'default';
    const buttons = document.querySelector("#btns");
    buttons.innerHTML = '';
    actions = {...actions, ...handleActions(page)};
    if (state !== 'default') {
        const stateActions = handleActions(page[state]);
        actions = {...actions, ...stateActions};
    }
    const sorted = getSortedActions();
    for (const key of sorted) {
        const btn = document.createElement('button');
        btn.innerHTML = actions[key].label;
        btn.style = `background-color: ${actions[key].color};`;
        btn.onclick = actions[key].action;
        btn.alt = actions[key].label;
        buttons.appendChild(btn);
    }
}


function handleListStart(token) {
    let obj = '';
    let prop = '';
    if (token[0] === '.') {
        token = token.replace('.', '+');
    }
    if (token.indexOf('.') === -1) {
        obj = pageName;
        prop = token;
    } else {
        obj = token.split('.')[0] ?? undefined;
        prop = token.split('.')[1] ?? undefined;    
    }
    if (token[0] === '+') {
        token = token.replace('+', '.');
        obj = obj.replace('+', '.');
    }
    obj = parsePathMarkup(obj);
    for (const key in story[obj]) {
        if (key.indexOf('--') > -1) {
            const name = key.split('--')[0].trim();
            if (prop === name) {
                const indexKey = `$$${name}-indexer`;
                story[obj][indexKey] = 0;
                return;
            }
        }
    }
    const indexKey = `$$${prop}-indexer`;
    story[obj][indexKey] = 0;
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
    
    const storyFile = decompress(stl);
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
