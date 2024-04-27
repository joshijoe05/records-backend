exports.extractPlaylistId = (url) => {
    const regex = /list=([\w-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};
