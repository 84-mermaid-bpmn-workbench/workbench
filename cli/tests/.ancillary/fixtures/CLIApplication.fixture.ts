export const cliApplicationFixture = {
    browserExecutablePath: 'chrome',
    inputPath: 'process.mmd',
    outputPath: 'process.svg',
    source: 'bpmn\n  startEvent',
    svg: '<svg></svg>',
    argumentsList: ['--browser', 'chrome', '--input', 'process.mmd'],
    applicationError: new Error('The Mermaid-BPMN source cannot be rendered.'),
    applicationErrorMessage: 'The Mermaid-BPMN source cannot be rendered.',
    sourceReadError: new Error('ENOENT: no such file or directory'),
    sourceReadErrorMessage: 'Cannot read Mermaid-BPMN source file process.mmd: ENOENT: no such file or directory',
    sourceReadFailure: 'The source file system is unavailable.',
    sourceReadFailureMessage: 'Cannot read Mermaid-BPMN source file process.mmd: The source file system is unavailable.',
    outputWriteError: new Error('EACCES: permission denied'),
    outputWriteErrorMessage: 'Cannot write SVG output file process.svg: EACCES: permission denied'
};
