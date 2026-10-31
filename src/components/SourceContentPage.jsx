import { Link } from 'react-router-dom'
import { PageIntro } from './Catalog.jsx'

function SourceBlock({ block }) {
  if (block.type === 'ul' || block.type === 'ol') {
    const Tag = block.type
    return <Tag>{block.items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</Tag>
  }
  if (block.type === 'table') {
    return <div className="msbm-source-article__table"><table><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
  }
  if (block.type === 'blockquote') return <blockquote>{block.text}</blockquote>
  const Tag = ['h1', 'h2', 'h3', 'h4'].includes(block.type) ? block.type : 'p'
  return <Tag>{block.text}</Tag>
}

export default function SourceContentPage({ page }) {
  const sectionHeading = page.path.split('/').filter(Boolean).length > 1
    ? page.blocks.find((block) => ['h1', 'h2', 'h3', 'h4'].includes(block.type))?.text
    : null
  const title = sectionHeading || page.title
  const blocks = page.blocks.filter((block, index) => !(index === 0 && block.text?.toLocaleLowerCase() === title.toLocaleLowerCase()))
  return <>
    <PageIntro eyebrow="GSS Information" title={title} description={page.description || `Official information about ${title} from The Global School of Skills (GSS).`} />
    <section className="msbm-source-page"><div className="container ma-container-1"><aside><span>On this page</span><strong>{title}</strong><Link to="/contact">Ask an advisor <i className="ph ph-arrow-right" /></Link></aside><article className="msbm-source-article">{blocks.map((block, index) => <SourceBlock block={block} key={`${block.type}-${index}`} />)}<div className="msbm-source-article__origin"><i className="ph ph-seal-check" /><div><strong>Source-backed information</strong><p>This page preserves the information published by GSS in the Marrky interface.</p></div><a href={page.sourceUrl} target="_blank" rel="noreferrer">View official source <i className="ph ph-arrow-up-right" /></a></div></article></div></section>
  </>
}
