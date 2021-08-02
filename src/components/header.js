import * as React from 'react'
import { Link } from 'gatsby'
import { StaticImage } from 'gatsby-plugin-image'

const Header = ({ data }) => {
  const title = data.site.siteMetadata?.title || `Title`
  const description = data.site.siteMetadata?.description || `Description`

  return (
    <header className="header">
      <nav className="blog-header">
        <div className="blog-home">
          <Link to="/" title={title} rel="home">
            <StaticImage src="../../content/images/expressoprogrammer-100x100.png"
                         alt={title}
                         className="blog-logo"/>
          </Link>
        </div>
        <div className="blog-info">
          <div className="blog-name">
            <Link to="/" title={title} rel="home">{title}</Link>
          </div>
          <div className="blog-description">{description}</div>
        </div>
      </nav>
    </header>
  )
}

export default Header
