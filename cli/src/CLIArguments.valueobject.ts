import { Command } from 'commander';
import { extname } from 'node:path';

type TSelfPOJO = {
    inputPath: string;
    outputPath: string;
    browserPath: string | null;
};

type TCommanderOptions = {
    input?: string;
    output?: string;
    browser?: string;
};

/**
 * @description Parses and validates the Mermaid-BPMN CLI argument contract.
 * 
 * This value object exists to keep command-line syntax validation separate from file 
 * input or output, browser selection, and rendering.
 * 
 * Its responsibility is to represent one valid CLI request with resolved input, 
 * output, and optional browser paths.
 * 
 * The CLI accepts one Mermaid-BPMN source file and a small, explicit MVP option set.
 * One input path is mandatory. Supply it either with `-i, --input <path>` or as one
 * positional argument, but not both. `-o, --output <path>` is optional; without it,
 * the CLI replaces the input extension with `.svg`.
 *
 * A browser executable path is mandatory for rendering. Supply it with the optional
 * `--browser <path>` option, or set `MERMAID_BPMN_CLI_BROWSER_PATH`; the option takes
 * precedence over the environment variable.
 *
 * @usage mermaid-bpmn-cli --browser <chrome-or-chromium-path> -i process.mmd -o process.svg
 * @usage mermaid-bpmn-cli --browser <chrome-or-chromium-path> process.mmd
 * @usage MERMAID_BPMN_CLI_BROWSER_PATH=<chrome-or-chromium-path> mermaid-bpmn-cli -i process.mmd -o process.svg
 * @usage MERMAID_BPMN_CLI_BROWSER_PATH=<chrome-or-chromium-path> mermaid-bpmn-cli process.mmd
 */
export class CLIArgumentsVO {
    private readonly inputPath: string;

    private readonly outputPath: string;

    private readonly browserPath: string | null;

    private constructor(self: TSelfPOJO) {
        this.inputPath = self.inputPath;
        this.outputPath = self.outputPath;
        this.browserPath = self.browserPath;
    }

    public get input(): string {
        return this.inputPath;
    }

    public get output(): string {
        return this.outputPath;
    }

    public get browser(): string | null {
        return this.browserPath;
    }

    public static create(argumentsList: string[]): CLIArgumentsVO {
        const command = this.createCommand();
        command.parse(argumentsList, { from: 'user' });

        const options = command.opts<TCommanderOptions>();
        const positionalArguments = command.args;

        if (options.input !== undefined && positionalArguments.length > 0) {
            throw new Error('Specify the input source with either --input or one positional argument, not both.');
        }

        const inputPath = options.input ?? positionalArguments[0];

        if (inputPath === undefined) {
            throw new Error('Specify an input source with --input <path> or one positional argument.');
        }

        const outputPath = options.output ?? this.deriveOutputPath(inputPath);
        const self: TSelfPOJO = {
            inputPath,
            outputPath,
            browserPath: options.browser ?? null
        };
        return new CLIArgumentsVO(self);
    }

    private static createCommand(): Command {
        return new Command()
            .allowExcessArguments(false)
            .argument('[input]')
            .option('-i, --input <path>')
            .option('-o, --output <path>')
            .option('--browser <path>')
            .configureOutput({
                writeOut: () => undefined,
                writeErr: () => undefined
            })
            .exitOverride();
    }

    private static deriveOutputPath(inputPath: string): string {
        const extension = extname(inputPath);

        if (extension.length === 0) {
            return `${inputPath}.svg`;
        }

        return `${inputPath.slice(0, -extension.length)}.svg`;
    }

}
