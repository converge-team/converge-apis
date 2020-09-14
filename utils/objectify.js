module.exports = (mongoObject, leaveToken) => {

    let objToSign = Object.assign({}, mongoObject.toObject());
    delete objToSign.friends;

    if (!leaveToken) delete objToSign.api_token;

    delete objToSign.password;
    delete objToSign.__v;

    return objToSign;
}