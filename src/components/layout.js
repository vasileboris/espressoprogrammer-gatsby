import * as React from "react"
import Header from './header';
import Footer from './footer';

const Layout = ({ data, children }) => {

  return (
    <div className="page">
      <Header data={data}/>
      <main>{children}</main>
      <Footer/>
    </div>
  )
}

export default Layout
