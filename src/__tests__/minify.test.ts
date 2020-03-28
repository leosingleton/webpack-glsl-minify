// src/__tests__/minify.test.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslMinify, GlslMinifyOptions, GlslFile, TokenMap, TokenType, ReadFileImpl, DirnameImpl } from '../minify';
import { nodeReadFile, nodeDirname } from '../node';

/**
 * Removes whitespace and empty lines from a string
 */
function trim(content: string): string {
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

/** Wrapper around GlslMinify to expose protected members to unit tests */
class GlslMinifyInternal extends GlslMinify {
  public constructor(options: GlslMinifyOptions, readFile: ReadFileImpl, dirname: DirnameImpl) {
    super(options, readFile, dirname);
    this.readFile = readFile;
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

  public readFile: ReadFileImpl;
}

describe('GlslMinify', () => {
  it('Reads files', async (done) => {
    const glsl = new GlslMinifyInternal({}, nodeReadFile, nodeDirname);
    const file = await glsl.readFile('tests/glsl/hello.glsl');
    expect(file.contents).toEqual('// Hello World!');
    done();
  });

  it('Preprocessor removes comments', async (done) => {
    const glsl = new GlslMinifyInternal({}, nodeReadFile, nodeDirname);
    const file = await glsl.readFile('tests/glsl/comments.glsl');
    const output = await glsl.preprocessPass1(file);
    expect(output).toEqual('void main() {}\n');
    done();
  });

  it('Preprocessor handles @include directives', async (done) => {
    const glsl = new GlslMinifyInternal({}, nodeReadFile, nodeDirname);
    const file = await glsl.readFile('tests/glsl/include.glsl');
    const output = await glsl.preprocessPass1(file);

    // Expect an additional newline for the // comment after the @include
    expect(output).toEqual('void main() {}\n\n');
    done();
  });

  it('Preprocessor handles @define directives', async (done) => {
    const glsl = new GlslMinifyInternal({}, nodeReadFile, nodeDirname);
    const file = await glsl.readFile('tests/glsl/define.glsl');
    const output = trim(glsl.preprocessPass2(file.contents));

    const expected = 'void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); }';
    expect(output.length).toEqual(expected.length);
    expect(output).toEqual(expected);
    done();
  });

  it('Preprocessor handles @const directives', async (done) => {
    const glsl = new GlslMinifyInternal({}, nodeReadFile, nodeDirname);
    const file = await glsl.readFile('tests/glsl/const.glsl');
    const output = trim(glsl.preprocessPass2(file.contents));

    const expected = 'const float color=$0$;\nvoid main() { gl_FragColor = vec4(vec3(color), 1.0); }';
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
    const map = new TokenMap({});
    expect(map.minifyToken('token1')).toEqual('A');
    expect(map.minifyToken('token2')).toEqual('B');
    expect(map.minifyToken('token1')).toEqual('A');
    expect(map.minifyToken('gl_FragColor')).toEqual('gl_FragColor');
    expect(map.minifyToken('int')).toEqual('int');
    expect(map.minifyToken('token3')).toEqual('C');
  });

  it('Determines token type', () => {
    expect(GlslMinifyInternal.getTokenType('attribute')).toEqual(TokenType.ttAttribute);
    expect(GlslMinifyInternal.getTokenType('.')).toEqual(TokenType.ttDot);
    expect(GlslMinifyInternal.getTokenType('12345')).toEqual(TokenType.ttNumeric);
    expect(GlslMinifyInternal.getTokenType('+=')).toEqual(TokenType.ttOperator);
    expect(GlslMinifyInternal.getTokenType('#version 150')).toEqual(TokenType.ttPreprocessor);
    expect(GlslMinifyInternal.getTokenType('gl_FragColor')).toEqual(TokenType.ttToken);
    expect(GlslMinifyInternal.getTokenType('uniform')).toEqual(TokenType.ttUniform);
    expect(GlslMinifyInternal.getTokenType('varying')).toEqual(TokenType.ttVarying);
  });

  it('Detects all valid number formats', () => {
    expect(GlslMinifyInternal.getTokenType('176')).toEqual(TokenType.ttNumeric);    // Base 10
    expect(GlslMinifyInternal.getTokenType('0176')).toEqual(TokenType.ttNumeric);   // Base 8
    expect(GlslMinifyInternal.getTokenType('0x176')).toEqual(TokenType.ttNumeric);  // Base 16
    expect(GlslMinifyInternal.getTokenType('176u')).toEqual(TokenType.ttNumeric);   // Unsigned Base 10
    expect(GlslMinifyInternal.getTokenType('176U')).toEqual(TokenType.ttNumeric);   // Unsigned Base 10
  });

  it('Minifies a vertex shader', async (done) => {
    const glsl = new GlslMinifyInternal({}, nodeReadFile, nodeDirname);
    const file = await glsl.readFile('tests/glsl/minify1.glsl');
    const output = await glsl.executeFile(file);

    // Read the expected output
    const expected = await glsl.readFile('tests/glsl/minify1.min.glsl');
    expect(output.sourceCode).toEqual(trim(expected.contents));
    expect(output.uniforms.u_flipY.variableName).toEqual('A');
    expect(output.uniforms.u_flipY.variableType).toEqual('float');
    done();
  });

  it('Minifies a fragment shader', async (done) => {
    const glsl = new GlslMinifyInternal({}, nodeReadFile, nodeDirname);
    const file = await glsl.readFile('tests/glsl/minify2.glsl');
    const output = await glsl.executeFile(file);

    // Read the expected output
    const expected = await glsl.readFile('tests/glsl/minify2.min.glsl');
    expect(output.sourceCode).toEqual(trim(expected.contents));
    expect(output.uniforms.u_y.variableName).toEqual('A');
    expect(output.uniforms.u_y.variableType).toEqual('sampler2D');
    expect(output.uniforms.u_cb.variableName).toEqual('B');
    expect(output.uniforms.u_cb.variableType).toEqual('sampler2D');
    expect(output.uniforms.u_cr.variableName).toEqual('C');
    expect(output.uniforms.u_cr.variableType).toEqual('sampler2D');
    done();
  });

  it('Minifies a complex fragment shader', async (done) => {
    const glsl = new GlslMinifyInternal({}, nodeReadFile, nodeDirname);
    const file = await glsl.readFile('tests/glsl/minify3.glsl');
    const output = await glsl.executeFile(file);

    // Read the expected output
    const expected = await glsl.readFile('tests/glsl/minify3.min.glsl');
    expect(output.sourceCode).toEqual(trim(expected.contents));
    expect(output.uniforms.iResolution.variableName).toEqual('A');
    expect(output.uniforms.iResolution.variableType).toEqual('vec3');
    expect(output.uniforms.iChannel0.variableName).toEqual('B');
    expect(output.uniforms.iChannel0.variableType).toEqual('sampler2D');
    done();
  });

  it('Stringifies an object', () => {
    const myobj = {
      prop1: 'hello',
      prop2: {
        vals: [0, 1, 2],
        num: 1.23
      }
    };

    const str = GlslMinify.stringify(myobj);
    const expected = '{prop1:"hello",prop2:{vals:[0,1,2],num:1.23}}';
    expect(str).toEqual(expected);
  });
});
