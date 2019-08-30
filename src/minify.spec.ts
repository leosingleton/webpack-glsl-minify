// src/index.spec.ts
// Copyright 2018-2019 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslMinify, TokenMap, TokenType } from './minify';

/**
 * Removes whitespace and empty lines from a string
 */
function trim(content: string): string {
  let lines = content.split('\n');

  let output = '';
  for (let n = 0; n < lines.length; n++) {
    let line = lines[n].trim();
    if (line.length > 0) {
      if (output !== '') {
        output += '\n';
      }
      output += line;
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

    let expected = 'void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); }';
    expect(output.length).toEqual(expected.length);
    expect(output).toEqual(expected);
    done();
  });

  it('Preprocessor handles @const directives', async (done) => {
    let glsl = new GlslMinify(null);
    let file = await glsl.readFile('tests/const.glsl');
    let output = trim(glsl.preprocessPass2(file.contents));

    let expected = 'const float color=$0$;\nvoid main() { gl_FragColor = vec4(vec3(color), 1.0); }';
    expect(output.length).toEqual(expected.length);
    expect(output).toEqual(expected);
    done();
  });

  it('Calculates unique minified names', () => {
    expect(TokenMap.getMinifiedName(0)).toEqual('A');
    expect(TokenMap.getMinifiedName(1)).toEqual('B');
    expect(TokenMap.getMinifiedName(25)).toEqual('Z');
    expect(TokenMap.getMinifiedName(26)).toEqual('a');
    expect(TokenMap.getMinifiedName(27)).toEqual('b');
    expect(TokenMap.getMinifiedName(52)).toEqual('AA');
    expect(TokenMap.getMinifiedName(104)).toEqual('BA');
  });

  it('Allocates minified names', () => {
    let map = new TokenMap();
    expect(map.minifyToken('token1')).toEqual('A');
    expect(map.minifyToken('token2')).toEqual('B');
    expect(map.minifyToken('token1')).toEqual('A');
    expect(map.minifyToken('gl_FragColor')).toEqual('gl_FragColor');
    expect(map.minifyToken('int')).toEqual('int');
    expect(map.minifyToken('token3')).toEqual('C');
  });

  it('Determines token type', () => {
    expect(GlslMinify.getTokenType('attribute')).toEqual(TokenType.ttAttribute);
    expect(GlslMinify.getTokenType('.')).toEqual(TokenType.ttDot);
    expect(GlslMinify.getTokenType('12345')).toEqual(TokenType.ttNumeric);
    expect(GlslMinify.getTokenType('+=')).toEqual(TokenType.ttOperator);
    expect(GlslMinify.getTokenType('#version 150')).toEqual(TokenType.ttPreprocessor);
    expect(GlslMinify.getTokenType('gl_FragColor')).toEqual(TokenType.ttToken);
    expect(GlslMinify.getTokenType('uniform')).toEqual(TokenType.ttUniform);
    expect(GlslMinify.getTokenType('varying')).toEqual(TokenType.ttVarying);
  });

  it('Minifies a vertex shader', async (done) => {
    let glsl = new GlslMinify(null);
    let file = await glsl.readFile('tests/minify1.glsl');
    let output = await glsl.execute(file.contents);

    // Read the expected output
    let expected = await glsl.readFile('tests/minify1.min.glsl');
    expect(output.sourceCode).toEqual(trim(expected.contents));
    expect(output.uniforms['u_flipY'].variableName).toEqual('A');
    expect(output.uniforms['u_flipY'].variableType).toEqual('float');
    done();
  });

  it('Minifies a fragment shader', async (done) => {
    let glsl = new GlslMinify(null);
    let file = await glsl.readFile('tests/minify2.glsl');
    let output = await glsl.execute(file.contents);

    // Read the expected output
    let expected = await glsl.readFile('tests/minify2.min.glsl');
    expect(output.sourceCode).toEqual(trim(expected.contents));
    expect(output.uniforms['u_y'].variableName).toEqual('A');
    expect(output.uniforms['u_y'].variableType).toEqual('sampler2D');
    expect(output.uniforms['u_cb'].variableName).toEqual('B');
    expect(output.uniforms['u_cb'].variableType).toEqual('sampler2D');
    expect(output.uniforms['u_cr'].variableName).toEqual('C');
    expect(output.uniforms['u_cr'].variableType).toEqual('sampler2D');
    done();
  });

  it('Minifies a complex fragment shader', async (done) => {
    let glsl = new GlslMinify(null);
    let file = await glsl.readFile('tests/minify3.glsl');
    let output = await glsl.execute(file.contents);

    // Read the expected output
    let expected = await glsl.readFile('tests/minify3.min.glsl');
    expect(output.sourceCode).toEqual(trim(expected.contents));
    expect(output.uniforms['iResolution'].variableName).toEqual('A');
    expect(output.uniforms['iResolution'].variableType).toEqual('vec3');
    expect(output.uniforms['iChannel0'].variableName).toEqual('B');
    expect(output.uniforms['iChannel0'].variableType).toEqual('sampler2D');
    done();
  });

  it('Stringifies an object', () => {
    let myobj = {
      prop1: 'hello',
      prop2: {
        vals: [0, 1, 2],
        num: 1.23
      }
    };

    let str = GlslMinify.stringify(myobj);
    let expected = '{prop1:"hello",prop2:{vals:[0,1,2],num:1.23}}';
    expect(str).toEqual(expected);
  });
});
