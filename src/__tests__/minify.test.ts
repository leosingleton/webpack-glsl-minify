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
