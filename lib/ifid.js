
function generateIFID() {

    const randomInt = () => Math.floor(Math.random() * 16);

    const generateHex = size => [...Array(size)].
        map(() => randomInt().
        toString(16)).
        join('');

    return [
        generateHex(8),
        generateHex(4),
        generateHex(4),
        generateHex(4),
        generateHex(12),
    ].
    join('-').
    toUpperCase();

}
