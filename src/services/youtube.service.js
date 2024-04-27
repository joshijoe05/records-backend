// Importing configs
const httpRequest = require("../configs/http-request.config");

// Importing constants
const ServicePathConstant = require("../constants/service-path.constant");

exports.handleGetYoutubePlaylistItems = ({ payload, success, error }) => {
    httpRequest.getRequest({
        path: ServicePathConstant.youtube.getPlaylistItems({
            apiKey: process.env.YOUTUBE_API_KEY,
            playlistId: payload.playlistId,
        }),
        payload,
        success,
        error,
    });
};

exports.handleGetYoutubePlaylistDetails = ({ payload, success, error }) => {
    httpRequest.getRequest({
        path: ServicePathConstant.youtube.getPlaylistDetails({
            apiKey: process.env.YOUTUBE_API_KEY,
            id: payload.playlistId,
        }),
        payload,
        success,
        error,
    });
};
