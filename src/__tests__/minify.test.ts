// src/__tests__/minify.test.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslMinifyInternal } from './internals';
import { GlslMinify, GlslVariableMap, TokenMap, TokenType } from '../minify';

/** Counts the number of properties in the `consts` or `uniforms` output of the minifier */
function countProperties(map: GlslVariableMap): number {
  return Object.getOwnPropertyNames(map).length;
}

describe('GlslMinify', () => {
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

  it('Minifies a vertex shader', async () => {
    const glsl = new GlslMinifyInternal();
    const file = await glsl.readFile('tests/glsl/minify1.glsl');
    const output = await glsl.executeFile(file);

    // Read the expected output
    const expected = await glsl.readAndTrimFile('tests/glsl/minify1.min.glsl');
    expect(output.sourceCode).toEqual(expected);
    expect(output.uniforms.u_flipY.variableName).toEqual('A');
    expect(output.uniforms.u_flipY.variableType).toEqual('float');
    expect(countProperties(output.consts)).toEqual(0);
    expect(countProperties(output.uniforms)).toEqual(1);
  });

  it('Minifies a fragment shader', async () => {
    const glsl = new GlslMinifyInternal();
    const file = await glsl.readFile('tests/glsl/minify2.glsl');
    const output = await glsl.executeFile(file);

    // Read the expected output
    const expected = await glsl.readAndTrimFile('tests/glsl/minify2.min.glsl');
    expect(output.sourceCode).toEqual(expected);
    expect(output.uniforms.u_y.variableName).toEqual('A');
    expect(output.uniforms.u_y.variableType).toEqual('sampler2D');
    expect(output.uniforms.u_cb.variableName).toEqual('B');
    expect(output.uniforms.u_cb.variableType).toEqual('sampler2D');
    expect(output.uniforms.u_cr.variableName).toEqual('C');
    expect(output.uniforms.u_cr.variableType).toEqual('sampler2D');
    expect(countProperties(output.consts)).toEqual(0);
    expect(countProperties(output.uniforms)).toEqual(3);
  });

  it('Minifies a complex fragment shader', async () => {
    const glsl = new GlslMinifyInternal();
    const file = await glsl.readFile('tests/glsl/minify3.glsl');
    const output = await glsl.executeFile(file);

    // Read the expected output
    const expected = await glsl.readAndTrimFile('tests/glsl/minify3.min.glsl');
    expect(output.sourceCode).toEqual(expected);
    expect(output.uniforms.iResolution.variableName).toEqual('A');
    expect(output.uniforms.iResolution.variableType).toEqual('vec3');
    expect(output.uniforms.iChannel0.variableName).toEqual('B');
    expect(output.uniforms.iChannel0.variableType).toEqual('sampler2D');
    expect(countProperties(output.consts)).toEqual(0);
    expect(countProperties(output.uniforms)).toEqual(2);
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

  it('Supports preserveUniforms', async () => {
    const glsl = new GlslMinifyInternal({ preserveUniforms: true });
    const output = await glsl.readAndExecuteFile('tests/cases/commas-uniforms.glsl');

    // Uniforms are not minified
    expect(output.uniforms.uRed.variableName).toEqual('uRed');
    expect(output.uniforms.uRed.variableType).toEqual('float');
    expect(output.uniforms.uGreen.variableName).toEqual('uGreen');
    expect(output.uniforms.uGreen.variableType).toEqual('float');
    expect(output.uniforms.uBlue.variableName).toEqual('uBlue');
    expect(output.uniforms.uBlue.variableType).toEqual('float');
    expect(countProperties(output.consts)).toEqual(0);
    expect(countProperties(output.uniforms)).toEqual(3);
  });
});
