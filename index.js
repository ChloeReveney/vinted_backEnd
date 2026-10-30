require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

const cloudinary = require("cloudinary").v2;

app.use(cors());
app.use(express.json());
mongoose.connect(process.env.MONDB_URI);
cloudinary.config({
  cloud_name: "rsd8rxer",
  api_key: "681697915164953",
  api_secret: "hO2FNAjU8Ye6hjXcZjLn6ym5D14",
});

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Connexion établie !");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// IMPORT ROUTE USER :
const userRoutes = require("./routes/user");
app.use(userRoutes);

// IMPORT ROUTE OFFER :
const offerRoutes = require("./routes/offers");
app.use(offerRoutes);

app.all(/.*/, (req, res) => {
  return res.status(404).json("Not found");
});

app.listen(process.env.PORT, () => {
  console.log("Serveur démarré");
});
