
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


    s = micromark(s, {
        extensions: [directive(), gfm()],
        htmlExtensions: [directiveHtml({
            dropcap,
            aside,
            kbd,
            icon,
        }), gfmHtml()]
    });

    return s;
}
