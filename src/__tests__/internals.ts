// src/__tests__/internals.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslFile, GlslMinify, GlslMinifyOptions, GlslShader, TokenType } from '../minify';
import { nodeReadFile, nodeDirname } from '../node';

/** Wrapper around GlslMinify to expose protected members to unit tests */
export class GlslMinifyInternal extends GlslMinify {
  public constructor(options: GlslMinifyOptions = {}) {
    super(options, nodeReadFile, nodeDirname);
  }

  public preprocessPass1(content: GlslFile): Promise<string> {
    return super.preprocessPass1(content);
  }

  public preprocessPass2(content: string): string {
    return super.preprocessPass2(content);
  }

  public static getTokenType(token: string): TokenType {
    return super.getTokenType(token);
  }

  public readFile = nodeReadFile;

  public async readAndExecuteFile(filename: string): Promise<GlslShader> {
    const file = await this.readFile(filename);
    return this.executeFile(file);
  }

  public async readAndTrimFile(filename: string): Promise<string> {
    const file = await this.readFile(filename);
    return GlslMinifyInternal.trim(file.contents);
  }

  /** Removes whitespace and empty lines from a string */
  public static trim(content: string): string {
    const lines = content.split('\n');

    let output = '';
    for (const line of lines) {
      if (line.length > 0) {
        if (output !== '') {
          output += '\n';
        }
        output += line;
      }
    }

    return output;
  }
}
