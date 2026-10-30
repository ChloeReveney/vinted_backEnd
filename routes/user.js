const express = require("express");
const User = require("../models/User");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// ROUTE SIGN-UP :
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const newSalt = uid2(24);
    const newToken = uid2(36);
    const newHash = encBase64.stringify(SHA256(req.body.password + newSalt));
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(409).json({ message: "email already exists" });
    }
    if (req.body.email && req.body.username) {
      const newUser = new User({
        email: req.body.email,
        account: {
          username: req.body.username,
        },
        newsletter: req.body.newsletter,
        token: newToken,
        hash: newHash,
        salt: newSalt,
      });
      if (req.files) {
        const base64Picture = convertToBase64(req.files.picture);
        const profilePicture = await cloudinary.uploader.upload(base64Picture);
        newUser.account.avatar = profilePicture;
      }
      await newUser.save();
      return res.status(201).json({
        _id: newUser._id,
        token: newUser.token,
        account: { username: req.body.username },
      });
    } else {
      return res.status(400).json("email ou username non renseigné");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ROUTE LOGIN :
router.post("/user/login", async (req, res) => {
  try {
    const foundUser = await User.findOne({ email: req.body.email });
    if (!foundUser) {
      return res.status(401).json({ message: "Wrong email or password" });
    } else {
      const comparativeHash = encBase64.stringify(
        SHA256(req.body.password + foundUser.salt),
      );
      if (comparativeHash !== foundUser.hash) {
        return res.status(401).json({ message: "Wrong email or password" });
      } else {
        return res.status(200).json({
          _id: foundUser._id,
          token: foundUser.token,
          account: { username: foundUser.account.username },
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
