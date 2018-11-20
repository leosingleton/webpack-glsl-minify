// src/index.ts
// Copyright 2018 Leo C. Singleton IV <leo@leosingleton.com>

import { loader } from 'webpack';
import LoaderContext = loader.LoaderContext;

import { readFileSync } from 'fs';

/** Output of the GLSL Minifier */
export interface GlslProgram {
  /** Minified GLSL code */
  code: string;
}

export class GlslMinify {
  constructor(loader: LoaderContext) {
    this.loader = loader;
  }

  public async execute(content: string): Promise<GlslProgram> {
    return {
      code: 'Hello World!'
    };
  }

  private loader: LoaderContext;
}

export default async function(content: string) {
  let loader = this as LoaderContext;
  loader.async();

  let glsl = new GlslMinify(loader);
  let program = await glsl.execute(content);

  loader.callback(null, 'module.exports = ' + JSON.stringify(program));
};
