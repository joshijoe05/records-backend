const s3 = require("aws-sdk/clients/s3");
const ses = require("aws-sdk/clients/ses");

exports.s3Client = new s3({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS,
        secretAccessKey: process.env.AWS_SECRET,
    },
});

exports.sesClient = new ses({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS,
        secretAccessKey: process.env.AWS_SECRET,
    },
});
