"use strict";(self.webpackChunksofie_documentation=self.webpackChunksofie_documentation||[]).push([[5300],{5318:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>h});var o=n(7378);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,o,i=function(e,t){if(null==e)return{};var n,o,i={},r=Object.keys(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var l=o.createContext({}),u=function(e){var t=o.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},d=function(e){var t=u(e.components);return o.createElement(l.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},c=o.forwardRef((function(e,t){var n=e.components,i=e.mdxType,r=e.originalType,l=e.parentName,d=s(e,["components","mdxType","originalType","parentName"]),c=u(n),h=i,m=c["".concat(l,".").concat(h)]||c[h]||p[h]||r;return n?o.createElement(m,a(a({ref:t},d),{},{components:n})):o.createElement(m,a({ref:t},d))}));function h(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var r=n.length,a=new Array(r);a[0]=c;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:i,a[1]=s;for(var u=2;u<r;u++)a[u]=n[u];return o.createElement.apply(null,a)}return o.createElement.apply(null,n)}c.displayName="MDXCreateElement"},8373:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>p,frontMatter:()=>r,metadata:()=>s,toc:()=>u});var o=n(5773),i=(n(7378),n(5318));const r={description:"The Sofie team happily encourage contributions to the Sofie project, and kindly ask you to observe these guidelines when doing so."},a="Contribution Guidelines",s={unversionedId:"for-developers/contribution-guidelines",id:"version-1.37.0/for-developers/contribution-guidelines",title:"Contribution Guidelines",description:"The Sofie team happily encourage contributions to the Sofie project, and kindly ask you to observe these guidelines when doing so.",source:"@site/versioned_docs/version-1.37.0/for-developers/contribution-guidelines.md",sourceDirName:"for-developers",slug:"/for-developers/contribution-guidelines",permalink:"/sofie-core/docs/1.37.0/for-developers/contribution-guidelines",draft:!1,editUrl:"https://github.com/nrkno/sofie-core/edit/master/packages/documentation/versioned_docs/version-1.37.0/for-developers/contribution-guidelines.md",tags:[],version:"1.37.0",frontMatter:{description:"The Sofie team happily encourage contributions to the Sofie project, and kindly ask you to observe these guidelines when doing so."},sidebar:"version-1.37.0/forDevelopers",previous:{title:"API Documentation",permalink:"/sofie-core/docs/1.37.0/for-developers/api-documentation"},next:{title:"For Blueprint developers",permalink:"/sofie-core/docs/1.37.0/for-developers/for-blueprint-developers"}},l={},u=[{value:"Reporting bugs",id:"reporting-bugs",level:2},{value:"Contributing code",id:"contributing-code",level:2},{value:"How to contribute",id:"how-to-contribute",level:3},{value:"Minor improvements and bug fixes",id:"minor-improvements-and-bug-fixes",level:4},{value:"New features or bigger changes",id:"new-features-or-bigger-changes",level:4},{value:"Things to keep in mind when contributing",id:"things-to-keep-in-mind-when-contributing",level:3},{value:"Types",id:"types",level:4},{value:"Code style &amp; formatting",id:"code-style--formatting",level:4},{value:"Documentation",id:"documentation",level:4},{value:"Tests",id:"tests",level:4},{value:"Updating Dependencies",id:"updating-dependencies",level:3},{value:"Resolutions",id:"resolutions",level:4}],d={toc:u};function p(e){let{components:t,...n}=e;return(0,i.kt)("wrapper",(0,o.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"contribution-guidelines"},"Contribution Guidelines"),(0,i.kt)("h2",{id:"reporting-bugs"},"Reporting bugs"),(0,i.kt)("p",null,"If you think you have found a bug in Sofie, we appreciate bug reports as GitHub issues."),(0,i.kt)("p",null,"As a minimum a bug report should include the following:"),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("strong",{parentName:"li"},"Steps to reproduce:")," a detailed description of what input or interaction caused the problem you are experiencing. This will help us greatly in reproducing the error situation ourselves, so that we can observe and analyze the problem."),(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("strong",{parentName:"li"},"Expected behavior or result:")," Following the steps given, what was it that you expected to happen?"),(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("strong",{parentName:"li"},"Actual behavior or result:")," Following the steps given, what was it that actually happened?")),(0,i.kt)("p",null,"Feel free to include additional information if you have it."),(0,i.kt)("p",null,"Issues should be reported in our main repository: ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/nrkno/Sofie-TV-automation/issues"},"https://github.com/nrkno/Sofie-TV-automation/issues")),(0,i.kt)("h2",{id:"contributing-code"},"Contributing code"),(0,i.kt)("h3",{id:"how-to-contribute"},"How to contribute"),(0,i.kt)("h4",{id:"minor-improvements-and-bug-fixes"},"Minor improvements and bug fixes"),(0,i.kt)("p",null,"If you believe you have a minor improvement or a bug fix that can be added to the project you are welcome to contribute it as a pull request via GitHub."),(0,i.kt)("h4",{id:"new-features-or-bigger-changes"},"New features or bigger changes"),(0,i.kt)("p",null,"If you're considering a larger contribution, we would love to have a chat beforehand about it to make sure it fits nicely into our own development. Please open an issue for discussion over at ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/nrkno/Sofie-TV-automation/issues"},"https://github.com/nrkno/Sofie-TV-automation/issues")),(0,i.kt)("h3",{id:"things-to-keep-in-mind-when-contributing"},"Things to keep in mind when contributing"),(0,i.kt)("h4",{id:"types"},"Types"),(0,i.kt)("p",null,"All of the Sofie projects use Typescript. When you contribute code, be sure to keep it as strictly-typed as possible."),(0,i.kt)("h4",{id:"code-style--formatting"},"Code style & formatting"),(0,i.kt)("p",null,"Most of the projects use a linter. Before pushing your code, make sure it abides to the linting rules by running ",(0,i.kt)("inlineCode",{parentName:"p"},"yarn lint"),". ",(0,i.kt)("inlineCode",{parentName:"p"},"yarn lint --fix"),"can fix most of the issues."),(0,i.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},'Tip: If using VS Code, turn on the "format on save"-feature in the settings, that way you won\'t have to think about formatting!'))),(0,i.kt)("h4",{id:"documentation"},"Documentation"),(0,i.kt)("p",null,'To be honest, we don\'t aim to have the "absolute perfect documentation possible". BUT we do try to improve and add documentation to have a good-enough-to-be-comprehensible standard.'),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},'The "what" something does something, is not as important - we can read the code for that.'),(0,i.kt)("li",{parentName:"ul"},'The "why" something does something, IS important. Implied usage, side-effects, descriptions of the context etc.. Those are things that greatly help a reader.')),(0,i.kt)("h4",{id:"tests"},"Tests"),(0,i.kt)("p",null,"Most of the sofie-projects have unit-tests with a fairly good coverage. While developing, make sure any existing tests pass before you push your code. ",(0,i.kt)("inlineCode",{parentName:"p"},"yarn test")," or ",(0,i.kt)("inlineCode",{parentName:"p"},"yarn watch")," are your friends."),(0,i.kt)("h3",{id:"updating-dependencies"},"Updating Dependencies"),(0,i.kt)("p",null,"When updating dependencies in a library, it is preferred to do so via ",(0,i.kt)("inlineCode",{parentName:"p"},"yarn upgrade-interactive --latest")," whenever possible. This is so that the versions in package.json are also updated as we have no guarantee that the library will work with versions lower than that used in the yarn.lock file, even if it is compatible with the semver range in package.json. After this, a ",(0,i.kt)("inlineCode",{parentName:"p"},"yarn upgrade")," can be used to update any child dependencies"),(0,i.kt)("p",null,"Be careful with bumping across major versions."),(0,i.kt)("p",null,"Also, be aware that a couple of the libraries want to retain support for node8. Not all dependencies can be updated as doing so will cause things to break for node8."),(0,i.kt)("h4",{id:"resolutions"},"Resolutions"),(0,i.kt)("p",null,"We use the yarn resolutions property in package.json sometimes to fix security vulnerabilities in dependencies of libraries that haven't released a fix yet. If adding a new one, try to make it as specific as possible to ensure it doesn't have unintended side effects."),(0,i.kt)("p",null,"When updating other dependencies, it is a good idea to make sure that the resolutions defined still apply and are correct"),(0,i.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"We use Jest for running unit-tests. ",(0,i.kt)("a",{parentName:"p",href:"https://jestjs.io/docs/en/cli"},"Read more about its CLI here"),"."))))}p.isMDXComponent=!0}}]);