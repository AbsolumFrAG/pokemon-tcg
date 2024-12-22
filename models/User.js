const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Le nom d'utilisateur est requis"],
      unique: true,
      trim: true,
      minlength: [
        3,
        "Le nom d'utilisateur doit contenir au moins 3 caractères",
      ],
      maxlength: [
        20,
        "Le nom d'utilisateur ne peut pas dépasser 20 caractères",
      ],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores",
      ],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
        "Veuillez fournir un email valide",
      ],
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est requis"],
      minlength: [8, "Le mot de passe doit contenir au moins 8 caractères"],
      select: false, // Le mot de passe ne sera pas inclus dans les requêtes par défaut
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    coins: {
      type: Number,
      default: 100,
      min: [0, "Le nombre de pièces ne peut pas être négatif"],
    },
    profileImage: {
      type: String,
      default: "default-profile.png",
    },
    collectionStats: {
      totalCards: { type: Number, default: 0 },
      commonCards: { type: Number, default: 0 },
      uncommonCards: { type: Number, default: 0 },
      rareCards: { type: Number, default: 0 },
      ultraRareCards: { type: Number, default: 0 },
      secretRareCards: { type: Number, default: 0 },
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Liaison virtuelle avec les cartes
userSchema.virtual("cards", {
  ref: "Card",
  localField: "_id",
  foreignField: "owner",
});

// Hook pré-sauvegarde pour hacher le mot de passe
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour générer un JWT
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Méthode pour mettre à jour les statistiques de collection
userSchema.methods.updateCollectionStats = async function () {
  const cardCounts = await mongoose.model("Card").aggregate([
    { $match: { owner: this._id } },
    {
      $group: {
        _id: "$rarity",
        count: { $sum: 1 },
      },
    },
  ]);

  this.collectionStats = {
    totalCards: 0,
    commonCards: 0,
    uncommonCards: 0,
    rareCards: 0,
    ultraRareCards: 0,
    secretRareCards: 0,
  };

  cardCounts.forEach(({ _id, count }) => {
    const statKey = _id.toLowerCase().replace(" ", "") + "Cards";
    this.collectionStats[statKey] = count;
    this.collectionStats.totalCards += count;
  });

  await this.save();
};

// Méthode pour acheter un booster
userSchema.methods.buyBooster = async function (boosterPrice) {
  if (this.coins < boosterPrice) {
    throw new Error("Pas assez de pièces pour acheter un booster");
  }
  this.coins -= boosterPrice;
  await this.save();
};

// Méthode pour ajouter des pièces
userSchema.methods.addCoins = async function (amount) {
  this.coins += amount;
  await this.save();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
