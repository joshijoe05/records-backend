const CommonConstant = require("../constants/common.constant");

const getRecordSignature = (cookies) => {
    const recordSignature = cookies
        .split(";")
        .find((cookie) =>
            cookie.trim().startsWith(CommonConstant.signatureCookieName),
        );
    return recordSignature ? recordSignature.split("=")[1] : null;
};

module.exports = getRecordSignature;
