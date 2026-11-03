import sourceImages from '../data/course-rag/sourceImages.json'

const textValue = (value) => typeof value === 'string' || typeof value === 'number' ? String(value) : ''
const displayText = (value) => textValue(value).replace(/Metropolitan School of Business\s*(?:&|and)\s*Management(?:\s+UK)?|\bMSBM\b/gi, 'GSS')

function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const localSourceImage = sourceImages[value]
  if (localSourceImage) return new URL(localSourceImage, window.location.origin).href
  try {
    const url = new URL(value, window.location.origin)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch { return undefined }
}

export function courseSection(course, sectionId) {
  const value = course.detailSections?.[sectionId]
  return value?.value ? { ...value.value, status: value.status, reason: value.reason } : value
}

export function hasCourseSection(course, sectionId) {
  return Boolean(courseSection(course, sectionId)?.blocks?.length)
}

export function CourseRichContent({ section, fallback, label = 'Programme information' }) {
  const blocks = section?.blocks || []
  if (section?.status === 'source_absent' && !blocks.length) return <p>The recorded programme source does not publish {label.toLowerCase()} information.{section.reason && ` ${section.reason}`}</p>
  if (!blocks.some((block) => !/^h[1-6]$/.test(block.type) && block.type !== 'module')) return fallback || <p><strong>{label} pending source verification.</strong> Request the current official information before making an enrolment decision.</p>
  const nodes = []
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    const key = `${index}-${block.type}`
    if (block.type === 'li') {
      const items = [block]
      while (blocks[index + 1]?.type === 'li') items.push(blocks[++index])
      nodes.push(<ul key={key}>{items.map((item, itemIndex) => <li key={itemIndex}>{displayText(item.text)}</li>)}</ul>)
    } else if (/^h[1-6]$/.test(block.type)) {
      // Source pages often repeat their page h1 within sections; keep one page h1.
      const Heading = block.type === 'h1' ? 'h3' : block.type
      nodes.push(<Heading key={key}>{displayText(block.text)}</Heading>)
    } else if (block.type === 'table') {
      nodes.push(block.rows?.length ? <div className="msbm-rich-table" tabIndex={0} role="region" aria-label={`${label} table`} key={key}><table><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{displayText(cell)}</td>)}</tr>)}</tbody></table></div> : <p key={key}>{displayText(block.text)}</p>)
    } else if (block.type === 'image') {
      const src = safeUrl(block.src)
      if (src) {
        const sameOrigin = new URL(src).origin === window.location.origin
        nodes.push(sameOrigin
          ? <figure key={key}><img src={src} alt={displayText(block.text)} loading="lazy" />{block.text && <figcaption>{displayText(block.text)}</figcaption>}</figure>
          : <p className="msbm-rich-media-link" key={key}><a href={src} target="_blank" rel="noreferrer">{displayText(block.text) || 'View programme image'} <span aria-hidden="true">↗</span></a></p>)
      }
    } else if (block.type === 'embed') {
      const src = safeUrl(block.src)
      if (src) nodes.push(<p key={key}><a href={src} target="_blank" rel="noreferrer">{displayText(block.text) || 'View programme media'} <span aria-hidden="true">↗</span></a></p>)
    } else if (block.type === 'blockquote') nodes.push(<blockquote key={key}>{displayText(block.text)}</blockquote>)
    else if (block.type === 'fact') nodes.push(<p key={key}><strong>{displayText(block.label || block.field)}: </strong>{displayText(block.value) || displayText(block.text)}</p>)
    else if (block.type === 'module') continue
    else if (block.type === 'sectionText' && blocks.some((item) => !['sectionText', 'image', 'embed'].includes(item.type) && !/^h[1-6]$/.test(item.type))) {
      // The capture includes wrapper text when it carries content outside normal paragraphs.
      // Keep it available without repeating the whole section in the main reading flow.
      nodes.push(<details className="msbm-rich-additional" key={key}><summary>Additional programme information</summary><p>{displayText(block.text)}</p></details>)
    } else nodes.push(<p key={key}>{displayText(block.text)}</p>)
  }
  return <div className="msbm-rich-content">{nodes}</div>
}
