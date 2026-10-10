export const browserPageControllerFixture = {
    rendererPageURL: new URL('file:///renderer.html'),
    source: 'bpmn\n  startEvent',
    svg: '<svg></svg>',
    browserVersion: 'HeadlessChrome/154.0',
    browserLaunchError: new Error('The browser executable cannot start.'),
    rendererInitializationErrorMessage: 'The renderer page did not initialize.',
    navigationError: new Error('The renderer page is unavailable.')
};
