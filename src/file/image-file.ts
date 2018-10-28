import sharp from 'sharp';

/**
 * 이미지 라이브러리 관련 의존도를 줄이기 위해 별도 개체로 캡슐화함.
 */
class ImageFile {
  private image: sharp = null;

  width: number;
  height: number;

  /**
   * 이미지를 불러옴과 동시에 이미지 크기 정보를 저장해야함.
   * @param src 이미지를 불러올 버퍼나 파일 경로
   */
  async load(src: any) {
    let image = sharp(src);
    let metadata = await image.metadata();

    this.image = image;

    image.rotate();

    if (metadata.orientation && metadata.orientation > 4) {
      this.width = metadata.height;
      this.height = metadata.width;
    } else {
      this.width = metadata.width;
      this.height = metadata.height;
    }
  }

  /**
   * 저장된 이미지 파일의 크기를 반환해야함.
   * @param src 파일로 저장할 경로
   */
  async save(src: string) {
    let info = await this.image.toFile(src);
    return info.size;
  }

  async resize(width, height) {
    this.image.resize(width, height);
  }
}

export default ImageFile;
