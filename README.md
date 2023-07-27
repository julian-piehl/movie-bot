# Movie Night Discord Bot

## Description

Movie Night Discord Bot is a fun and interactive project created for my own Discord server. Its primary purpose is to help you and your friends decide which movie to watch together, making movie nights more enjoyable and engaging.

## Key Features

- **Movie Suggestion:** Anyone in the Discord server can suggest movies they want to watch with the group.
- **Voting System:** After collecting movie suggestions, the bot facilitates a voting process to democratically select the movie to watch.

## How to Use

_Coming soon_

## Configuration

To set up the bot, follow these steps:

1. Create a `.env` file using the provided `.env.example` template.
2. Fill out the required values in the `.env` file, including your valid [TheMovieDB](https://www.themoviedb.org) API key.

## Installation

First, install all dependencies:
```bash
$ npm install
```
Then, start the bot inside Docker:
```bash
# development
$ npm run docker:dev:up

# production mode
$ npm run docker:up
```
To stop the bot, use the following commands:
```bash
# development
$ npm run docker:dev:down

# production mode
$ npm run docker:down
```
## Note

Please be aware that this project won't be updated regularly. Feel free to fork and customize the bot for your own needs.

## License

This project is licensed under the [MIT License](LICENSE).
