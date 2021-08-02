import * as React from 'react'
import { Link } from 'gatsby'

const PostNavigation = ({ data }) => {
  const post = data.markdownRemark
  const { previous, next } = data

  return (
    <nav className="blog-post-nav">
      <ul
        style={{
          display: `flex`,
          flexWrap: `wrap`,
          justifyContent: `space-between`,
          listStyle: `none`,
          padding: 0,
        }}
      >
        <li>
          {'post' === post.frontmatter.type && previous && (
            <Link to={previous.fields.slug} rel="prev">
              ← {previous.frontmatter.title}
            </Link>
          )}
        </li>
        <li>
          {'post' === post.frontmatter.type && next && (
            <Link to={next.fields.slug} rel="next">
              {next.frontmatter.title} →
            </Link>
          )}
        </li>
      </ul>
    </nav>
  )
}

export default PostNavigation