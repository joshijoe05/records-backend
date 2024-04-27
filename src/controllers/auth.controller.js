const Joi = require("joi");
const bcrypt = require("bcryptjs");

// Importing Models
const User = require("../models/user.model");
const jwtToken = require("../models/jwt-token.model");
const verificationToken = require("../models/verification-token.model");

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

// Importing Controllers
const handleSendEmail = require("./email.controller");

exports.handleRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userValidation = Joi.object({
            name: Joi.string().required(),
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

exports.handleSendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const userValidation = Joi.object({
            email: Joi.string().email().required(),
        });

        const { error } = userValidation.validate(req.body);

        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        }

        const { userId } = req.userSession;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(HttpStatusCode.NotFound).json({
                status: HttpStatusConstant.NOT_FOUND,
                code: HttpStatusCode.NotFound,
                message: ResponseMessageConstant.USER_NOT_FOUND,
            });
        }

        if (user.isEmailVerified) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: ResponseMessageConstant.EMAIL_ALREADY_VERIFIED,
            });
        }

        if (user.userId !== userId) {
            return res.status(HttpStatusCode.Forbidden).json({
                status: HttpStatusConstant.FORBIDDEN,
                code: HttpStatusCode.Forbidden,
                message: ResponseMessageConstant.INCORRECT_AUTHENTICATION,
            });
        }

        const checkIsVerificationTokenExists = await verificationToken.findOne({
            userId,
        });

        let emailAccessTokenId;

        if (checkIsVerificationTokenExists) {
            emailAccessTokenId =
                checkIsVerificationTokenExists.verificationTokenId;
        } else {
            const verificationTokenResponse = await verificationToken.create({
                verificationTokenId: generateUUID(),
                userId,
            });
            emailAccessTokenId = verificationTokenResponse.verificationTokenId;
        }

        const isEmailSend = await handleSendEmail({
            toAddresses: [email],
            source: CommonConstant.email.source.tech_team,
            subject: CommonConstant.email.verificationEmail.subject,
            htmlData: `<p>Hello User <br/>Welcome to Record<br/> Your verification link <a href="${process.env.EMAIL_BASE_URL}/verify-email/${emailAccessTokenId}">Verfiy Email</a></p>`,
        });

        if (isEmailSend) {
            return res.status(HttpStatusCode.Ok).json({
                status: HttpStatusConstant.OK,
                code: HttpStatusCode.Ok,
                message:
                    ResponseMessageConstant.VERIFICATION_EMAIL_SENT_SUCCESSFULLY,
            });
        } else {
            return res.status(HttpStatusCode.InternalServerError).json({
                status: HttpStatusConstant.ERROR,
                code: HttpStatusCode.InternalServerError,
                message: ResponseMessageConstant.VERIFICATION_EMAIL_SENT_FAILED,
            });
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.userController.handleSendVerificationEmailErrorLog,
            error.message,
        );
        return res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleVerifyEmail = async (req, res) => {
    try {
        const { verification_token } = req.body;

        const userValidation = Joi.object({
            verification_token: Joi.string().required(),
        });

        const { error } = userValidation.validate(req.body);
        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        }

        const checkIsVerificationTokenExists = await verificationToken.findOne({
            verificationTokenId: verification_token,
        });

        if (!checkIsVerificationTokenExists) {
            return res.status(HttpStatusCode.NotFound).json({
                status: HttpStatusConstant.NOT_FOUND,
                code: HttpStatusCode.NotFound,
                message: ResponseMessageConstant.VERIFICATION_TOKEN_NOT_FOUND,
            });
        } else {
            const { userId } = checkIsVerificationTokenExists;

            const checkIsUserExists = await User.findOne({
                userId,
            });

            if (!checkIsUserExists) {
                return res.status(HttpStatusCode.NotFound).json({
                    status: HttpStatusConstant.NOT_FOUND,
                    code: HttpStatusCode.NotFound,
                    message: ResponseMessageConstant.USER_NOT_FOUND,
                });
            } else {
                if (checkIsUserExists.isEmailVerified) {
                    return res.status(HttpStatusCode.BadRequest).json({
                        status: HttpStatusConstant.BAD_REQUEST,
                        code: HttpStatusCode.BadRequest,
                        message: ResponseMessageConstant.EMAIL_ALREADY_VERIFIED,
                    });
                } else {
                    await User.findOneAndUpdate(
                        {
                            userId,
                        },
                        {
                            $set: {
                                isEmailVerified: true,
                            },
                        },
                    );
                    await verificationToken.findOneAndDelete({
                        verificationTokenId: verificationToken,
                    });
                    res.status(HttpStatusCode.Ok).json({
                        status: HttpStatusConstant.OK,
                        code: HttpStatusCode.Ok,
                        message:
                            ResponseMessageConstant.EMAIL_VERIFIED_SUCCESSFULLY,
                    });
                }
            }
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.userController.handleSendVerificationEmailErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};
