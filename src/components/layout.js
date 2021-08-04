import * as React from 'react'
import Header from './header'
import Pages from './pages'
import Sidebar from './sidebar'
import Footer from './footer'

const Layout = ({ data, children }) => {

  return (
    <div className="page">
      <Header data={data}/>
      <Pages/>
      <main className="content">{children}</main>
      <Sidebar/>
      <Footer/>
    </div>
  )
}

export default Layout
