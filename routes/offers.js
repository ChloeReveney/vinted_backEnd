const express = require("express");
const Offer = require("../models/Offer");
const router = express.Router();
const isAuthenticated = require("../isAuthenticated");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// ROUTE PUBLISH OFFER :
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json("Unauthorized");
      }
      if (
        req.body.description.length - 1 > 500 ||
        req.body.title.length - 1 > 50 ||
        req.body.price > 100000
      ) {
        return res.status(400).json("above limit");
      }
      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { MARQUE: req.body.brand },
          { TAILLE: req.body.size },
          { ETAT: req.body.condition },
          { COULEUR: req.body.color },
          { EMPLACEMENT: req.body.city },
        ],
        owner: req.user,
      });
      if (req.files) {
        const base64Picture = convertToBase64(req.files.picture);
        const uploadResult = await cloudinary.uploader.upload(base64Picture);
        newOffer.product_image = uploadResult;
      }
      await newOffer.save();
      return res.status(200).json(newOffer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

// ROUTE UPDATE OFFER :
// router.put("/update/offer/:id", async (req, res) => {
//   try {
//     // if (!req.user) {
//     //   return res.status(401).json("Unauthorized");
//     // }
//     const offerToUpdate = await Offer.findById(req.params.id);
//     offerToUpdate.req.body = req.body;
//     await offerToUpdate.save();
//     return res.status(200).json("Offer updated");
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// });

// ROUTE OFFERS FILTERS :
router.get("/offers", async (req, res) => {
  try {
    const maxPerPage = 2;
    let page = 1;
    const filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin || req.query.priceMax) {
      filters.product_price = {};
      if (req.query.priceMin) {
        filters.product_price.$gte = req.query.priceMin;
      }
      if (req.query.priceMax) {
        filters.product_price.$lte = req.query.priceMax;
      }
    }
    if (req.query.page) {
      page = req.query.page;
    }
    const skippy = (page - 1) * maxPerPage;
    if (req.query.sort) {
      const offersSorted = await Offer.find(filters)
        .sort({
          product_price: req.query.sort,
        })
        .limit(maxPerPage)
        .skip(skippy);
      return res.status(200).json(offersSorted);
    }
    const offers = await Offer.find(filters).limit(maxPerPage).skip(skippy);
    return res.status(200).json(offers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ROUTE READ OFFERS :
router.get("/offers/:id", async (req, res) => {
  try {
    const offersDetails = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    return res.status(200).json(offersDetails);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
