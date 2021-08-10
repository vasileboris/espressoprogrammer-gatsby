import * as React from 'react'
import { Link, graphql } from 'gatsby'

import Layout from '../components/layout'
import Seo from '../components/seo'

const Index = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes

  if (posts.length === 0) {
    return (
      <Layout data={data}>
        <Seo title="All posts" />
        <p>
          No blog posts found. Add markdown posts to "content/blog" (or the
          directory you specified for the "gatsby-source-filesystem" plugin in
          gatsby-config.js).
        </p>
      </Layout>
    )
  }

  return (
    <Layout data={data}>
      <Seo title="All posts" />
      <div className="posts-list">
        {posts.map(post => {
          const title = post.frontmatter.title || post.fields.slug

          return (
            <article key={post.fields.slug}
              className="post-list-item"
              itemScope
              itemType="http://schema.org/Article"
            >
              <header>
                <h1>
                  <Link to={post.fields.slug} itemProp="url">
                    <span itemProp="headline">{title}</span>
                  </Link>
                </h1>
                <time className="post-time">{post.frontmatter.date}</time>
              </header>
              <section>
                <p
                  dangerouslySetInnerHTML={{
                    __html: post.frontmatter.description || post.excerpt,
                  }}
                  itemProp="description"
                />
              </section>
            </article>
          )
        })}
      </div>
    </Layout>
  )
}

export default Index

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title,
        description
      }
    }
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {children: {}, frontmatter: {type: {eq: "post"}}}
    ) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "D MMMM YYYY")
          title
          description
        }
      }
    }
  }
`
