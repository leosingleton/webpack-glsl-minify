// src/__tests__/cli.test.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

import * as fsAsync from '../fsAsync';
import * as path from 'path';

async function runCli(inputFile: string, params: string): Promise<string> {
  // Launch CLI app
  const workingDir = path.resolve(__dirname, '../..'); // git repo root
  const outDir = 'build/__tests__/cli';
  const cmdline = `npx nyc --silent --no-clean bin/webpack-glsl-minify ${inputFile} ${params} --outDir ${outDir}`;
  await fsAsync.exec(cmdline, workingDir);

  // Read the output file produced by Webpack and return it
  const outputFile = path.resolve(__dirname, workingDir, outDir, inputFile + '.js');
  const data = await fsAsync.readFile(outputFile, 'utf-8');
  return data;
}

describe('CLI app', () => {
  it('Executes with default options', async () => {
    const output = await runCli('tests/webpack/glsl/test.glsl', '');
    expect(output).toContain('gl_FragColor=vec4');
    expect(output.indexOf('u_cb;')).toEqual(-1);            // Uniforms are minified by default
    expect(output.indexOf('mat3 transform')).toEqual(-1);   // Variables are minified by default
  });
});
