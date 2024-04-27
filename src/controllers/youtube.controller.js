const Joi = require("joi");

// Importing models
const Youtube_Course = require("../models/youtube-course.model");

// Importing Constants
const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");
const CommonConstant = require("../constants/common.constant");
const ErrorLogConstant = require("../constants/error-log.constant");

// Importing Helpers
const generateUUID = require("../helpers/uuid.helper");

// Importing services
const youtubeService = require("../services/youtube.service");

// Importing utils
const commonUtils = require("../utils/common.util");

exports.handleCreateYouTubeCourse = async (req, res) => {
    try {
        const { youtubePlayListUrl } = req.body;

        const { userId } = req.userSession;

        const youtubePlayListValidation = Joi.object({
            youtubePlayListUrl: Joi.string().required(),
        });

        const { error } = youtubePlayListValidation.validate(req.body);

        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        }

        const playlistId = commonUtils.extractPlaylistId(youtubePlayListUrl);

        if (!playlistId) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.ERROR,
                code: HttpStatusCode.BadRequest,
            });
        }

        const isPlaylistIdExists = await Youtube_Course.exists({
            authorId: userId,
            playlistId,
        });

        if (isPlaylistIdExists) {
            return res.status(HttpStatusCode.Conflict).json({
                status: HttpStatusConstant.CONFLICT,
                code: HttpStatusCode.Conflict,
                message: ResponseMessageConstant.PLAYLIST_ALREADY_EXISTS,
            });
        }

        youtubeService.handleGetYoutubePlaylistItems({
            payload: {
                playlistId,
            },
            success: async ({ data: youtubePlaylistItemsResponse }) => {
                youtubeService.handleGetYoutubePlaylistDetails({
                    payload: {
                        playlistId,
                    },
                    success: async ({ data: youtubePlaylistDetails }) => {
                        const youtubeCoursePayload = {
                            youtubeCourseId: generateUUID(),
                            playlistId,
                            authorId: userId,
                            courseMetaData:
                                youtubePlaylistDetails.items.length > 0
                                    ? youtubePlaylistDetails.items[0].snippet
                                    : null,
                            courseContent: youtubePlaylistItemsResponse.items,
                            courseProgress:
                                youtubePlaylistItemsResponse.items.map(
                                    (item) => {
                                        return {
                                            videoId:
                                                item.snippet.resourceId.videoId,
                                            isCompleted: false,
                                        };
                                    },
                                ),
                        };
                        const youtubeCourseCreationResponse =
                            await Youtube_Course.create(youtubeCoursePayload);

                        res.status(HttpStatusCode.Created).json({
                            status: HttpStatusConstant.SUCCESS,
                            code: HttpStatusCode.Created,
                            data: youtubeCourseCreationResponse,
                        });
                    },
                    error: (error) => {
                        console.log(
                            ErrorLogConstant.youtubeController
                                .handleGetYoutubePlaylistDetailsErrorLog,
                            error.message,
                        );
                        res.status(HttpStatusCode.InternalServerError).json({
                            status: HttpStatusConstant.ERROR,
                            code: HttpStatusCode.InternalServerError,
                            message:
                                ResponseMessageConstant.PLAYLIST_DETAILS_FETCHING_FAILED,
                        });
                    },
                });
            },
            error: (err) => {
                console.log(
                    ErrorLogConstant.youtubeController
                        .handleGetYoutubePlaylistItemsErrorLog,
                    err.message,
                );
                res.status(HttpStatusCode.InternalServerError).json({
                    status: HttpStatusConstant.ERROR,
                    code: HttpStatusCode.InternalServerError,
                    message:
                        ResponseMessageConstant.PLAYLIST_ITEMS_FETCHING_FAILED,
                });
            },
        });
    } catch (error) {
        console.log(
            ErrorLogConstant.youtubeController
                .handleCreateYouTubeCourseErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleGetAllNotStartedCoursesByUserId = async (req, res) => {};
exports.handleGetCourseDetails = async (req, res) => {};
exports.handleDeleteCourseByCourseId = async (req, res) => {};
