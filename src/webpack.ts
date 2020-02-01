// src/webpack.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslMinify, GlslMinifyOptions, GlslFile } from './minify';

import { loader } from 'webpack';
import LoaderContext = loader.LoaderContext;

import { getOptions } from 'loader-utils';
import { readFile } from 'fs';
import { nodeDirname } from './node';

/** Implementation of readFile for Webpack loaders */
export function webpackReadFile(loader: LoaderContext, filename: string, directory?: string): Promise<GlslFile> {
  return new Promise<GlslFile>((resolve, reject) => {
    // If no directory was provided, use the root GLSL file being included
    directory = directory || loader.context;

    // Resolve the file path
    loader.resolve(directory, filename, (err: Error, path: string) => {
      if (err) {
        return reject(err);
      }

      loader.addDependency(path);
      readFile(path, 'utf-8', (err, data) => {
        if (!err) {
          // Success
          resolve({ path, contents: data });
        } else {
          reject(err);
        }
      });
    });
  });
}

export async function webpackLoader(content: string): Promise<void> {
  const loader = this as LoaderContext;
  const callback = loader.async();
  const options = getOptions(loader) as GlslMinifyOptions;

  try {
    const glsl = new GlslMinify(options, (filename, directory) => webpackReadFile(loader, filename, directory),
      nodeDirname);
    const code = await glsl.executeAndStringify(content);

    callback(null, code);
  } catch (err) {
    callback(err);
  }
}
