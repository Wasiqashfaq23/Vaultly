const mongoose = require("mongoose")

const schema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    verificationHash: {
        type: String,
        default: null,
    },
    verificationExpires: {
        type: Date,
        default: null,
    },
    resetHash: {
        type: String,
        default: null,
    },
    resetExpires: {
        type: Date,
        default: null,
    }
})

const User = mongoose.model("user", schema)
module.exports = { User }