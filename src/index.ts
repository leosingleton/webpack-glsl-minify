// src/index.ts
// Copyright 2018 Leo C. Singleton IV <leo@leosingleton.com>

import { readFileSync } from 'fs';

export function helper(): string {
  //return readFileSync('hello.txt', 'utf-8');
  return 'Hello World!';
}

function main(content: string): string {
  return 'module.exports = ' + JSON.stringify(helper());
}

export default main;
