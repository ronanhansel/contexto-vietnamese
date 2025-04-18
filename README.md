# Contexto Vietnamese

A Vietnamese version of the word guessing game [Contexto](https://contexto.me/), built with Next.js.

## About the Game

In Contexto Vietnamese, you try to guess a secret Vietnamese word. After each guess, you'll be shown a ranking number indicating how semantically similar your guess is to the secret word. Lower rank numbers mean your word is closer in meaning to the target word.

The game uses word embeddings to calculate semantic similarity between words. Each word is represented as a vector in a high-dimensional space, and similarity is calculated using cosine similarity between vectors.

## Features

- Vietnamese-only dictionary from Viet39K.txt
- Word similarity rankings based on embeddings
- Simple and intuitive UI
- Unlimited guesses

## Technical Implementation

The game uses:

- Next.js and React for the frontend
- Word embeddings for semantic similarity calculations
- A fixed Vietnamese dictionary (Viet39K.txt)

In this demonstration implementation, we use random vectors for words since pre-trained Vietnamese word embeddings need to be loaded separately.

## Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to play the game.

## Enhancing the Model

For a more meaningful semantic similarity experience, you should:

1. Replace the random vectors with pre-trained Vietnamese word embeddings
2. Store the word vectors in the `data/word_vectors.json` file
3. The format should be: `{"word": [vector_values], ...}`

## License

[MIT](https://choosealicense.com/licenses/mit/)
