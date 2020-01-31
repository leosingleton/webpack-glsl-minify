// src/node.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

import * as fsAsync from './fsAsync';
import { GlslFile } from './minify';
import * as path from 'path';

/** Implementation of ReadFileImpl for NodeJS */
export async function nodeReadFile(filename: string, directory?: string): Promise<GlslFile> {
  // Resolve the full file path
  let filePath = path.resolve(directory || '', filename);

  // Read the file
  let data = await fsAsync.readFile(filePath, 'utf-8');
  return { path: filePath, contents: data };
}

/** Implementation of DirnameImpl for NodeJS and Webpack */
export function nodeDirname(p: string): string {
  return path.dirname(p);
}
