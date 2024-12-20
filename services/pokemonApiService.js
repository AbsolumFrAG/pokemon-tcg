import axios from "axios";

class PokemonTCGService {
  constructor() {
    this.apiUrl = "https://api.pokemontcg.io/v2";
    this.apiKey = process.env.POKEMON_TCG_API_KEY;
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        "X-Api-Key": this.apiKey,
      },
    });
  }
}
