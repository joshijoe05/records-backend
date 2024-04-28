const Joi = require("joi");

// Importing Constants
const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");
const CommonConstant = require("../constants/common.constant");
const ErrorLogConstant = require("../constants/error-log.constant");

// Importing Helpers
const generateUUID = require("../helpers/uuid.helper");

// Importing models
const Skill = require("../models/skill.model");

exports.handleCreateSkill = async (req, res) => {
    try {
        const skillValidation = Joi.object({
            name: Joi.string().required(),
            skillCategoryId: Joi.string().required(),
            imageUrl: Joi.string().required(),
        });

        const { error } = skillValidation.validate(req.body);

        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        } else {
            const { name } = req.body;
            const transfromedSkillName = name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, " ");
            const isSkillExists = await Skill.exists({
                name: transfromedSkillName,
            });

            if (isSkillExists) {
                return res.status(HttpStatusCode.Conflict).json({
                    status: HttpStatusConstant.CONFLICT,
                    code: HttpStatusCode.Conflict,
                    message: ResponseMessageConstant.SKILL_ALREADY_EXISTS,
                });
            } else {
                const skillId = generateUUID();
                const skillCategory = await skillModel.create({
                    ...req.body,
                    skillId,
                    name: transfromedSkillName,
                });
                return res.status(HttpStatusCode.Created).json({
                    status: HttpStatusConstant.CREATED,
                    code: HttpStatusCode.Created,
                    data: skillCategory,
                });
            }
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.skillController.handleCreateSkillErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleGetAllSkills = async (req, res) => {
    try {
    } catch (error) {
        console.log(
            ErrorLogConstant.skillController.handleGetAllSkillsErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};
