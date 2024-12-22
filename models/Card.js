const mongoose = require("mongoose");

const attackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le nom de l'attaque est requis"],
    trim: true,
    minlength: [2, "Le nom de l'attaque doit contenir au moins 2 caractères"],
    maxlength: [30, "Le nom de l'attaque ne peut pas dépasser 30 caractères"],
  },
  damage: {
    type: Number,
    required: [true, "Les dégâts sont requis"],
    min: [0, "Les dégâts ne peuvent pas être négatifs"],
    max: [300, "Les dégâts ne peuvent pas dépasser 300"],
  },
  cost: [
    {
      type: String,
      enum: {
        values: [
          "Fire",
          "Water",
          "Grass",
          "Electric",
          "Psychic",
          "Fighting",
          "Normal",
          "Colorless",
        ],
        message: "Type d'énergie non valide",
      },
    },
  ],
});

const cardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de la carte est requis"],
      trim: true,
      minlength: [2, "Le nom doit contenir au moins 2 caractères"],
      maxlength: [30, "Le nom ne peut pas dépasser 30 caractères"],
    },
    type: {
      type: String,
      required: [true, "Le type de Pokémon est requis"],
      enum: {
        values: [
          "Fire",
          "Water",
          "Grass",
          "Electric",
          "Psychic",
          "Fighting",
          "Normal",
        ],
        message: "Type de Pokémon non valide",
      },
    },
    rarity: {
      type: String,
      required: true,
      enum: {
        values: ["Common", "Uncommon", "Rare", "Ultra Rare", "Secret Rare"],
        message: "Rareté non valide",
      },
    },
    hp: {
      type: Number,
      required: [true, "Les points de vie sont requis"],
      min: [1, "Les points de vie doivent être supérieurs à 0"],
      max: [300, "Les points de vie ne peuvent pas dépasser 300"],
    },
    attacks: {
      type: [attackSchema],
      validate: {
        validator: function (attacks) {
          return attacks.length <= 4;
        },
        message: "Une carte ne peut pas avoir plus de 4 attaques",
      },
    },
    weakness: {
      type: String,
      enum: {
        values: [
          "Fire",
          "Water",
          "Grass",
          "Electric",
          "Psychic",
          "Fighting",
          "Normal",
        ],
        message: "Type de faiblesse non valide",
      },
    },
    resistance: {
      type: String,
      enum: {
        values: [
          "Fire",
          "Water",
          "Grass",
          "Electric",
          "Psychic",
          "Fighting",
          "Normal",
        ],
        message: "Type de résistance non valide",
      },
    },
    retreatCost: {
      type: Number,
      required: true,
      min: [0, "Le coût de retraite ne peut pas être négatif"],
      max: [4, "Le coût de retraite ne peut pas dépasser 4"],
    },
    imageUrl: {
      type: String,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(v);
        },
        message:
          "L'URL de l'image doit être valide et pointer vers une image (jpg, jpeg, png, gif)",
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'ID du propriétaire est requis"],
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true, // Permet null/undefined pour les cartes du pool
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Méthode virtuelle pour obtenir la valeur estimée de la carte
cardSchema.virtual("estimatedValue").get(function () {
  const rarityValues = {
    Common: 1,
    Uncommon: 2,
    Rare: 5,
    "Ultra Rare": 10,
    "Secret Rare": 20,
  };
  return rarityValues[this.rarity] * Math.ceil(this.hp / 10);
});

// Méthode pour vérifier si une carte est considérée comme puissante
cardSchema.methods.isPowerful = function () {
  const totalDamage = this.attacks.reduce(
    (sum, attack) => sum + attack.damage,
    0
  );
  return this.hp > 100 && totalDamage > 100;
};

// Middleware pre-save pour validation supplémentaire
cardSchema.pre("save", function (next) {
  if (this.resistance === this.weakness) {
    next(
      new Error("La résistance ne peut pas être du même type que la faiblesse")
    );
  }
  next();
});

// Création du modèle
const Card = mongoose.model("Card", cardSchema);

module.exports = Card;
