# Ciclo Ágil API

## Description

This is the API for the Ciclo Ágil App.

## Installation

1. Clone the repository:

```bash
$ git clone https://github.com/PipocaAgil-Grupo-Bordo/ciclo-agil-api.git
$ cd ciclo-agil-api
```

2. Install dependencies:

```bash
$ npm install
```


## Configuration

1. Create a .env and a .env.test file and add the necessary environment variables. Check the .env.example

2. Create a local database for development and a separate database for tests. After that, set the POSTGRES_URL variable in your env files.

ps: If you are using docker, the database will be created after running docker-compose up. You can access it via pgAdmin on http://localhost:5050.

## Running the app

### Local Development
```bash
# watch mode
$ npm run dev
```


### Docker
1. Build and start containers:

```bash
$ docker-compose up
```


2. Verify containers:

```bash
$ docker-compose ps
```


3. Access API: http://localhost:4444
4. Access PGAdmin: http://localhost:5050

## Test

```bash
$ npm run test
```


## Branches and commits

For standardization purposes, branch names and commit messages must follow these patterns:

- Branch names must start with the ticket ID + a brief descriptive title (in English and lowercase).  
  Example: cia-123-task-title;

- Commit messages should follow this pattern: [ticket_id] type: Commit Info.  
  Example: [CIA-123] feat: Brief commit description.

Note that the ticket ID must always be written in uppercase.

## License

Nest is [MIT licensed](LICENSE).
