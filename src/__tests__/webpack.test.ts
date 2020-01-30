// src/__tests__/webpack.test.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function runWebpack(configFile: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Find test directory
    let workingDir = path.resolve(__dirname, '../../tests/webpack');
    fs.exists(workingDir, exists => {
      if (!exists) {
        reject(`Failed to find test directory: ${workingDir}`);
      }      

      // Launch Webpack
      cp.exec(`npx webpack --mode=production --config=${configFile}`, { cwd: workingDir }, (err, stdout, stderr) => {
        if (err) {
          reject(`${err}\n${stdout}\n${stderr}`);
        }

        // Read the output file produced by Webpack and return it
        let outputFile = path.resolve(workingDir, 'build/index.js');
        fs.readFile(outputFile, 'utf-8', (err, data) => {
          if (err) {
            reject(err);
          }

          resolve(data);
        });  
      });
    });
  });
}

describe('Webpack Loader', () => {
  it('Executes with default options', async () => {
    let output = await runWebpack('webpack.test1.js');
    expect(output).toContain('gl_FragColor=vec4');
    expect(output.indexOf('u_cb;')).toEqual(-1);            // Uniforms are minified by default
    expect(output.indexOf('mat3 transform')).toEqual(-1);   // Variables are minified by default
  });

  it('Executes with mangling disabled', async () => {
    let output = await runWebpack('webpack.test2.js');
    expect(output).toContain('gl_FragColor=vec4');
    expect(output).toContain('u_cb;');
    expect(output).toContain('mat3 transform');
  });
});
