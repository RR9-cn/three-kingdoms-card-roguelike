// 临时 Playwright 配置（环境缺口承接，非业务改动）：
// 仓库默认 playwright.config.ts 使用 channel:'chrome'，本机（Linux 容器，无 root）无 /opt/google/chrome/chrome，
// 且无法安装系统级 Google Chrome，故以本配置把可执行文件指向系统 Chromium；用例集合与断言强度与默认配置完全一致。
// 默认配置在本机的失败原因与替代配置内容必须记录在测试报告中，不得表述为“默认配置通过”。
import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
// <repo>/openspec/changes/<change>/test/browser -> 仓库根
const repoRoot = path.resolve(here, '../../../../../..');
const chromium = process.env.DEPTH_CHROMIUM_PATH || '/opt/chromium.org/chromium/chrome';

export default defineConfig({
  testDir: repoRoot,
  testIgnore: ['**/node_modules/**'],
  testMatch: ['tests/browser/**/*.spec.ts', 'openspec/changes/**/test/browser/**/*.spec.ts'],
  workers: 1,
  timeout: 180_000,
  expect: {timeout: 10_000},
  outputDir: path.join(repoRoot, 'test-results'),
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: {width: 1440, height: 900},
    launchOptions: {executablePath: chromium},
  },
  webServer: {
    command: 'npm run dev',
    cwd: repoRoot,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  reporter: [['list'], ['json', {outputFile: path.join(here, '../reports/playwright-depth.json')}]],
});
