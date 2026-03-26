import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs';

export interface DiffResult {
  changedPixels: number;
  totalPixels: number;
  changePercent: number;
  diffImagePath: string;
}

export async function compareScreenshots(
  beforePath: string,
  afterPath: string,
  diffPath: string
): Promise<DiffResult> {
  const before = PNG.sync.read(fs.readFileSync(beforePath));
  const after = PNG.sync.read(fs.readFileSync(afterPath));

  const { width, height } = before;
  const diff = new PNG({ width, height });

  const changedPixels = pixelmatch(
    before.data, after.data, diff.data,
    width, height,
    { threshold: 0.1 }
  );

  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  const totalPixels = width * height;
  const changePercent = (changedPixels / totalPixels) * 100;

  return { changedPixels, totalPixels, changePercent, diffImagePath: diffPath };
}
