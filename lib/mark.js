
import { micromark } from 'https://esm.sh/micromark@3?bundle'
import { directive, directiveHtml } from 'https://esm.sh/micromark-extension-directive@3?bundle'
import {gfm, gfmHtml} from 'https://esm.sh/micromark-extension-gfm@3?bundle'


function markdownProcess(s) {

    function dropcap(d) {
        const content = d.content
            .replace('<p>', '')
            .replace('</p>', '');
        this.tag('<div class="drop-cap">');
        this.tag(content);
        this.tag('</div>');
    }


    function div(d) {
        const content = d.content
            .replace('<p>', '')
            .replace('</p>', '');
        const label = d.label;
        this.tag(`<div class='${label}'>`);
        this.tag(content);
        this.tag('</div>');
    }
    
    
    function aside(d) {
        const content = d.content
            .replace('<p>', '')
            .replace('</p>', '');
        this.tag('<aside>');
        this.tag(content);
        this.tag('</aside>');
    }
    
    
    function kbd(d) {
        const content = d.label;
        this.tag('<kbd>');
        this.tag(content);
        this.tag('</kbd>');
    }


    function icon(d) {
        const content = d.label;
        this.tag('<span class="material-symbols-outlined">');
        this.tag(content);
        this.tag('</span>');
    }


    function big_icon(d) {
        const content = d.label;
        this.tag('<span class="material-symbols-outlined iconSize">');
        this.tag(content);
        this.tag('</span>');
    }


    function image(d) {
        let [content, alt] = d.label.split(',');
        content = content ?? '';
        alt = alt ?? '';
        content = content.trim();
        alt = alt.trim();
        this.tag(`<img src="${content}" alt="${alt}" class="image"></img>`);
    }


    s = micromark(s, {
        extensions: [directive(), gfm()],
        htmlExtensions: [directiveHtml({
            dropcap,
            aside,
            image,
            big_icon,
            kbd,
            div,
            icon,
        }), gfmHtml()]
    });
    

    return s;
}
