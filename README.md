# Ciclo Ágil API

## Description

This is the API for the Ciclo Ágil App.

## Installation

1. Clone the repository:

bash
$ git clone https://github.com/PipocaAgil-Grupo-Bordo/ciclo-agil-api.git
$ cd ciclo-agil-api

2. Install dependencies:

bash
$ npm install


## Configuration

1. Create a .env and a .env.test file and add the necessary environment variables. Check the .env.example

2. Create a local database for development and a separate database for tests. After that, set the POSTGRES_URL variable in your env files.

ps: If you are using docker, the database will be created after running docker-compose up. You can access it via pgAdmin on http://localhost:5050.

## Running the app

### Local Development
bash
# watch mode
$ npm run dev


### Docker
1. Build and start containers:

bash
$ docker-compose up


2. Verify containers:

bash
$ docker-compose ps


3. Access API: http://localhost:4444
4. Access PGAdmin: http://localhost:5050

## Test

bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov


## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

Nest is [MIT licensed](LICENSE).
