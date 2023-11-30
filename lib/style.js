
function handleStyle() {
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
}
