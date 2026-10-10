import { readFile, writeFile } from 'node:fs/promises';
import { CLIArgumentsVO } from './CLIArguments.valueobject.js';
import { renderSvg } from './index.js';

/**
 * The CLI needs one application boundary to execute a Mermaid-BPMN rendering request.
 *
 * This class exists to keep command-line workflow orchestration separate from argument parsing, file access, and rendering.
 * Its responsibility is to coordinate one complete CLI request.
 *
 * @description Represents the Mermaid-BPMN command-line application workflow.
 */
export class CLIApplication {
    public async run(argumentsList: string[]): Promise<void> {
        const argumentsVO = CLIArgumentsVO.create(argumentsList);
        const source = await this.readSource(argumentsVO.input);
        const svg = await renderSvg(source, { browserPath: argumentsVO.browser });
        await this.writeSVG(argumentsVO.output, svg);
    }

    private async readSource(sourcePath: string): Promise<string> {
        try {
            return await readFile(sourcePath, 'utf8');
        } catch (error) {
            throw new Error(`Cannot read Mermaid-BPMN source file ${sourcePath}: ${this.getErrorMessage(error)}`, { cause: error });
        }
    }

    private async writeSVG(outputPath: string, svg: string): Promise<void> {
        try {
            await writeFile(outputPath, svg, 'utf8');
        } catch (error) {
            throw new Error(`Cannot write SVG output file ${outputPath}: ${this.getErrorMessage(error)}`, { cause: error });
        }
    }

    private getErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }
}
