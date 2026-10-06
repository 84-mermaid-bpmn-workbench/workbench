export const cliArgumentsFixture = {
    browserEnvironmentVariableName: 'MERMAID_BPMN_CLI_BROWSER_PATH',
    browserExecutablePath: 'chrome',
    environmentBrowserExecutablePath: 'chromium',
    inputPath: 'process.mmd',
    outputPath: 'process.svg',
    invalidOutputPath: 'process.sv',
    extensionlessInputPath: 'process',
    extensionlessOutputPath: 'process.svg',
    positionalInputPath: 'positional-process.mmd',
    conflictingInputSourcesError: 'Specify the input source with either --input or one positional argument, not both.',
    missingInputError: 'Specify an input source with --input <path> or one positional argument.',
    invalidOutputError: 'Specify an output path with a .svg extension.',
    helpUsage: 'Usage: mermaid-bpmn-cli [options] [input]',
    helpExamples: [
        'mermaid-bpmn-cli --browser <chrome-or-chromium-path> -i process.mmd -o process.svg',
        'MERMAID_BPMN_CLI_BROWSER_PATH=<chrome-or-chromium-path> mermaid-bpmn-cli process.mmd'
    ]
};
