import { Command, Option } from 'commander';
import { extname, resolve } from 'node:path';

type TSelfPOJO = {
    inputPath: string;
    outputPath: string;
    browserPath: string;
};

type TCommanderOptions = {
    input?: string;
    output?: string;
    browser: string;
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
 * the CLI replaces the input extension with `.svg`. The output path must differ from
 * the source path. An explicit output path must use the `.svg` extension.
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

    private readonly browserPath: string;

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

    public get browser(): string {
        return this.browserPath;
    }

    public static create(argumentsList: string[]): CLIArgumentsVO {
        const command = this.createCommand();
        command.parse(argumentsList, { from: 'user' });

        const options = command.opts<TCommanderOptions>();
        const inputPath = this.resolveInputPath(command, options, command.args);

        const outputPath = options.output ?? this.deriveOutputPath(inputPath);
        this.ensureOutputDoesNotOverwriteSource(inputPath, outputPath);

        const self: TSelfPOJO = {
            inputPath,
            outputPath,
            browserPath: options.browser
        };
        return new CLIArgumentsVO(self);
    }

    private static createCommand(): Command {
        return new Command()
            .name('mermaid-bpmn-cli')
            .description('Render Mermaid-BPMN source to SVG.')
            .usage('[options] [input]')
            .allowExcessArguments(false)
            .argument('[input]', 'Mermaid-BPMN source file.')
            .option('-i, --input <path>', 'Read Mermaid-BPMN source from a file.')
            .addOption(
                new Option('-o, --output <path>', 'Write SVG to a .svg file.')
                    .argParser((outputPath: string): string => this.parseSVGOutputPath(outputPath))
            )
            .addOption(
                new Option('--browser <path>', 'Path to the Chrome or Chromium executable.')
                    .env('MERMAID_BPMN_CLI_BROWSER_PATH')
                    .makeOptionMandatory()
            )
            .helpOption('-h, --help', 'Display command help.')
            .addHelpText('after', `
Examples:
  mermaid-bpmn-cli --browser <chrome-or-chromium-path> -i process.mmd -o process.svg
  MERMAID_BPMN_CLI_BROWSER_PATH=<chrome-or-chromium-path> mermaid-bpmn-cli process.mmd
`)
            .exitOverride();
    }

    private static parseSVGOutputPath(outputPath: string): string {
        const hasSVGExtension = (): boolean => extname(outputPath).toLowerCase() === '.svg';

        if (!hasSVGExtension()) {
            throw new Error('Specify an output path with a .svg extension.');
        }

        return outputPath;
    }

    private static resolveInputPath(command: Command, options: TCommanderOptions, positionalArguments: string[]): string {
        const hasConflictingInputSources = (): boolean => options.input !== undefined && positionalArguments.length > 0;
        const isInputPathMissing = (inputPath: string | undefined): inputPath is undefined => inputPath === undefined;

        if (hasConflictingInputSources()) {
            command.error('Specify the input source with either --input or one positional argument, not both.');
        }

        const inputPath = options.input ?? positionalArguments[0];

        if (isInputPathMissing(inputPath)) {
            command.error('Specify an input source with --input <path> or one positional argument.');
        }

        return inputPath;
    }

    private static deriveOutputPath(inputPath: string): string {
        const extension = extname(inputPath);

        if (extension.length === 0) {
            return `${inputPath}.svg`;
        }

        return `${inputPath.slice(0, -extension.length)}.svg`;
    }

    private static ensureOutputDoesNotOverwriteSource(inputPath: string, outputPath: string): void {
        const hasSameResolvedPath = (): boolean => resolve(inputPath) === resolve(outputPath);

        if (hasSameResolvedPath()) {
            throw new Error('The SVG output file must not overwrite the Mermaid-BPMN source file.');
        }
    }

}
