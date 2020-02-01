// src/fsAsync.ts
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>
// Wrappers around Node's filesystem functions to make them use async patterns

import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export function exists(p: fs.PathLike): Promise<boolean> {
  return new Promise(resolve => {
    fs.exists(p, exists => {
      resolve(exists);
    });
  });
}

export function readFile(p: fs.PathLike, options: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(p, options, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

export function writeFile(p: fs.PathLike, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(p, data, err => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

export function mkdir(p: fs.PathLike): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(p, err => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

export async function mkdirp(p: string): Promise<void> {
  const dirname = path.dirname(p);
  if (await exists(dirname)) {
    return;
  }

  await mkdirp(dirname);
  await mkdir(dirname);
}

export function exec(command: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cp.exec(command, { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject(`${err}\n${stdout}\n${stderr}`);
      }
      resolve();
    });
  });
}
