#!/usr/bin/env node

import meow from 'meow';
import os from 'os';
import { basename, dirname, join, relative, resolve } from 'path';
import { create as createTar } from 'tar';
import { globby } from 'globby';
import { parsePackageSelector, readProjects } from '@pnpm/filter-workspace-packages';
import { pipe as rawPipe } from 'mississippi';
import { promises as fs } from 'fs';
import { promisify } from 'util';

const pipe = promisify(rawPipe);
const SCRIPT_PATH = basename(process.argv[1]);

const cli = meow(
  `
  Usage
    $ ${SCRIPT_PATH} [--patterns=regex]... [--list-files] <Dockerfile-path>
  Options
    --list-files, -l    Don't generate tar, just list files. Useful for debugging.
    --patterns, -p      Additional .gitignore-like patterns used to find/exclude files (can be specified multiple times).
    --root              Path to the root of the monorepository. Defaults to current working directory.
    --target, -t        Directory to get the pnpm context for.
  Examples
    $ ${SCRIPT_PATH} packages/app/Dockerfile
`,
  {
    allowUnknownFlags: false,
    autoHelp: false,
    description: `./${SCRIPT_PATH}`,
    flags: {
      help: { type: 'boolean', alias: 'h' },
      listFiles: { type: 'boolean', alias: 'l' },
      patterns: { type: 'string', alias: 'p', isMultiple: true },
      root: { type: 'string', default: process.cwd() },
      target: { type: 'string', alias: 't' },
    },
    importMeta: import.meta,
  },
);

if (cli.flags.help) {
  cli.showHelp(0);
}

async function fileExists(path) {
  try {
    await fs.stat(path);
  } catch (err) {
    return false;
  }
  return true;
}

async function getPackagePathsFromPnpmSelector(selector, cwd) {
  const projects = await readProjects(cwd, [parsePackageSelector(selector, cwd)]);
  return Object.keys(projects.selectedProjectsGraph).map((p) => relative(cwd, p));
}

async function getFilesFromPnpmSelector(selector, cwd, options = {}) {
  const projectPaths = await getPackagePathsFromPnpmSelector(selector, cwd);
  const patterns = projectPaths.concat(options.extraPatterns || []);
  return globby(patterns, { cwd, dot: true, gitignore: true });
}

async function getMetafilesFromPnpmSelector(selector, cwd, options = {}) {
  const [rootMetas, projectMetas] = await Promise.all([
    globby(
      [
        'baseconfigs/*',
        'bin/*',
        'tsconfig.json',
        'tsconfig.build.json',
        'package.json',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        '.npmrc',
      ],
      {
        cwd,
        dot: true,
        gitignore: true,
      },
    ),
    getPackagePathsFromPnpmSelector(selector, cwd).then((paths) => {
      const patterns = paths.map((p) => `${p}/**/package.json`).concat(options.extraPatterns || []);
      return globby(patterns, { cwd, dot: true, gitignore: true });
    }),
  ]);
  return rootMetas.concat(projectMetas);
}

async function parseCli({ input, flags }) {
  const dockerFile = input.shift();
  if (!dockerFile) throw new Error('Must specify path to Dockerfile');
  if (!(await fileExists(dockerFile))) throw new Error(`Dockerfile not found: ${dockerFile}`);

  return {
    dockerFile,
    extraPatterns: flags.patterns,
    listFiles: flags.listFiles,
    root: flags.root,
    target: flags.target,
  };
}

async function withTmpdir(callable) {
  const tmpdir = await fs.mkdtemp(join(os.tmpdir(), SCRIPT_PATH));
  let result;
  try {
    result = await callable(tmpdir);
  } finally {
    await fs.rm(tmpdir, { recursive: true });
  }
  return result;
}

async function getFilesRecursive(dir) {
  async function* yieldFiles(dirPath) {
    const paths = await fs.readdir(dirPath, { withFileTypes: true });
    for (const path of paths) {
      const res = resolve(dirPath, path.name);
      if (path.isDirectory()) {
        yield* yieldFiles(res);
      } else {
        yield res;
      }
    }
  }

  const files = [];
  for await (const f of yieldFiles(dir)) {
    files.push(relative(dir, f));
  }
  return files;
}

async function copyFiles(files, dstDir) {
  return Promise.all(
    files.map(async (f) => {
      const dst = join(dstDir, f);
      await fs.mkdir(dirname(dst), { recursive: true });
      return await fs.copyFile(f, dst);
    }),
  );
}

async function main(parsedCli) {
  const projectPath = parsedCli.target ? parsedCli.target : dirname(parsedCli.dockerFile);

  const [dependencyFiles, packageFiles, metaFiles] = await Promise.all([
    getFilesFromPnpmSelector(`{${projectPath}}^...`, parsedCli.root, {
      extraPatterns: parsedCli.extraPatterns,
    }),
    getFilesFromPnpmSelector(`{${projectPath}}`, parsedCli.root, {
      extraPatterns: parsedCli.extraPatterns.concat([`!${parsedCli.dockerFile}`]),
    }),
    getMetafilesFromPnpmSelector(`{${projectPath}}...`, parsedCli.root, {
      extraPatterns: parsedCli.extraPatterns,
    }),
  ]);

  await withTmpdir(async (tmpdir) => {
    await Promise.all([
      // Copy target-Dockerfile to context root so Docker can find it by default
      fs.copyFile(parsedCli.dockerFile, join(tmpdir, 'Dockerfile')),
      copyFiles(dependencyFiles, join(tmpdir, 'deps')),
      copyFiles(metaFiles, join(tmpdir, 'meta')),
      copyFiles(packageFiles, join(tmpdir, 'pkg')),
    ]);

    const files = await getFilesRecursive(tmpdir);
    if (parsedCli.listFiles) {
      for await (const path of files) console.log(path);
    } else {
      await pipe(createTar({ gzip: true, cwd: tmpdir }, files), process.stdout);
    }
  });
}

await parseCli(cli)
  .then(main)
  .catch((err) => {
    throw err;
  });
