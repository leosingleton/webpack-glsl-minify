// src/node.ts
// Copyright 2018-2019 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslFile } from './minify';
import { readFile } from 'fs';
import { dirname } from 'path';

/** Implementation of ReadFileImpl for NodeJS */
export function nodeReadFile(filename: string, directory?: string): Promise<GlslFile> {
  return new Promise<GlslFile>((resolve, reject) => {
    readFile(filename, 'utf-8', (err, data) => {
      if (!err) {
        // Success
        resolve({ path: filename, contents: data });
      } else {
        reject(err);
      }
    });
  });
}

/** Implementation of DirnameImpl for NodeJS and Webpack */
export function nodeDirname(p: string): string {
  return dirname(p);
}
