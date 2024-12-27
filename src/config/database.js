const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB connecté: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error(`Erreur MongoDB: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB déconnecté");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error(`Erreur de connexion: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
