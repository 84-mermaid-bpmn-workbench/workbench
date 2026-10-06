export const browserPageControllerFixture = {
    rendererPageURL: new URL('file:///renderer.html'),
    source: 'bpmn\n  startEvent',
    svg: '<svg></svg>',
    navigationError: new Error('The renderer page is unavailable.')
};
