# hydra-token CLI

This NPM package is a CLI that makes it quick and easy to get a valid access token for a Reaction GraphQL API running locally. The primary use cases are for developers running Reaction Development Platform locally and for automated tests that need to query a local or remote API instance.

## Installation

```sh
npm install -g @reactioncommerce/hydra-token
```

## Usage

Currently `hydra-token get <userId>` is the only command.

In the most common case where you're running the Reaction Hydra service on the same computer for development, just enter this whenever you need an access token to make authenticated API requests:

```sh
hydra-token get <userId>
```

The `userId` is treated as an opaque value. The command does not look up in any database to confirm that this is a real user ID. If you mistype it, you'll still get an access token, but the API will reject your request because it cannot find any user with that ID.

The resulting token will expire after the length of time specified by the `TTL_ACCESS_TOKEN` environment variable for the Hydra service. This is only 1 hour by default. If having to get a new token every hour is bumming you out, you can set that environment variable to something higher (assuming you're not using this in a production environment).

Full help output:

```txt
$ hydra-token get --help
Usage: hydra-token get [options] <userId>

Calls Hydra's endpoints to request an access token that can be used to request data from the GraphQL API authenticated as this user.

Options:
  -r,--raw               Return the raw access token string, for piping or programmatic use
  -p,--public-url <url>  A Hydra public OAuth URL that can be accessed from this computer. Default is
                         http://localhost:4444
  -a,--admin-url <url>   A Hydra private admin URL that can be accessed from this computer. Default is
                         http://localhost:4445
  -h, --help             output usage information
```

### Other Commands

```sh
hydra-token --help
```

```sh
hydra-token --version
```

## How It Works

The `hydra-token get` command, by having access to both the public OAuth endpoint and the normally-private Hydra admin endpoint, is able to act as both a browser and an identity provider. It creates a Hydra client and then does the entire standard OAuth flow as if it is both a user in a browser and that client. There is no browser emulation; it just makes all of the expected HTTP calls in the expected order and with the expected headers and cookies for a login flow.

For the most part, this tool is specific to [Hydra](https://www.ory.sh/docs/hydra/) OAuth but is _not_ specific to Reaction Commerce. The only Reaction-specific part is that whatever string you pass as the `userId` argument becomes the `subject` of the granted token. It should be possible and easy to adapt this tool to another Hydra implementation.

## Security Considerations

The access token returned by the `hydra-token get` command will grant all the permissions that the user with the given ID has, and _any user ID may be entered_!

Additionally, this requires access to the Hydra admin URL, which does not require authentication and should never be public on the Internet. If you are using this against a deployment for automated tests, be very careful to use an IP address whitelist, VPN, or some other method of gaining access to the admin URL without exposing that port to the whole world.

## Commit Messages

To ensure that all contributors follow the correct message convention, each time you commit your message will be validated with the [commitlint](https://www.npmjs.com/package/@commitlint/cli) package, enabled by the [husky](https://www.npmjs.com/package/husky) Git hooks manager.

Examples of commit messages: https://github.com/semantic-release/semantic-release

## Publication to NPM

This package is automatically published by CI when commits are merged or pushed to the `trunk` branch. This is done using [semantic-release](https://www.npmjs.com/package/semantic-release), which also determines version bumps based on conventional Git commit messages.

## Developer Certificate of Origin
We use the [Developer Certificate of Origin (DCO)](https://developercertificate.org/) in lieu of a Contributor License Agreement for all contributions to Reaction Commerce open source projects. We request that contributors agree to the terms of the DCO and indicate that agreement by signing-off all commits made to Reaction Commerce projects by adding a line with your name and email address to every Git commit message contributed:
```
Signed-off-by: Jane Doe <jane.doe@example.com>
```

You can sign-off your commit automatically with Git by using `git commit -s` if you have your `user.name` and `user.email` set as part of your Git configuration.

We ask that you use your real full name (please no anonymous contributions or pseudonyms) and a real email address. By signing-off your commit you are certifying that you have the right to submit it under the [Apache 2.0 License](./LICENSE).

We use the [Probot DCO GitHub app](https://github.com/apps/dco) to check for DCO sign-offs of every commit.

If you forget to sign-off your commits, the DCO bot will remind you and give you detailed instructions for how to amend your commits to add a signature.

## License
Copyright 2020 Reaction Commerce

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and
limitations under the License.
