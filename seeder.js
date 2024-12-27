require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const Card = require("./src/models/Card"); // Adjust the path as necessary

const fetchPokemonData = async (id) => {
  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = response.data;
    const types = data.types.map((type) => type.type.name);
    let type = types[0]; // Select the first type

    // Map or filter types to match the model's allowed types
    const allowedTypes = [
      "Grass",
      "Fire",
      "Water",
      "Lightning",
      "Fighting",
      "Psychic",
      "Colorless",
    ];
    if (!allowedTypes.includes(type)) {
      type = "Colorless"; // Default type if not matching
    }

    const attacks = data.moves.slice(0, 2).map((move) => ({
      name: move.move.name,
      damage: 10, // Placeholder damage value
      cost: ["Colorless"], // Placeholder cost
      description: "Basic attack.", // Placeholder description
    }));

    return {
      name: data.name,
      type: type,
      rarity: "Common", // Can be determined based on Pokémon's popularity or other criteria
      hp: data.stats.find((stat) => stat.stat.name === "hp").base_stat,
      attacks: attacks,
      weakness: {
        type: "Fire", // Can be determined based on Pokémon's type
        value: 2,
      },
      resistance: {
        type: "Lightning", // Can be determined based on Pokémon's type
        value: -30,
      },
      retreatCost: data.types.length, // Placeholder retreat cost
      imageUrl: data.sprites.front_default,
    };
  } catch (error) {
    console.error(`Error fetching data for Pokémon ID ${id}:`, error);
    return null;
  }
};

(async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Drop existing cards (optional)
    await Card.deleteMany({});
    console.log("Existing cards deleted");

    // Fetch data for 100 Pokémon
    const pokemonIds = Array.from({ length: 100 }, (_, i) => i + 1);
    const fetchPromises = pokemonIds.map((id) => fetchPokemonData(id));
    const fetchedData = await Promise.all(fetchPromises);

    // Filter out any null entries (failed fetches)
    const cardsData = fetchedData.filter((card) => card !== null);

    // Seed the database
    const createdCards = await Card.create(cardsData);
    console.log(`${createdCards.length} cards inserted`);
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed");
  }
})();
