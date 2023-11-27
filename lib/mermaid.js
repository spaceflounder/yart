
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

mermaid.initialize({ 
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'dark'
});


const diagramScheme = `
graph TD




`;



async function renderChart(content) {


    content = diagramScheme + content;
    content = content.trim();

    const out = document.querySelector("#out");
    const pre = document.createElement('pre');
    pre.className = 'mermaid';
    pre.innerHTML = content;
    out.appendChild(pre);

    await mermaid.run();

}
