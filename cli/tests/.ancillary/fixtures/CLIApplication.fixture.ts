export const cliApplicationFixture = {
    browserExecutablePath: 'chrome',
    inputPath: 'process.mmd',
    outputPath: 'process.svg',
    source: 'bpmn\n  startEvent',
    svg: '<svg></svg>',
    argumentsList: ['--browser', 'chrome', '--input', 'process.mmd'],
    applicationError: new Error('The Mermaid-BPMN source cannot be rendered.'),
    applicationErrorMessage: 'The Mermaid-BPMN source cannot be rendered.'
};
