import React from 'react';

export const UtterancesComments = () => (
  <section
    ref={elem => {
      // don't show comments while developing
      if (!elem || process.env.NODE_ENV === "development") {
        return;
      }
      const scriptElem = document.createElement("script");
      scriptElem.src = "https://utteranc.es/client.js";
      scriptElem.async = true;
      scriptElem.crossOrigin = "anonymous";
      scriptElem.setAttribute("repo", "lukas-tr/blog");
      scriptElem.setAttribute("issue-term", "title");
      scriptElem.setAttribute("label", "comment");
      scriptElem.setAttribute("theme", "github-light");
      elem.appendChild(scriptElem);
    }}
  />
);
