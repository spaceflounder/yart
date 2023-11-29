import { P } from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid-d06ecb0d.js";


let actions = {};

/*

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


*/


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
    const singleRegexCheck = /\((.*)\)/g;
    const matches = [...token.matchAll(singleRegexCheck)][0][1];
    if (matches) {
        token = matches;
    } else {
        throw `Condition not understood: ${token}`;
    }
    const reverse = token.indexOf('!') === 0;
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
    const isRegexCheck = /\((.*)\) is \((.*)\)/gm;
    const notRegexCheck = /\((.*)\) not \((.*)\)/gm;
    const isMatch = [...condition.matchAll(isRegexCheck)][0];
    const notMatch = [...condition.matchAll(notRegexCheck)][0];
    if (isMatch && isMatch.length > 0) {
        const left = isMatch[1];
        const right = isMatch[2];
        return parseConditionToken(left) === parseConditionToken(right);
    } else if (notMatch && notMatch.length > 0) {
        const left = notMatch[1];
        const right = notMatch[2];
        return parseConditionToken(left) !== parseConditionToken(right);
    }
    try {
        return singleConditionCheck(condition);
    } catch {
        throw `Condition not understood: ${condition}`
    }
}


function setSpecialIcon(possibleIcon) {
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


function refreshActions(page) {
    const state = page?.state ?? 'default';
    const buttons = document.querySelector("#btns");
    buttons.innerHTML = '';
    actions = {...actions, ...handleActions(page)};
    if (state !== 'default') {
        const stateActions = handleActions(page[state]);
        actions = {...actions, ...stateActions};
    }
    const keys = Object.keys(actions);
    for (const key of keys) {
        const btn = document.createElement('button');
        if (actions[key].icon) {
            const iconContent = markdownProcess(actions[key].icon);
            btn.innerHTML = iconContent;    
        }
        btn.innerHTML += actions[key].label;
        btn.style = `background-color: ${actions[key].color};`;
        btn.onclick = actions[key].action;
        btn.alt = actions[key].label;
        buttons.appendChild(btn);
    }
}



function handleActions(page) {
    const obj = {};
    if (page.buttons) {
        const buttons = [...page.buttons];
        for (const b of buttons) {
            const label = b?.label ?? undefined;
            const color = b?.color ?? '#111131';
            const icon = b?.icon ?? '';
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
                   label: setSpecialIcon(label),
                   icon,
                   color,
                   action,
                }
            }
        }    
    }
    return obj;
}

