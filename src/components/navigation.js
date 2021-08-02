import * as React from 'react'
import { useStaticQuery, graphql, Link } from 'gatsby'

const Navigation = () => {
  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark(
        sort: { fields: [frontmatter___order], order: ASC }
        filter: {children: {}, frontmatter: {type: {eq: "page"}, order: {ne: null}}}
      ) {
        nodes {
          id
          fields {
            slug
          }
          frontmatter {
            title
            order
          }
        }
      }
    }
  `)
  const pages = data.allMarkdownRemark.nodes

  return (
    <nav className="menu">
      <ul className="menu-items">
        {pages.map(page => {
          return (
            <li key={page.id} className="menu-item">
              <Link to={page.fields.slug}>{page.frontmatter.title}</Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default Navigation
