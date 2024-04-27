const axios = require("axios");

const axiosInstance = axios.create({
    withCredentials: true,
});

exports.getRequest = (data) => {
    const { path, config, success, error, final } = data;
    axiosInstance.get(path, config).then(success).catch(error).finally(final);
};

exports.postRequest = (data) => {
    const { path, payload, config, success, error, final } = data;
    axiosInstance
        .post(path, payload, config)
        .then(success)
        .catch(error)
        .finally(final);
};

exports.putRequest = (data) => {
    const { path, payload, success, error, config, final } = data;
    axiosInstance
        .put(path, payload, config)
        .then(success)
        .catch(error)
        .finally(final);
};

exports.deleteRequest = (data) => {
    const { path, success, error, final } = data;
    axiosInstance.delete(path).then(success).catch(error).finally(final);
};
