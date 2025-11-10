/**
 * Mixamo Integration
 * Mixamo에서 애니메이션 검색 및 다운로드
 */

import axios from 'axios';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { MIXAMO } from '../constants';

export interface MixamoAnimation {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  type: 'animation' | 'character';
  duration?: number;
}

export interface MixamoDownloadOptions {
  animationId: string;
  format?: 'fbx' | 'dae';
  skin?: 'With Skin' | 'Without Skin';
  fps?: 24 | 30 | 60;
  outputPath: string;
}

export class MixamoClient {
  private bearerToken?: string;

  /**
   * Mixamo에 로그인 (Bearer 토큰 설정)
   * 참고: Mixamo는 Adobe 계정 로그인 필요
   */
  setBearerToken(token: string): void {
    this.bearerToken = token;
  }

  /**
   * 애니메이션 검색
   */
  async searchAnimations(query: string, limit = 20): Promise<MixamoAnimation[]> {
    if (!this.bearerToken) {
      throw new Error('Mixamo bearer token not set. Please login first.');
    }

    try {
      const response = await axios.get(`${MIXAMO.API_BASE_URL}/products`, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          'X-Api-Key': 'mixamo2',
        },
        params: {
          page: 1,
          limit,
          order: 'relevance',
          type: 'Motion',
          query,
        },
      });

      return response.data.results.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        thumbnail: item.thumbnail,
        type: item.type.toLowerCase(),
        duration: item.details?.duration,
      }));
    } catch (error) {
      console.error('Failed to search Mixamo animations:', error);
      throw new Error('Mixamo search failed');
    }
  }

  /**
   * 애니메이션 다운로드
   *
   * 참고: Mixamo API는 인증이 복잡하므로, 실제로는 다음 방법들을 사용할 수 있습니다:
   * 1. Mixamo 웹사이트에서 수동 다운로드 후 경로 지정
   * 2. Puppeteer/Playwright로 자동화된 다운로드
   * 3. 사용자가 제공한 Bearer 토큰 사용
   */
  async downloadAnimation(options: MixamoDownloadOptions): Promise<string> {
    const {
      animationId,
      format = MIXAMO.DEFAULT_FORMAT,
      skin = MIXAMO.DEFAULT_SKIN,
      fps = MIXAMO.DEFAULT_FPS,
      outputPath,
    } = options;

    if (!this.bearerToken) {
      throw new Error(
        'Mixamo authentication required. Please provide bearer token or download manually from Mixamo.com'
      );
    }

    try {
      // Step 1: 다운로드 요청
      const exportResponse = await axios.post(
        `${MIXAMO.API_BASE_URL}/animations/${animationId}/export`,
        {
          format,
          skin,
          fps,
        },
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const downloadUrl = exportResponse.data.url;

      // Step 2: 파일 다운로드
      console.log('📥 Downloading animation from Mixamo...');
      const fileResponse = await axios.get(downloadUrl, {
        responseType: 'stream',
        timeout: MIXAMO.DOWNLOAD_TIMEOUT,
      });

      const outputFile = join(outputPath, `${animationId}.${format}`);
      const writer = createWriteStream(outputFile);

      fileResponse.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Animation downloaded: ${outputFile}`);
          resolve(outputFile);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Failed to download animation:', error);
      throw new Error('Mixamo download failed');
    }
  }

  /**
   * 수동 다운로드 가이드 표시
   * (API 인증이 없는 경우 대안)
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
   * 인기 애니메이션 목록
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
}
