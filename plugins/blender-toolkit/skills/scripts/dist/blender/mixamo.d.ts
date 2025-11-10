/**
 * Mixamo Integration - Manual Download Support
 * Mixamo does not provide an official API, so users must download animations manually
 */
/**
 * Provides manual download instructions and popular animation suggestions
 */
export declare class MixamoHelper {
    /**
     * Get manual download instructions for a specific animation
     */
    getManualDownloadInstructions(animationName: string): string;
    /**
     * Get list of popular Mixamo animations
     */
    getPopularAnimations(): Array<{
        name: string;
        category: string;
    }>;
    /**
     * Get download settings recommendation
     */
    getRecommendedSettings(): {
        format: string;
        skin: string;
        fps: number;
    };
}
//# sourceMappingURL=mixamo.d.ts.map