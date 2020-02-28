#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */

const program = require("commander");
const packageJson = require("../package.json");
const getAccessToken = require("./getAccessToken");

process.on("unhandledRejection", (reason) => {
  console.log(reason.stack || reason, "error");
});

// Define the version of the CLI program
program.version(packageJson.version);

// Add main command
program
  .command("get <userId>")
  .description("Calls Hydra's endpoints to request an access token that can be used to request data from the GraphQL API authenticated as this user.")
  .option("-r,--raw", "Return the raw access token string, for piping or programmatic use")
  .option("-p,--public-url <url>", "A Hydra public OAuth URL that can be accessed from this computer. Default is http://localhost:4444")
  .option("-a,--admin-url <url>", "A Hydra private admin URL that can be accessed from this computer. Default is http://localhost:4445")
  .action((userId, options) => {
    getAccessToken(userId, {
      hydraAdminUrl: options.adminUrl,
      hydraOAuthUrl: options.publicUrl
    })
      .then((accessToken) => {
        if (options.raw) {
          console.log(accessToken);
        } else {
          console.log(`\nAccess token for user ${userId}:\n\n${accessToken}\n`);
          console.log(`Paste this in GraphQL Playground "HTTP HEADERS" box:\n{\n    "Authorization": "${accessToken}"\n}\n`);
        }
        return null;
      })
      .catch((error) => {
        if (error && typeof error.message === "string") {
          console.error(error.message);
          if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
            console.error("\nMake sure the Hydra service is running with ports 4444 and 4445 accessible from the host computer\n");
          }
        } else {
          console.error("An unexpected error occurred");
        }
        process.exit(1);
      });
  });

// Wire up the CLI program to the incoming command arguments, i.e., execute the defined program
program.parse(process.argv);

// Help is auto-generated and available with `-h` or `--help`
// Make it also appear when the CLI is run without any command:
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
