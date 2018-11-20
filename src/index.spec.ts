// src/index.spec.ts
// Copyright 2018 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslMinify } from './index';

describe('Sample', () => {
  it('Sample Test', async () => {
    let glsl = new GlslMinify(null);
    let program = await glsl.execute('');
    expect(program.code).toEqual('Hello World!');
  });
});
