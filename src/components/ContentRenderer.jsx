import parse, { attributesToProps, domToReact, Element } from 'html-react-parser'
import { Link } from 'react-router-dom'

function isInternalRoute(href) {
  return href?.startsWith('/') && !href.startsWith('//')
}

export default function ContentRenderer({ html }) {
  const options = {
    replace(node) {
      if (!(node instanceof Element)) return undefined
      if (node.name === 'a' && isInternalRoute(node.attribs?.href)) {
        const { href, ...attributes } = node.attribs
        return <Link to={href} {...attributesToProps(attributes)}>{domToReact(node.children, options)}</Link>
      }
      return undefined
    },
  }
  return parse(html, options)
}
