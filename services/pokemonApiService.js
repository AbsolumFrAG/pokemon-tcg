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

  async searchCards(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.name) queryParams.append("q", `name:"${params.name}*"`);
      if (params.type) queryParams.append("q", `types:"${params.type}"`);
      if (params.page) queryParams.append("page", params.page);
      if (params.pageSize) queryParams.append("pageSize", params.pageSize);

      const response = await this.axiosInstance.get(`/cards?${queryParams}`);
      return this.formatCards(response.data.data);
    } catch (error) {
      throw new Error(
        `Erreur lors de la recherche des cartes: ${error.message}`
      );
    }
  }

  async getCardById(id) {
    try {
      const response = await this.axiosInstance.get(`/cards/${id}`);
      return this.formatCard(response.data.data);
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération de la carte: ${error.message}`
      );
    }
  }

  async getRandomCards(count = 10) {
    try {
      const response = await this.axiosInstance.get(
        `/cards?page=1&pageSize=${count}&orderBy=random`
      );
      return this.formatCards(response.data.data);
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des cartes aléatoires: ${error.message}`
      );
    }
  }

  formatCard(card) {
    return {
      apiId: card.id,
      name: card.name,
      type: card.types ? card.types[0] : "Normal",
      healthPoints: card.hp ? parseInt(card.hp) : 0,
      rarity: card.rarity || "Commune",
      attacks: card.attacks
        ? card.attacks.map((attack) => ({
            name: attack.name,
            damage: parseInt(attack.damage) || 0,
            energyCost: attack.convertedEnergyCost || 0,
            description: attack.text || "",
          }))
        : [],
      imageUrl: card.images.large || card.images.small,
      serie: card.set.name,
      number: card.number,
      price: card.cardmarket ? card.cardmarket.prices.averageSellPrice : 0,
      artist: card.artist,
      supertype: card.supertype,
    };
  }

  formatCards(cards) {
    return cards.map((card) => this.formatCard(card));
  }

  async getBoosterPack(cardsCount = 10) {
    try {
      const rarities = {
        common: Math.floor(cardsCount * 0.6),
        uncommon: Math.floor(cardsCount * 0.3),
        rare: Math.ceil(cardsCount * 0.1),
      };

      const boosterPack = [];

      for (const [rarity, count] of Object.entries(rarities)) {
        const response = await this.axiosInstance.get(`/cards`, {
          params: {
            q: `rarity:${rarity}`,
            orderBy: "random",
            pageSize: count,
          },
        });
        boosterPack.push(...this.formatCards(response.data.data));
      }

      return boosterPack;
    } catch (error) {
      throw new Error(
        `Erreur lors de la création du booster: ${error.message}`
      );
    }
  }
}

export default new PokemonTCGService();
