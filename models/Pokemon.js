import mongoose from 'mongoose';

const attackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    damage: {
        type: Number,
        required: true
    },
    cost: [{
        type: String,
        enum: ['Grass', 'Fire', 'Water', 'Lightning', 'Fighting', 'Psychic', 'Colorless'],
        required: true
    }]
});

const pokemonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Grass', 'Fire', 'Water', 'Lightning', 'Fighting', 'Psychic', 'Colorless']
    },
    hp: {
        type: Number,
        required: true,
        min: 1,
        max: 300
    },
    attacks: [attackSchema],
    weakness: {
        type: String,
        enum: ['Grass', 'Fire', 'Water', 'Lightning', 'Fighting', 'Psychic']
    },
    resistance: {
        type: String,
        enum: ['Grass', 'Fire', 'Water', 'Lightning', 'Fighting', 'Psychic']
    },
    retreatCost: {
        type: Number,
        min: 0,
        max: 4,
        default: 1
    },
    rarity: {
        type: String,
        enum: ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Ultra'],
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Pokemon', pokemonSchema);