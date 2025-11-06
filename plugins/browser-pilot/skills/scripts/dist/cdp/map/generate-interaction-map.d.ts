/**
 * Browser script to generate interaction map.
 * This script runs in the browser context via Runtime.evaluate.
 */
export interface InteractionElement {
    id: string;
    type: string;
    tag: string;
    text?: string;
    value?: string;
    selectors: {
        byText?: string;
        byId?: string;
        byCSS?: string;
        byRole?: string;
        byAriaLabel?: string;
    };
    attributes: Record<string, unknown>;
    position: {
        x: number;
        y: number;
    };
    visibility: {
        inViewport: boolean;
        visible: boolean;
        obscured: boolean;
    };
    context?: {
        parent?: string;
        section?: string;
    };
}
/**
 * Generate the browser script that finds all interactive elements.
 * Returns a string that can be executed via Runtime.evaluate.
 */
export declare function getInteractionMapScript(): string;
//# sourceMappingURL=generate-interaction-map.d.ts.map