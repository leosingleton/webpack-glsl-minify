// src/index.spec.ts
// Copyright 2018 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslMinify } from './index';

describe('GlslMinify', () => {
  it('Reads files', async (done) => {
    let glsl = new GlslMinify(null);
    let file = await glsl.readFile('tests/hello.glsl');
    expect(file.contents).toEqual('// Hello World!');
    done();
  });

  it('Preprocessor removes comments', async (done) => {
    let glsl = new GlslMinify(null);
    let file = await glsl.readFile('tests/comments.glsl');
    let output = await glsl.preprocess(file);
    expect(output).toEqual('void main() {}\n');
    done();
  });
});
