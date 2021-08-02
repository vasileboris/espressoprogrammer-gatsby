import * as React from 'react'
import Header from './header'
import Navigation from './navigation'
import Footer from './footer'

const Layout = ({ data, children }) => {

  return (
    <div className="page">
      <Header data={data}/>
      <Navigation/>
      <main className="content">{children}</main>
      <Footer/>
    </div>
  )
}

export default Layout
