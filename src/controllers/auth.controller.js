const Joi = require("joi");
const bcrypt = require("bcryptjs");

// Importing Models
const User = require("../models/user.model");
const jwtToken = require("../models/jwt-token.model");

// Importing Constants
const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");
const CommonConstant = require("../constants/common.constant");
const ErrorLogConstant = require("../constants/error-log.constant");

// Importing Helpers
const generateUUID = require("../helpers/uuid.helper");
const { signToken, verifyToken } = require("../helpers/jwt.helper");
const getRecordSignature = require("../helpers/cookie.helper");

exports.handleRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userValidation = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(3).max(8).required(),
        });

        const { error } = userValidation.validate(req.body);

        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        }

        const userExists = await User.findOne({ email }).select("email -_id");

        if (userExists) {
            res.status(HttpStatusCode.Conflict).json({
                status: HttpStatusConstant.CONFLICT,
                code: HttpStatusCode.Conflict,
                message: ResponseMessageConstant.USER_ALREADY_EXISTS,
            });
        } else {
            const encryptedPassword = await bcrypt.hash(password, 10);
            const generatedUserId = generateUUID();
            await User.create({
                userId: generatedUserId,
                name,
                email,
                isActive: true,
                isManualAuth: true,
                profilePicture: `https://avatars.dicebear.com/api/initials/${name.replaceAll(
                    " ",
                    "-",
                )}.png`,
                password: encryptedPassword,
            });
            const generatedAccessToken = await signToken({
                userId: generatedUserId,
                name,
                email,
            });
            res.cookie(
                CommonConstant.signatureCookieName,
                generatedAccessToken,
                {
                    maxAge: 3600000,
                    httpOnly: false,
                    secure: true,
                    sameSite: "none",
                },
            )
                .status(HttpStatusCode.Created)
                .json({
                    status: HttpStatusConstant.CREATED,
                    code: HttpStatusCode.Created,
                });
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.authController.handleRegisterErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userValidation = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        });

        const { error } = userValidation.validate(req.body);

        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        }

        const user = await User.findOne({
            email,
        });

        if (!user) {
            return res.status(HttpStatusCode.NotFound).json({
                status: HttpStatusConstant.NOT_FOUND,
                code: HttpStatusCode.NotFound,
                message: ResponseMessageConstant.USER_NOT_FOUND,
            });
        } else {
            if (!user.isManualAuth) {
                return res.status(HttpStatusCode.BadRequest).json({
                    status: HttpStatusConstant.BAD_REQUEST,
                    code: HttpStatusCode.BadRequest,
                    message:
                        ResponseMessageConstant.ACCOUNT_ASSOCIATED_WITH_GOOGLE,
                });
            }

            const isValidPassword = await bcrypt.compare(
                password,
                user.password,
            );

            if (isValidPassword) {
                const { email, name, userId } = user;
                const generatedAccessToken = await signToken({
                    userId,
                    name,
                    email,
                });
                res.cookie(
                    CommonConstant.signatureCookieName,
                    generatedAccessToken,
                    {
                        maxAge: 3600000,
                        httpOnly: false,
                        secure: true,
                        sameSite: "none",
                    },
                )
                    .status(HttpStatusCode.Ok)
                    .json({
                        status: HttpStatusConstant.OK,
                        code: HttpStatusCode.Ok,
                    });
            } else {
                res.status(HttpStatusCode.Unauthorized).json({
                    status: HttpStatusConstant.UNAUTHORIZED,
                    code: HttpStatusCode.Unauthorized,
                    message: ResponseMessageConstant.INVALID_CREDENTIALS,
                });
            }
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.authController.handleLoginErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleLogout = async (req, res) => {
    try {
        const accessToken = getRecordSignature(req.headers.cookie);

        await jwtToken.findOneAndDelete({
            jwtTokenId: accessToken,
        });

        res.clearCookie(CommonConstant.signatureCookieName, {
            secure: true,
            sameSite: "none",
        })
            .status(HttpStatusCode.Ok)
            .json({
                status: HttpStatusConstant.OK,
                code: HttpStatusCode.Ok,
            });
    } catch (error) {
        console.log(
            ErrorLogConstant.authController.handleLogoutErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleGoogleSSO = async (req, res) => {
    try {
        const { email } = req.body;

        const userValidation = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().required(),
            googleId: Joi.string().required(),
            profilePicture: Joi.string().required(),
        });

        const { error } = userValidation.validate(req.body);

        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        }

        const userExists = await User.findOne({ email }).select(
            "email userId -_id",
        );

        const generatedUserId = generateUUID();
        const generatedAccessToken = await signToken({
            userId: !userExists ? generatedUserId : userExists.userId,
            email,
        });

        if (!userExists) {
            await User.create({
                userId: generatedUserId,
                isActive: true,
                isEmailVerified: true,
                ...req.body,
            });
            res.cookie(
                CommonConstant.signatureCookieName,
                generatedAccessToken,
                {
                    maxAge: 3600000,
                    httpOnly: false,
                    secure: true,
                    sameSite: "none",
                },
            )
                .status(HttpStatusCode.Created)
                .json({
                    status: HttpStatusConstant.CREATED,
                    code: HttpStatusCode.Created,
                });
        } else {
            res.cookie(
                CommonConstant.signatureCookieName,
                generatedAccessToken,
                {
                    maxAge: 3600000,
                    httpOnly: false,
                    secure: true,
                    sameSite: "none",
                },
            )
                .status(HttpStatusCode.Ok)
                .json({
                    status: HttpStatusConstant.OK,
                    code: HttpStatusCode.Ok,
                });
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.authController.handleGoogleLoginErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleVerifiySession = async (req, res) => {
    try {
        if (!req.headers.cookie) {
            return res.status(HttpStatusCode.Unauthorized).json({
                status: HttpStatusConstant.UNAUTHORIZED,
                code: HttpStatusCode.Unauthorized,
            });
        }

        const accessToken = getRecordSignature(req.headers.cookie);

        if (!accessToken) {
            return res.status(HttpStatusCode.Unauthorized).json({
                status: HttpStatusConstant.UNAUTHORIZED,
                code: HttpStatusCode.Unauthorized,
            });
        } else {
            const decodedToken = await verifyToken(accessToken);
            if (!decodedToken) {
                return res.status(HttpStatusCode.Unauthorized).json({
                    status: HttpStatusConstant.UNAUTHORIZED,
                    code: HttpStatusCode.Unauthorized,
                });
            }

            const user = await User.findOne({
                userId: decodedToken.userId,
                isActive: true,
            }).select(
                "-password -_id -isManualAuth -createdAt -updatedAt -googleId -__v",
            );

            if (!user || !user.isActive) {
                return res.status(HttpStatusCode.Unauthorized).json({
                    status: HttpStatusConstant.UNAUTHORIZED,
                    code: HttpStatusCode.Unauthorized,
                });
            }

            res.status(HttpStatusCode.Ok).json({
                status: HttpStatusConstant.OK,
                code: HttpStatusCode.Ok,
                data: userResponse,
            });
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.authController.handleVerifySessionErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};
