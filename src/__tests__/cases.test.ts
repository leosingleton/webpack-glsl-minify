// src/__tests__/cases.test.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

import { GlslMinifyInternal } from './internals';
import { readFile } from '../fsAsync';
import * as path from 'path';
import glob = require('glob');

describe('Execute GLSL test cases against expected outputs', () => {
  // Discover test cases. They exist as .glsl files with the expected output stored as a .json file of the same name.
  const testPath = path.resolve(__dirname, '../../tests/cases/*.json');
  const matches = glob.sync(testPath);

  for (const expectedFile of matches) {
    // From the file path of the expected output, calculate the file path of the source file
    const basename = path.basename(expectedFile);
    const extname = path.extname(basename);
    const sourceFile = expectedFile.substr(0, expectedFile.length - extname.length) + '.glsl';

    it(basename, async () => {
      // Read and minify the source file
      const glsl = new GlslMinifyInternal();
      const output = await glsl.readAndExecuteFile(sourceFile);

      // Read and compare the output against the expected output
      const expected = JSON.parse(await readFile(expectedFile, 'utf-8'));
      expect(output).toEqual(expected);
    });
  }
});
