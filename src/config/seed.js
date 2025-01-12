const mongoose = require("mongoose");
const Card = require("./models/Card");
const User = require("./models/User");

const mongoURI = "mongodb://localhost:27017/votre_nom_de_db"; 

const seedDatabase = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connecté à la base de données");

    await Card.deleteMany({});
    await User.deleteMany({});

    const cards = [
      {
        name: "Flame Burst",
        type: ["Fire"],
        rarity: "Rare",
        hp: 100,
        attacks: [
          {
            name: "Fire Spin",
            damage: 50,
            cost: ["Fire", "Colorless"],
            description: "Un puissant coup de feu.",
          },
        ],
        weakness: { type: "Water", value: 2 },
        resistance: { type: "Fighting", value: -30 },
        retreatCost: 2,
        imageUrl: "https://example.com/image1.jpg",
      },
      {
        name: "Water Splash",
        type: ["Water"],
        rarity: "Uncommon",
        hp: 80,
        attacks: [
          {
            name: "Aqua Jet",
            damage: 30,
            cost: ["Water"],
            description: "Un jet d'eau rapide.",
          },
        ],
        weakness: { type: "Lightning", value: 2 },
        resistance: { type: "Fire", value: -20 },
        retreatCost: 1,
        imageUrl: "https://example.com/image2.jpg",
      },
    ];

    const users = [
      {
        username: "user1",
        email: "user1@example.com",
        password: "password123",
        role: "user",
      },
      {
        username: "admin",
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
      },
    ];

    await Card.insertMany(cards);
    console.log("Cartes ajoutées avec succès");

    await User.insertMany(users);
    console.log("Utilisateurs ajoutés avec succès");

    await mongoose.connection.close();
    console.log("Connexion à la base de données fermée");
  } catch (error) {
    console.error("Erreur lors de la connexion à la base de données:", error);
  }
};

seedDatabase();