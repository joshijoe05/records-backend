const CommonConstant = require("../constants/common.constant");
const ErrorLogConstant = require("../constants/error-log.constant");

const { sesClient } = require("../configs/aws.config");

const handleSendEmail = async (payload) => {
    const {
        toAddresses = [],
        subject = "",
        source = "",
        htmlData = "",
        ccEmails = [],
    } = payload;

    const params = {
        Destination: {
            CcAddresses: ccEmails,
            ToAddresses: toAddresses,
        },
        Message: {
            Body: {
                Html: {
                    Charset: CommonConstant.email.charSet,
                    Data: htmlData,
                },
            },
            Subject: {
                Charset: CommonConstant.email.charSet,
                Data: subject,
            },
        },
        Source: source,
    };

    return await sesClient
        .sendEmail(params)
        .promise()
        .then(() => {
            return true;
        })
        .catch((error) => {
            console.log(
                ErrorLogConstant.emailController.handleSendEmailErrorLog,
                error.message,
            );
            return false;
        });
};

module.exports = handleSendEmail;
