/**
 * Mixamo Integration - Manual Download Support
 * Mixamo does not provide an official API, so users must download animations manually
 */

/**
 * Provides manual download instructions and popular animation suggestions
 */
export class MixamoHelper {
  /**
   * Get manual download instructions for a specific animation
   */
  getManualDownloadInstructions(animationName: string): string {
    return `
📝 Manual Download Instructions for "${animationName}":

1. Visit https://www.mixamo.com
2. Login with your Adobe account
3. Search for "${animationName}"
4. Select the animation
5. Click "Download" button
6. Choose settings:
   - Format: FBX (.fbx)
   - Skin: Without Skin (recommended for retargeting)
   - FPS: 30
7. Save to your project's animations folder
8. Return here and provide the file path

Alternative: You can also drag & drop the FBX file into Blender manually.
    `.trim();
  }

  /**
   * Get list of popular Mixamo animations
   */
  getPopularAnimations(): Array<{ name: string; category: string }> {
    return [
      { name: 'Walking', category: 'Locomotion' },
      { name: 'Running', category: 'Locomotion' },
      { name: 'Idle', category: 'Idle' },
      { name: 'Jump', category: 'Action' },
      { name: 'Dancing', category: 'Dance' },
      { name: 'Sitting', category: 'Sitting' },
      { name: 'Standing', category: 'Standing' },
      { name: 'Fighting', category: 'Combat' },
      { name: 'Waving', category: 'Gesture' },
      { name: 'Talking', category: 'Gesture' },
    ];
  }

  /**
   * Get download settings recommendation
   */
  getRecommendedSettings(): {
    format: string;
    skin: string;
    fps: number;
  } {
    return {
      format: 'FBX (.fbx)',
      skin: 'Without Skin',
      fps: 30,
    };
  }
}
