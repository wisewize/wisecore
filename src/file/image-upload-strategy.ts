import path from 'path';
import fs from 'fs';

import ImageFile from './image-file';
import UploadStrategy from './upload-strategy';

async function thumbnailImage(file, width: number, height: number) {
  const imgDir = path.dirname(file.path);
  const ext = path.extname(file.name);
  const name = path.basename(file.name, ext);
  const resizePath = path.join(imgDir, name + '_thumb.png');

  let image = new ImageFile();

  await image.load(file.path);
  await image.resize(width || 100, height || 100);

  let fileSize = await image.save(resizePath);

  return {
    path: resizePath,
    size: fileSize
  };
}

async function resizeImage(file, width: number, height: number) {
  const imgDir = path.dirname(file.path);
  const ext = path.extname(file.name);
  const name = path.basename(file.name, ext);
  const resizePath = path.join(imgDir, name + '_resize' + ext);

  let image = new ImageFile();

  await image.load(file.path);

  let resizeWidth = image.width;
  let resizeHeight = image.height;

  if (width && resizeWidth > width) {
    resizeHeight = Math.floor(resizeHeight * (width / resizeWidth));
    resizeWidth = width;
  }

  if (height && resizeHeight > height) {
    resizeWidth = Math.floor(resizeWidth * (height / resizeHeight));
    resizeHeight = height;
  }

  // null if resizing is useless
  if (resizeWidth === image.width && resizeHeight === image.height) {
    return null;
  }

  await image.resize(resizeWidth, resizeHeight);

  let fileSize = await image.save(resizePath);

  return {
    path: resizePath,
    size: fileSize
  };
}

const imageUploadStrategy: UploadStrategy = async function (uploader, storage, file) {
  let url = null;
  let fileSize = 0;
  let thumbUrl = null;
  let thumbSize = 0;

  // create a thumbnail
  const thumbInfo = await thumbnailImage(file, storage.thumbWidth, storage.thumbHeight);
  thumbUrl = await uploader.uploadFile(thumbInfo.path, file.name + '_thumb.png', 'image/png');
  thumbSize = thumbInfo.size;
  fs.unlinkSync(thumbInfo.path);

  // resize image if maxWidth or maxHeight is defined
  if (storage.maxWidth || storage.maxHeight) {
    const resizeInfo = await resizeImage(file, storage.maxWidth, storage.maxHeight);

    if (resizeInfo) {
      url = await uploader.uploadFile(resizeInfo.path, file.name, file.type);
      fileSize = resizeInfo.size;
      fs.unlinkSync(resizeInfo.path);
    } else {
      url = await uploader.uploadFile(file.path, file.name, file.type);
      fileSize = file.size;
    }
  } else {
    url = await uploader.uploadFile(file.path, file.name, file.type);
    fileSize = file.size;
  }

  return {
    url,
    name: file.name,
    size: fileSize + thumbSize,
    thumbUrl,
    type: file.type
  };
}

export default imageUploadStrategy;
