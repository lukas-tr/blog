import React from 'react';
import {Helmet} from 'react-helmet';
import _ from 'lodash';

import {safePrefix} from '../utils';
import Header from './Header';
import Footer from './Footer';

export default class Body extends React.Component {
    render() {
        const description = _.get(this.props, 'pageContext.site.siteMetadata.description');
        const title = (_.get(this.props, 'pageContext.frontmatter.title') && (_.get(this.props, 'pageContext.frontmatter.title') + ' - ')) + _.get(this.props, 'pageContext.site.siteMetadata.title');
        const author = _.get(this.props, 'pageContext.site.siteMetadata.author');
        const image = _.get(this.props, 'pageContext.site.siteMetadata.image');
        const url = _.get(this.props, 'pageContext.site.siteMetadata.siteUrl');
        return (
            <React.Fragment>
                <Helmet
                    script={[{
                        type: "application/ld+json",
                        innerHTML: JSON.stringify(
                            {
                                "@context": "https://schema.org",
                                "@type": "WebSite",
                                "url": url,
                                // "logo": "http://www.example.com/images/logo.png"
                            }
                        )
                    }]}
                >
                    <title>{title}</title>
                    <meta charSet="utf-8"/>
                    <meta name="viewport" content="width=device-width, initialScale=1.0" />
                    <meta name="google" content="notranslate" />
                    <link href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i" rel="stylesheet"/>
                    <link rel="stylesheet" href={safePrefix('assets/css/main.css')}/>
                    {/* RSS auto discovery */}
                    <link rel="alternate" type="application/rss+xml" title="RSS" href="https://blog.lukastroyer.com/rss.xml"></link>
                    {/* fontawesome icons */}
                    <link rel="stylesheet" href={safePrefix('assets/css/all.css')}/>
                    {[
                      {
                        name: `description`,
                        content: description,
                      },
                      {
                        property: `og:title`,
                        content: title,
                      },
                      {
                        property: `og:description`,
                        content: description,
                      },
                      {
                        property: `og:type`,
                        content: `website`,
                      },
                      {
                        property: `og:image`,
                        content: image,
                      },
                      {
                        name: `twitter:card`,
                        content: `summary`,
                      },
                      {
                        name: `twitter:creator`,
                        content: author,
                      },
                      {
                        name: `twitter:title`,
                        content: title,
                      },
                      {
                        name: `twitter:description`,
                        content: description,
                      },
                      {
                        name: `twitter:image`,
                        content: image,
                      }
                    ].map((m, idx)=> <meta key={idx} name={m.name} property={m.property} content={m.content}></meta>)}
                </Helmet>
                <div id="page" className={'site style-' + _.get(this.props, 'pageContext.site.siteMetadata.layout_style') + ' palette-' + _.get(this.props, 'pageContext.site.siteMetadata.palette')}>
                  <Header {...this.props} />
                  <div id="content" className="site-content">
                    <div className="inner">
                      <main id="main" className="site-main">
                        {this.props.children}
                      </main>
                      <Footer {...this.props} />
                    </div>
                  </div>
                </div>
            </React.Fragment>
        );
    }
}
