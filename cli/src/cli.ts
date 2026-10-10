#!/usr/bin/env node
import { CommanderError } from 'commander';
import { CLIApplication } from './CLIApplication.js';

async function runCLI(): Promise<void> {
    try {
        const application = new CLIApplication();
        await application.run(process.argv.slice(2));
    } catch (error) {
        if (error instanceof CommanderError) {
            process.exitCode = error.exitCode;
            return;
        }

        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`${message}\n`);
        process.exitCode = 1;
    }
}

async function main(): Promise<void> {
    await runCLI();
}

await main();
