// src/__tests__/preprocessor.test.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslMinifyInternal } from './internals';

describe('GlslMinify Preprocessor', () => {
  it('Reads files', async () => {
    const glsl = new GlslMinifyInternal();
    const file = await glsl.readFile('tests/cases/hello.glsl');
    expect(file.contents).toEqual('// Hello World!');
  });

  it('Preprocessor removes comments', async () => {
    const glsl = new GlslMinifyInternal();
    const file = await glsl.readFile('tests/cases/comments.glsl');
    const output = await glsl.preprocessPass1(file);
    expect(output).toEqual('void main() {}\n');
  });

  it('Preprocessor handles @include directives', async () => {
    const glsl = new GlslMinifyInternal();
    const file = await glsl.readFile('tests/cases/include1.glsl');
    const output = await glsl.preprocessPass1(file);

    // Expect an additional newline for the // comment after the @include
    expect(output).toEqual('void main() {}\n\n');
  });

  it('Preprocessor handles @define directives', async () => {
    const glsl = new GlslMinifyInternal();
    const file = await glsl.readFile('tests/cases/define.glsl');
    const output = GlslMinifyInternal.trim(glsl.preprocessPass2(file.contents));

    const expected = 'void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); }';
    expect(output.length).toEqual(expected.length);
    expect(output).toEqual(expected);
  });

  it('Preprocessor handles @const directives', async () => {
    const glsl = new GlslMinifyInternal();
    const file = await glsl.readFile('tests/cases/const.glsl');
    const output = GlslMinifyInternal.trim(glsl.preprocessPass2(file.contents));

    const expected = 'const float color=$0$;\nvoid main() { gl_FragColor = vec4(vec3(color), 1.0); }';
    expect(output.length).toEqual(expected.length);
    expect(output).toEqual(expected);
  });
});
