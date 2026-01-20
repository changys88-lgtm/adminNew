function roundUp(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.ceil(num * factor) / factor;
}

function roundDown(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.floor(num * factor) / factor;
}

module.exports = {
    roundUp,
    roundDown
}