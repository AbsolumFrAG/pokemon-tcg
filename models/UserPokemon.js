import mongoose from 'mongoose';

const userPokemonSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pokemon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pokemon',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, {
    timestamps: true
});

userPokemonSchema.index({ user: 1, pokemon: 1 }, { unique: true });

export default mongoose.model('UserPokemon', userPokemonSchema);