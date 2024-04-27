const Joi = require("joi");
const bcrypt = require("bcryptjs");

// Importing Constants
const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");
const CommonConstant = require("../constants/common.constant");
const ErrorLogConstant = require("../constants/error-log.constant");

// Importing Models
const User = require("../models/user.model");

// Importing Helpers
const generateUUID = require("../helpers/uuid.helper");

exports.handleCheckUsernameAvailability = async (req, res) => {
    try {
        const { username } = req.query;

        const userValidation = Joi.object({
            username: Joi.string().required(),
        });

        const { error } = userValidation.validate(req.query);

        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        }

        const checkIsUserExists = await User.exists({
            username,
        });

        if (checkIsUserExists) {
            res.status(HttpStatusCode.Conflict).json({
                status: HttpStatusConstant.CONFLICT,
                code: HttpStatusCode.Conflict,
                message: ResponseMessageConstant.USERNAME_ALREADY_EXISTS,
            });
        } else {
            res.status(HttpStatusCode.Ok).json({
                status: HttpStatusConstant.OK,
                code: HttpStatusCode.Ok,
                message: ResponseMessageConstant.USERNAME_AVAILABLE,
            });
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.userController
                .handleCheckUsernameAvailabilityErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleGetUserProfileInfo = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: ResponseMessageConstant.USER_ID_REQUIRED,
            });
        }

        const checkIsUserExists = await User.exists({
            userId,
        });

        if (!checkIsUserExists) {
            res.status(HttpStatusCode.NotFound).json({
                status: HttpStatusConstant.NOT_FOUND,
                code: HttpStatusCode.NotFound,
                message: ResponseMessageConstant.USER_NOT_FOUND,
            });
        } else {
            const userProfileInfoResponse = await User.aggregate([
                {
                    $match: {
                        userId,
                    },
                },
                {
                    $lookup: {
                        from: "skills",
                        localField: "skills",
                        foreignField: "skillId",
                        as: "skills",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        profilePicture: 1,
                        userId: 1,
                        username: 1,
                        skills: 1,
                        isOnBoardingCompleted: 1,
                    },
                },
            ]);

            res.status(HttpStatusCode.Ok).json({
                status: HttpStatusConstant.OK,
                code: HttpStatusCode.Ok,
                data: userProfileInfoResponse.length
                    ? userProfileInfoResponse[0]
                    : {},
            });
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.userController.handleUpdateUsernameErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleUpdateUsername = async (req, res) => {
    try {
        const { username } = req.body;

        const userValidation = Joi.object({
            username: Joi.string().required(),
        });

        const { error } = userValidation.validate(req.body);
        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        }

        const checkIsUsernameAlreadyExists = await User.exists({
            username,
        });

        if (checkIsUsernameAlreadyExists) {
            return res.status(HttpStatusCode.Conflict).json({
                status: HttpStatusConstant.CONFLICT,
                code: HttpStatusCode.Conflict,
                message: ResponseMessageConstant.USERNAME_ALREADY_EXISTS,
            });
        }

        const { userId } = req.userSession;

        const checkIsUserExists = await User.findOne({
            userId,
        });

        if (!checkIsUserExists) {
            res.status(HttpStatusCode.NotFound).json({
                status: HttpStatusConstant.NOT_FOUND,
                code: HttpStatusCode.NotFound,
                message: ResponseMessageConstant.USER_NOT_FOUND,
            });
        } else {
            await User.findOneAndUpdate(
                {
                    userId,
                },
                {
                    $set: {
                        ...req.body,
                    },
                },
            );

            res.status(HttpStatusCode.Ok).json({
                status: HttpStatusConstant.OK,
                code: HttpStatusCode.Ok,
                message: ResponseMessageConstant.USER_UPDATED_SUCCESSFULLY,
            });
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.userController.handleUpdateUsernameErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleOnBoarding = async (req, res) => {
    try {
        const onBoardingValidation = Joi.array()
            .items(Joi.string().required())
            .required();

        const { error } = onBoardingValidation.validate(req.body);

        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        }

        const { userId } = req.userSession;

        const checkIsUserExists = await User.findOne({
            userId,
        });
        if (!checkIsUserExists) {
            res.status(HttpStatusCode.NotFound).json({
                status: HttpStatusConstant.NOT_FOUND,
                code: HttpStatusCode.NotFound,
                message: ResponseMessageConstant.USER_NOT_FOUND,
            });
        } else {
            await User.findOneAndUpdate(
                {
                    userId,
                },
                {
                    $set: {
                        skills: req.body,
                        isOnBoardingCompleted: true,
                    },
                },
            );

            res.status(HttpStatusCode.Ok).json({
                status: HttpStatusConstant.OK,
                code: HttpStatusCode.Ok,
                message: ResponseMessageConstant.USER_UPDATED_SUCCESSFULLY,
            });
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.userController.handleOnBoardingErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};
