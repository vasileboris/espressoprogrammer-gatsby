import * as React from 'react'

const Post = ({ data }) => {
  const post = data.markdownRemark

  return (
    <article
      className="post"
      itemScope
      itemType="http://schema.org/Article"
    >
      <header>
        <h1 itemProp="headline">{post.frontmatter.title}</h1>
        <p>{post.frontmatter.date}</p>
      </header>
      <section
        dangerouslySetInnerHTML={{ __html: post.html }}
        itemProp="articleBody"
      />
      <hr />
      <footer>
      </footer>
    </article>
  )
}

export default Post