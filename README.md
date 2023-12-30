# Mock API local server

This is a mock API server for local development. It serves and maps JSON files to URLs. It also handles http writes (POST, PUT, PATCH, DELETE).

## Contents

- [Installation](#installation)
- [Getting started](#getting-started)
  - [Routes](#routes)
  - [The `index.json` file](#the-indexjson-file)
  - [Query string responses](#query-string-responses)
  - [Error responses](#error-responses)
- [Resources](#resources)
  - [Custom responses](#custom-responses)
  - [Resource creation](#resource-creation)
- [Running the server](#running-the-server)
  - [Linux](#linux)
  - [macOS](#macos)
  - [CLI flags](#cli-flags)
- [Development](#development)

## Installation

Run the following to install:

```bash
# install globally
npm i -g mock-api-local-server

# install local to your project
npm i mock-api-local-server
```

## Getting started

To use the server, create an NPM script in your `package.json` file:

```json
{
  "scripts": {
    "start": "mock-api-local-server"
  }
}
```

The server will listen on port 8080 and will serve the contents of the `public` directory by default.
The `public` directory contains a structure that defines the routes and the responses based on files and directories.

### Routes

The routes are defined in the `public` directory. The directory structure defines the routes and maps to URLs. For example, the following directory structure:

```
public/
  users/
    1/
      index.json
    2/
      index.json
    index.json
```

Defines the following routes:

```
GET /users
GET /users/1
GET /users/2
```

### The `index.json` file

An `index.json` file can be created in one of the directories. If present, this file is served if the directory is requested without specifying the file name.

### Query string responses

For `GET` requests where a specific response based on query string is required, a response file can be created that sets the response.

As an example, a response for URL `/api/test3?param1=value1&param2=value2`, create either `/api/test3_param1=value1&param2=value2.json` or `/api/test3_param1=value1&param2=value2/index.json` with appropriate content for the response.

### Error responses

For `GET` requests where a specific response is required, an error response file can be created that sets the response.
Error responses can be HTML or JSON. **Only a single file can exist in the directory**.

As an example, to force a 404 response for URL `/api/not-found`, create either `/api/not-found/404.json` or `/api/not-found/404.html` with appropriate content for the response.

## Resources

The mock server provides automatic `POST`, `PUT`, `PATCH` and `DELETE` methods for any URL path. This allows local mocking of API endpoints.

The following statuses are returned from these methods.

| Method   | Status |
|----------|--------|
| `POST`   | 201    |
| `PUT`    | 204    |
| `PATCH`  | 204    |
| `DELETE` | 204    |

### Custom responses

Custom responses can be provided by creating a file with the method name in the directory.

For example, to provide a custom response for `POST` requests to `/api/test`, create `/api/test/POST.json` with appropriate content for the response.

### Resource creation

Resource creation can be enabled using the `--create` flag. This will allow the server to create resources when a `POST`, `PUT` or `PATCH` request is made.

For example, the file `/api/test/POST.json` is created for a `POST` request to `/api/test` containing the body of the request.

Query string parameters are also supported. For example, the file `/api/test/POST_param1=value1&param2=value2.json` is created for a `POST` request to `/api/test?param1=value1&param2=value2` containing the body of the request.

### CLI flags

The following CLI flags are available:

| Option          | Description               | Default  |
|-----------------|---------------------------|----------|
| `--port`        | Set the port to use.      | `8080`   |
| `--static-dirs` | Set the directory to use. | `public` |
| `--create`      | Enable resource creation. | `false`  |
| `--use-https`   | Enable HTTPS.             | `false`  |

```json
{
  "scripts": {
    "start": "mock-api-local-server --port 1234 --static-dirs static --create --use-https"
  }
}
```

## Development

The server is written in Node.js. To run the server locally, run the following commands:

```bash
# install dependencies
npm install

# start the server
npm start

# start the server with resource creation enabled
npm run start:create

# start the server using https
npm run start:https
```

## License

This project is licensed under the MIT License - see the [`LICENSE`](LICENSE) file for details.

## Contributing

Any kind of positive contribution is welcome! Please help us to grow by contributing to the project.

If you wish to contribute, you can work on any features you think would enhance the library. After adding your code, please send us a Pull Request.

> Please read [CONTRIBUTING](CONTRIBUTING.md) for details on our [CODE OF CONDUCT](CODE_OF_CONDUCT.md), and the process for submitting pull requests to us.

## Support

We all need support and motivation. Please give this project a ⭐️ to encourage and show that you liked it. Don't forget to leave a star ⭐️ before you move away.
