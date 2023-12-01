

function handleInherits(page) {

    const skip = ['award', 'content', 'inherits', 'buttons'];
    const inherited = page?.inherits ?? [];
    for (const inheritedPageName of inherited) {
        const inheritedPage = story[inheritedPageName];
        for (const key in inheritedPage) {
            if (skip.indexOf(key) === -1) {
                if (Array.isArray(inheritedPage[key])) {
                    //page[key] = [...inheritedPage[key]];
                    //console.log(page);
                } else if (typeof inheritedPage[key] === 'object') {
                    page[key] = {...inheritedPage[key]};
                } else {
                    page[key] = inheritedPage[key];
                }
            }
        }
        actions = {...actions, ...handleActions(inheritedPage)};
    }

}
