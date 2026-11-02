import { createHash, randomBytes } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { chromium } from 'playwright'

const port = 8199
const origin = `http://127.0.0.1:${port}`
const dataDir = await mkdtemp(path.join(tmpdir(), 'gss-api-'))
const phpProbe = spawnSync('php', ['-r', 'echo PHP_BINARY;'], { encoding: 'utf8' })
if (phpProbe.status !== 0) throw new Error('PHP is required for API integration tests.')
const phpRoot = path.dirname(phpProbe.stdout.trim())
const extensionDir = path.join(phpRoot, 'ext')
const phpArgs = ['-d', `extension_dir=${extensionDir}`, '-d', 'extension=pdo_sqlite', '-d', 'extension=sodium', '-S', `127.0.0.1:${port}`, '-t', 'public']
const environment = {
  ...process.env,
  GSS_DATA_DIR: dataDir,
  GSS_PII_KEY: randomBytes(32).toString('base64'),
  GSS_ADMIN_EMAIL: 'admin@example.test',
  GSS_PUBLIC_ORIGIN: 'https://gss.example.test',
}
const server = spawn('php', phpArgs, { cwd: process.cwd(), env: environment, stdio: ['ignore', 'ignore', 'pipe'] })
let serverError = ''
let browser
server.stderr.on('data', (chunk) => { serverError += chunk.toString() })

async function request(url, options = {}) {
  const response = await fetch(`${origin}${url}`, options)
  const payload = await response.json()
  return { response, payload }
}

async function waitForServer() {
  let lastError = ''
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const result = await request('/api/health')
      if (result.response.ok) return result.payload
    } catch (error) { lastError = error instanceof Error ? error.message : String(error) }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`PHP server did not become ready. ${lastError} ${serverError}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

try {
  const health = await waitForServer()
  assert(health.courses === 82, `Expected 82 courses, received ${health.courses}`)
  assert(health.datasets.content === 43 && health.datasets.countries === 249 && health.datasets.regions === 190, 'Dataset seed counts are incorrect.')

  const catalogue = await request('/api/courses')
  const courseSlug = catalogue.payload.data[0].slug
  const application = await request('/api/applications', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ firstName: 'Synthetic', lastName: 'Applicant', email: 'synthetic@example.test', country: 'Testland', courseSlug, consent: true }),
  })
  assert(application.response.status === 201, 'Application submission failed.')
  const { reference, accessToken } = application.payload.data
  const exported = await request(`/api/applications/${reference}/access`, { headers: { 'x-application-token': accessToken } })
  assert(exported.payload.data.applicant.email === 'synthetic@example.test', 'Applicant export failed.')

  await request('/api/auth/session')
  const databaseFile = path.join(dataDir, 'catalog.sqlite').replaceAll('\\', '/')
  const password = 'Synthetic-Admin-Password-2026!'
  const setupToken = randomBytes(32).toString('hex')
  const setupHash = createHash('sha256').update(setupToken).digest('hex')
  const setupExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  const seedAdmin = spawnSync('php', ['-d', `extension_dir=${extensionDir}`, '-d', 'extension=pdo_sqlite', '-r', `$pdo=new PDO('sqlite:${databaseFile}');$pdo->prepare('UPDATE admin_users SET reset_token_hash=:hash,reset_expires_at=:expires WHERE email=:email')->execute([':hash'=>'${setupHash}',':expires'=>'${setupExpiry}',':email'=>'admin@example.test']);`], { env: environment, encoding: 'utf8' })
  assert(seedAdmin.status === 0, `Unable to prepare synthetic administrator. ${seedAdmin.stderr}`)
  const setup = await request('/api/auth/set-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: setupToken, password }) })
  assert(setup.response.ok && setup.payload.authenticated, 'Administrator password setup failed.')
  const login = await request('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.test', password }) })
  assert(login.response.ok && login.payload.authenticated, 'Administrator login failed.')
  const cookie = login.response.headers.get('set-cookie')?.match(/gss_admin=([^;]+)/)?.[1]
  const adminHeaders = { 'content-type': 'application/json', 'x-csrf-token': login.payload.csrfToken, cookie: `gss_admin=${cookie}` }

  const invalidCsrf = await request('/api/admin/courses', { method: 'POST', headers: { 'content-type': 'application/json', cookie: `gss_admin=${cookie}` }, body: '{}' })
  assert(invalidCsrf.response.status === 403, 'Invalid CSRF request was not rejected.')
  const richOriginal = catalogue.payload.data.find((course) => course.modules?.length) || catalogue.payload.data[0]
  const update = await request(`/api/admin/courses/${richOriginal.slug}`, { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ slug: richOriginal.slug, title: `${richOriginal.title} QA`, description: richOriginal.description || '', status: 'published' }) })
  assert(update.response.ok && update.payload.data.modules?.length === richOriginal.modules?.length, 'Rich course fields were lost during update.')
  const unpublish = await request(`/api/admin/courses/${richOriginal.slug}`, { method: 'DELETE', headers: adminHeaders })
  assert(unpublish.response.ok && unpublish.payload.data.status === 'draft', 'Course unpublish failed.')
  const afterUnpublish = await request('/api/courses')
  assert(!afterUnpublish.payload.data.some((course) => course.slug === richOriginal.slug), 'Unpublished course remained public.')

  const adminApplications = await request('/api/applications', { headers: { cookie: `gss_admin=${cookie}` } })
  assert(adminApplications.payload.data.some((item) => item.reference === reference), 'Application was not visible to administrator.')
  const review = await request(`/api/applications/${reference}`, { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ status: 'review' }) })
  assert(review.payload.data.status === 'review', 'Application status update failed.')
  const deleted = await request(`/api/applications/${reference}`, { method: 'DELETE', headers: adminHeaders })
  assert(deleted.payload.deleted === true, 'Administrator application deletion failed.')

  const browserCourse = afterUnpublish.payload.data[0]
  const browserDraft = { slug: 'browser-draft-programme', title: 'Browser Draft Programme', description: 'Synthetic draft used by the full-stack browser test.', status: 'draft' }
  const createdDraft = await request('/api/admin/courses', { method: 'POST', headers: adminHeaders, body: JSON.stringify(browserDraft) })
  assert(createdDraft.response.ok, 'Unable to create browser test draft.')

  browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } })
  const distRoot = path.resolve('dist')
  await context.route('https://app.local/**', async (route) => {
    const requestValue = route.request()
    const url = new URL(requestValue.url())
    if (url.pathname.startsWith('/api/')) {
      const headers = { ...requestValue.headers() }
      delete headers.host
      delete headers['content-length']
      const response = await fetch(`${origin}${url.pathname}${url.search}`, { method: requestValue.method(), headers, body: ['GET', 'HEAD'].includes(requestValue.method()) ? undefined : requestValue.postDataBuffer(), redirect: 'manual' })
      const responseHeaders = { 'content-type': response.headers.get('content-type') || 'application/json' }
      const setCookie = response.headers.get('set-cookie')
      if (setCookie) responseHeaders['set-cookie'] = setCookie
      await route.fulfill({ status: response.status, headers: responseHeaders, body: Buffer.from(await response.arrayBuffer()) })
      return
    }
    const requested = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    const relativeFile = !requested || !path.extname(requested) ? 'index.html' : requested
    const file = path.resolve(distRoot, relativeFile)
    if (!file.startsWith(distRoot)) { await route.fulfill({ status: 403, body: 'Forbidden' }); return }
    const contentTypes = {
      '.css': 'text/css; charset=utf-8', '.gif': 'image/gif', '.html': 'text/html; charset=utf-8',
      '.ico': 'image/x-icon', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
      '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
    }
    try { await route.fulfill({ status: 200, contentType: contentTypes[path.extname(file).toLowerCase()] || 'application/octet-stream', body: await readFile(file) }) } catch { await route.fulfill({ status: 404, body: 'Not found' }) }
  })
  const page = await context.newPage()
  await page.goto('https://app.local/dashboard/login', { waitUntil: 'networkidle' })
  await page.locator('#loginEmail').fill('admin@example.test')
  await page.locator('#loginPassword').fill(password)
  await page.locator('[data-admin-login]').click()
  await page.waitForURL('**/dashboard')
  await page.goto('https://app.local/dashboard/lms-course-list', { waitUntil: 'networkidle' })
  const draftRow = page.locator('tr', { hasText: browserDraft.title })
  await draftRow.waitFor({ state: 'visible' })
  await draftRow.locator('[data-bs-toggle="dropdown"]').click()
  await draftRow.locator('[data-course-edit]').click()
  await page.waitForURL('**/dashboard/lms-course-edit?course=browser-draft-programme')
  await page.locator('#title').waitFor({ state: 'visible' })
  await page.waitForFunction((expected) => document.querySelector('#title')?.value === expected, browserDraft.title)

  await page.goto(`https://app.local/checkout?course=${browserCourse.slug}`, { waitUntil: 'networkidle' })
  await page.locator('[name="firstName"]').fill('Browser')
  await page.locator('[name="lastName"]').fill('Applicant')
  await page.locator('[name="country"]').fill('Testland')
  await page.locator('[name="email"]').fill('browser-applicant@example.test')
  await page.locator('#read_all').evaluate((element) => {
    element.checked = true
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await page.locator('[data-submit-application]').click()
  await page.locator('.tp-checkout-application-status').filter({ hasText: 'submitted' }).waitFor({ state: 'visible' })

  await browser.close()
  browser = undefined
  const cleanupApplications = await request('/api/applications', { headers: { cookie: `gss_admin=${cookie}` } })
  const browserApplication = cleanupApplications.payload.data.find((item) => item.applicant?.email === 'browser-applicant@example.test')
  if (browserApplication) await request(`/api/applications/${browserApplication.reference}`, { method: 'DELETE', headers: adminHeaders })
  await request(`/api/admin/courses/${browserDraft.slug}`, { method: 'DELETE', headers: adminHeaders })

  console.log(JSON.stringify({ ok: true, courses: health.courses, datasets: health.datasets, applicationFlow: 'pass', adminSetup: 'pass', adminCrud: 'pass', csrf: 'pass', richMerge: 'pass', fullStackBrowser: 'pass' }, null, 2))
} finally {
  if (browser) await browser.close().catch(() => {})
  server.kill()
  await Promise.race([new Promise((resolve) => server.once('exit', resolve)), new Promise((resolve) => setTimeout(resolve, 2000))])
  const resolved = path.resolve(dataDir)
  if (!resolved.startsWith(path.resolve(tmpdir()) + path.sep)) throw new Error('Refusing to remove an unexpected test directory.')
  await rm(resolved, { recursive: true, force: true })
}
