// src/index.spec.ts
// Copyright 2018 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslMinify } from './index';

/**
 * Removes whitespace and empty lines from a string
 */
function trim(content: string): string {
  let lines = content.split('\n');

  let output = '';
  for (let n = 0; n < lines.length; n++) {
    let line = lines[n].trim();
    if (line.length > 0) {
      output += lines[n].trim() + '\n';
    }
  }

  return output;
}

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
    let output = await glsl.preprocessPass1(file);
    expect(output).toEqual('void main() {}\n');
    done();
  });

  it('Preprocessor handles @include directives', async (done) => {
    let glsl = new GlslMinify(null);
    let file = await glsl.readFile('tests/include.glsl');
    let output = await glsl.preprocessPass1(file);

    // Expect an additional newline for the // comment after the @include
    expect(output).toEqual('void main() {}\n\n');
    done();
  });

  it('Preprocessor handles @define directives', async (done) => {
    let glsl = new GlslMinify(null);
    let file = await glsl.readFile('tests/define.glsl');
    let output = trim(glsl.preprocessPass2(file.contents));

    let expected = 'void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); }\n';
    expect(output.length).toEqual(expected.length);
    expect(output).toEqual(expected);
    done();
  });
});
