const generatemessage = (username, text) => {
    return {
        username,
        text, 
        createdAt : new Date().getTime()
    }
};

const generatelocation = (username, location) => {
    return {
        username,
        location,
        createdAt: new Date().getTime()
    }
};


module.exports = {
    generatemessage,
    generatelocation
}