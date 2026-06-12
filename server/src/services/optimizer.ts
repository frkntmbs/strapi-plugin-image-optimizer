import fs from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { file as fileUtils } from '@strapi/utils';
import type { Core } from '@strapi/strapi';
import { type OptimizationMode, type OptimizationSettings } from '../constants';

const { bytesToKbytes } = fileUtils;

const SKIP_FORMATS = new Set(['svg', 'gif']);

interface UploadFile {
  filepath?: string;
  getStream?: () => fs.ReadStream;
  tmpWorkingDirectory?: string;
  hash: string;
  name: string;
  ext: string;
  mime: string;
  width?: number | null;
  height?: number | null;
  size?: number;
  sizeInBytes?: number;
  optimizationChoice?: string;
  optimizationCustom?: Partial<OptimizationSettings>;
  optimizationMode?: string;
}

const getMetadata = async (file: UploadFile) => {
  if (!file.filepath) {
    return new Promise<sharp.Metadata>((resolve, reject) => {
      const pipeline = sharp();
      pipeline.metadata().then(resolve).catch(reject);
      file.getStream?.().pipe(pipeline);
    });
  }

  return sharp(file.filepath).metadata();
};

const writeStreamToFile = (stream: NodeJS.ReadableStream, path: string) =>
  new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(path);
    stream.on('error', reject);
    stream.pipe(writeStream);
    writeStream.on('close', resolve);
    writeStream.on('error', reject);
  });

const buildOutputPath = (file: UploadFile, suffix: string) => {
  if (file.tmpWorkingDirectory) {
    return join(file.tmpWorkingDirectory, `${suffix}-${file.hash}`);
  }
  return `${suffix}-${file.hash}`;
};

const applyResize = (
  transformer: sharp.Sharp,
  settings: OptimizationSettings,
  metadata: sharp.Metadata
) => {
  const targetWidth = settings.maxWidth;
  const targetHeight = settings.maxHeight;
  const sourceWidth = metadata.width ?? 0;
  const sourceHeight = metadata.height ?? 0;

  if (!targetWidth || !targetHeight || !sourceWidth || !sourceHeight) {
    return transformer;
  }

  if (targetWidth === sourceWidth && targetHeight === sourceHeight) {
    return transformer;
  }

  return transformer.resize(targetWidth, targetHeight, {
    fit: 'fill',
  });
};

const applyTransform = (
  transformer: sharp.Sharp,
  format: string | undefined,
  mode: OptimizationMode,
  settings: OptimizationSettings
) => {
  if (mode === 'webp') {
    return transformer.webp({ quality: settings.webpQuality });
  }

  switch (format) {
    case 'jpeg':
    case 'jpg':
      return transformer.jpeg({ quality: settings.jpegQuality, mozjpeg: true });
    case 'png':
      return transformer.png({ compressionLevel: settings.pngCompressionLevel });
    case 'webp':
      return transformer.webp({ quality: settings.webpQuality });
    case 'tiff':
      return transformer.tiff({ quality: settings.jpegQuality });
    case 'avif':
      return transformer.avif({ quality: settings.jpegQuality });
    default:
      return transformer;
  }
};

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async process(
    file: UploadFile,
    mode: OptimizationMode,
    settings: OptimizationSettings
  ): Promise<UploadFile | null> {
    const metadata = await getMetadata(file);
    const format = metadata.format;

    if (!format || SKIP_FORMATS.has(format)) {
      return null;
    }

    const originalSize = metadata.size ?? file.sizeInBytes ?? 0;
    const outputPath = buildOutputPath(file, mode === 'webp' ? 'webp' : 'optimized');
    let newInfo: sharp.OutputInfo | undefined;

    const createTransformer = () => {
      if (!file.filepath) {
        return sharp({ animated: format === 'gif' });
      }
      return sharp(file.filepath, { animated: format === 'gif' });
    };

    let transformer = createTransformer();
    transformer = applyResize(transformer, settings, metadata);
    transformer = applyTransform(transformer, format, mode, settings);

    if (!file.filepath) {
      transformer = transformer.on('info', (info) => {
        newInfo = info;
      });
      await writeStreamToFile(file.getStream!().pipe(transformer), outputPath);
    } else {
      newInfo = await transformer.toFile(outputPath);
    }

    const { width, height, size, pageHeight } = newInfo ?? {};

    if (size && originalSize && size >= originalSize && mode !== 'webp') {
      return null;
    }

    const newFile: UploadFile = {
      ...file,
      filepath: outputPath,
      getStream: () => fs.createReadStream(outputPath),
      width: width ?? file.width,
      height: (pageHeight ?? height) ?? file.height,
      size: size ? bytesToKbytes(size) : file.size,
      sizeInBytes: size ?? file.sizeInBytes,
    };

    if (mode === 'webp') {
      newFile.ext = '.webp';
      newFile.mime = 'image/webp';
      const baseName = file.name.replace(/\.[^.]+$/, '');
      newFile.name = `${baseName}.webp`;
    }

    return newFile;
  },
});
