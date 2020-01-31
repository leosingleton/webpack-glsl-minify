// src/__tests__/cli.test.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function runCli(inputFile: string, params: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Launch CLI app
    let workingDir = path.resolve(__dirname, '../..'); // git repo root
    let outDir = 'tests/cli/build';
    let cmdline = `bin/webpack-glsl-minify ${inputFile} ${params} --outDir ${outDir}`;
    cp.exec(cmdline, { cwd: workingDir }, (err, stdout, stderr) => {
      if (err) {
        reject(`${err}\n${stdout}\n${stderr}\n${workingDir}`);
      }

      // Read the output file produced by Webpack and return it
      let outputFile = path.resolve(__dirname, workingDir, outDir, inputFile + '.js');
      fs.readFile(outputFile, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        }

        resolve(data);
      });
    });
  });
}

describe('CLI app', () => {
  it('Executes with default options', async () => {
    let output = await runCli('tests/webpack/glsl/test.glsl', '');
    expect(output).toContain('gl_FragColor=vec4');
    expect(output.indexOf('u_cb;')).toEqual(-1);            // Uniforms are minified by default
    expect(output.indexOf('mat3 transform')).toEqual(-1);   // Variables are minified by default
  });
});
