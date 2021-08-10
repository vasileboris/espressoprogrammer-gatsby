import * as React from 'react'

const Post = ({ data }) => {
  const post = data.markdownRemark

  return (
    <article
      className="post"
      itemScope
      itemType="http://schema.org/Article"
    >
      <header className="post-info">
        <h1 itemProp="headline">{post.frontmatter.title}</h1>
        <time className="post-time">{post.frontmatter.date}</time>
      </header>
      <section className="post-content"
        dangerouslySetInnerHTML={{ __html: post.html }}
        itemProp="articleBody"
      />
    </article>
  )
}

export default Post