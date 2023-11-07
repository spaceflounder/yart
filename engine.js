
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
        s = handleTemplates(page['msg']);
    } else {
        s = handleTemplates(page[state]['msg']);
    }
    s = SmartyPants(s);
    s = markdownProcess(s);
    if (bufferText !== '') {
        s = bufferText + s;
        bufferText = '';
    }
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

    ];
    if (iconSet.indexOf(possibleIcon) > -1) {
        return `<span class="material-symbols-outlined iconSize">${possibleIcon}</span>`;
    }
    return possibleIcon;
}


function getActionVisible(b) {
    if (!b.visible) {
        return true;
    } else {
        return [...b.visible].filter(x => conditionCheck(x)).length > 0;
    }
}


function handleActions(page) {
    const obj = {};
    if (page.buttons) {
        const buttons = [...page.buttons];
        for (const b of buttons) {
            const label = b?.label ?? undefined;
            const visible = getActionVisible(b);
            const action = () => {
                const buttons = document.querySelector("#btns");
                buttons.innerHTML = '';
                if (b.story) {
                    MergeRecursive(story, b.story);
                }
                const nav = b.nav;
                if (nav && story[nav]) {
                    const newRoom = story[nav];
                    actions = {};
                    pageName = nav;
                    if (b['msg']) {
                        bufferText = b['msg'];
                    }
                    execute(newRoom);
                } else {
                    execute();
                    execute(b);    
                }            
            };
            if (label && visible) {
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
    if (story[obj] && story[obj][prop]) {
        return story[obj][prop];
    }
    return token;
}


function singleConditionCheck(token) {
    const obj = token.split('.')[0];
    const prop = token.split('.')[1];
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
    if (op === '=') {
        return parseConditionToken(left) === parseConditionToken(right);
    }
    if (op === '!=') {
        return parseConditionToken(left) !== parseConditionToken(right);
    }
    throw `Condition command not understood: ${condition}`;
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
    for (const key of Object.keys(actions)) {
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
    if (!page.msg) {
        throw `Error: Page not implemented yet!`;
    }
    displayMsg(page);
    refreshActions(page);
}


function restartStory() {
    
    const storyFile = atob(stl);
    actions = {};
    story = JSON.parse(storyFile);
    const firstPage = story['gameInfo']['start'];
    document.title = story['gameInfo']['title'];
    pageName = firstPage;
    execute(story[firstPage]);

}


function run() {

    restartStory();

}

run();
