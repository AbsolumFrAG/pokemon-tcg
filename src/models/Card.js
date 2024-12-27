const mongoose = require("mongoose");

const attackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le nom de l'attaque est requis"],
  },
  damage: {
    type: Number,
    required: [true, "Les dégâts sont requis"],
    min: [0, "Les dégâts ne peuvent pas être négatifs"],
  },
  cost: {
    type: [String],
    required: [true, "Le coût en énergie est requis"],
    validate: {
      validator: function (v) {
        return v.every((type) =>
          [
            "Grass",
            "Fire",
            "Water",
            "Lightning",
            "Fighting",
            "Psychic",
            "Colorless",
          ].includes(type)
        );
      },
      message: "Type d'énergie invalide",
    },
  },
  description: String,
});

const cardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de la carte est requis"],
      trim: true,
    },
    type: {
      type: [String],
      required: [true, "Le type est requis"],
      enum: [
        "Grass",
        "Fire",
        "Water",
        "Lightning",
        "Fighting",
        "Psychic",
        "Colorless",
      ],
    },
    rarity: {
      type: String,
      required: [true, "La rareté est requise"],
      enum: ["Common", "Uncommon", "Rare", "Ultra Rare", "Secret Rare"],
    },
    hp: {
      type: Number,
      required: [true, "Les points de vie sont requis"],
      min: [0, "Les points de vie ne peuvent pas être négatifs"],
      max: [300, "Les points de vie ne peuvent pas dépasser 300"],
    },
    attacks: [attackSchema],
    weakness: {
      type: {
        type: String,
        enum: ["Grass", "Fire", "Water", "Lightning", "Fighting", "Psychic"],
      },
      value: {
        type: Number,
        default: 2,
      },
    },
    resistance: {
      type: {
        type: String,
        enum: ["Grass", "Fire", "Water", "Lightning", "Fighting", "Psychic"],
      },
      value: {
        type: Number,
        default: -30,
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
        message: "URL d'image invalide",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances des recherches
cardSchema.index({ name: 1 });
cardSchema.index({ type: 1 });
cardSchema.index({ rarity: 1 });

const Card = mongoose.model("Card", cardSchema);

module.exports = Card;
