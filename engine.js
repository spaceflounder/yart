
// these values must be serialized
let pageName = '';
let bufferText = '';

// these values don't have to be saved
let actions = {};
let story = {};



function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function handleTemplates(s) {

    const matchSearch = s.matchAll(/\{\{.*\}\}/gm);
    if (matchSearch) {
        for (const m of matchSearch) {
            const match = m[0].replaceAll('{{', '').replaceAll('}}', '');
            const obj = match.split('.')[0].trim();
            let prop = match.split('.')[1].trim();
            if (/[A-Z]/.test(prop[0])) {
                prop = prop[0].toLocaleLowerCase() + prop.slice(1);
                let content = story[obj][prop] ?? '!value not found!';
                content = capitalizeFirstLetter(content);
                s = s.replaceAll(`{{${match}}}`, content);
            } else {
                const content = story[obj][prop] ?? '!value not found!';
                s = s.replaceAll(`{{${match}}}`, content);
            }
        }    
    }

    return s;

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
        'search',
        'check',
        'cancel',
        'chat',
    ];
    if (possibleIcon === 'use') {
        possibleIcon = 'back_hand';
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


function handleActions(page) {
    const obj = {};
    if (page.buttons) {
        const buttons = [...page.buttons];
        for (const b of buttons) {
            const label = b?.label ?? undefined;
            const active = getActionActive(b);
            const action = () => {
                const buttons = document.querySelector("#btns");
                buttons.innerHTML = '';
                actions = {};
                if (b.change) {
                    MergeRecursive(story, b.change);
                }
                const nav = b.go;
                if (nav && story[nav]) {
                    const newRoom = story[nav];
                    actions = {};
                    pageName = nav;
                    if (b['content']) {
                        bufferText = b['content'];
                    }
                    execute(newRoom);
                } else {
                    execute();
                    execute(b);    
                }            
            };
            if (label && active) {
                obj[label] = {
                   label: setIcon(label),
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
    const obj = token.split('.')[0] ?? undefined;
    const prop = token.split('.')[1] ?? undefined;
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
        btn.onclick = actions[key].action;
        buttons.appendChild(btn);
    }
}


function execute(page) {
    if (!page) {
        page = story[pageName];
    }
    if (!page.content) {
        throw `Error: Page not implemented yet!`;
    }
    displayMsg(page);
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
    const firstPage = story['gameInfo']['start'];
    document.title = story['gameInfo']['title'];
    pageName = firstPage;
    execute(story[firstPage]);

}


function run() {

    restartStory();

}

run();
