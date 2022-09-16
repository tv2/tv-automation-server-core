"use strict";(self.webpackChunksofie_documentation=self.webpackChunksofie_documentation||[]).push([[4670],{9110:function(e,t,n){n.r(t),n.d(t,{assets:function(){return c},contentTitle:function(){return l},default:function(){return m},frontMatter:function(){return s},metadata:function(){return d},toc:function(){return u}});var a=n(2685),r=n(1244),o=(n(7378),n(5318)),i=["components"],s={sidebar_position:3},l="Access Levels",d={unversionedId:"user-guide/features/access-levels",id:"user-guide/features/access-levels",title:"Access Levels",description:"A variety of access levels can be set via the URL. By default, a user cannot edit settings, nor play out anything. Some of the access levels provide additional administrative pages or helpful tool tips for new users. These modes are persistent between sessions and will need to be manually disabled by replacing the 1 with a 0 in the URL. Below is a quick reference to the modes and what they have access to.",source:"@site/docs/user-guide/features/access-levels.md",sourceDirName:"user-guide/features",slug:"/user-guide/features/access-levels",permalink:"/sofie-core/docs/user-guide/features/access-levels",editUrl:"https://github.com/nrkno/sofie-core/edit/master/packages/documentation/docs/user-guide/features/access-levels.md",tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3},sidebar:"userGuide",previous:{title:"Sofie Views",permalink:"/sofie-core/docs/user-guide/features/sofie-views"},next:{title:"Prompter",permalink:"/sofie-core/docs/user-guide/features/prompter"}},c={},u=[{value:"Basic mode",id:"basic-mode",level:3},{value:"Studio mode",id:"studio-mode",level:3},{value:"Configuration mode",id:"configuration-mode",level:3},{value:"Help Mode",id:"help-mode",level:3},{value:"Admin Mode",id:"admin-mode",level:3},{value:"Testing Mode",id:"testing-mode",level:3},{value:"Developer Mode",id:"developer-mode",level:3}],p={toc:u};function m(e){var t=e.components,n=(0,r.Z)(e,i);return(0,o.kt)("wrapper",(0,a.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"access-levels"},"Access Levels"),(0,o.kt)("p",null,"A variety of access levels can be set via the URL. By default, a user cannot edit settings, nor play out anything. Some of the access levels provide additional administrative pages or helpful tool tips for new users. These modes are persistent between sessions and will need to be manually disabled by replacing the ",(0,o.kt)("em",{parentName:"p"},"1")," with a ",(0,o.kt)("em",{parentName:"p"},"0")," in the URL. Below is a quick reference to the modes and what they have access to."),(0,o.kt)("p",null,"If user accounts are enabled ","(",(0,o.kt)("inlineCode",{parentName:"p"},"enableUserAccounts")," in ",(0,o.kt)("a",{parentName:"p",href:"../configuration/sofie-core-settings#settings-file"},(0,o.kt)("em",{parentName:"a"},"Sofie","\xa0","Core")," settings"),")",", the access levels are set under the user settings. If no user accounts are set, the access level for a browser is set by adding ",(0,o.kt)("inlineCode",{parentName:"p"},"?theaccessmode=1")," to the URL as described below."),(0,o.kt)("p",null,"The access level is persisted in browser's Local Storage. To disable, visit",(0,o.kt)("inlineCode",{parentName:"p"},"?theaccessmode=0"),"."),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Access area"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Basic Mode"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Configuration Mode"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Studio Mode"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Admin Mode"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("strong",{parentName:"td"},"Rundowns")),(0,o.kt)("td",{parentName:"tr",align:"left"},"View Only"),(0,o.kt)("td",{parentName:"tr",align:"left"},"View Only"),(0,o.kt)("td",{parentName:"tr",align:"left"},"Yes, playout"),(0,o.kt)("td",{parentName:"tr",align:"left"},"Yes, playout")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("strong",{parentName:"td"},"Settings")),(0,o.kt)("td",{parentName:"tr",align:"left"},"No"),(0,o.kt)("td",{parentName:"tr",align:"left"},"Yes"),(0,o.kt)("td",{parentName:"tr",align:"left"},"No"),(0,o.kt)("td",{parentName:"tr",align:"left"},"Yes")))),(0,o.kt)("h3",{id:"basic-mode"},"Basic mode"),(0,o.kt)("p",null,"Without enabling any additional modes in Sofie, the browser will have minimal access to the system. It will be able to view a rundown but, will not have the ability to manipulate it. This includes activating, deactivating, or resetting the rundown as well as taking the next part, adlib, etc."),(0,o.kt)("h3",{id:"studio-mode"},"Studio mode"),(0,o.kt)("p",null,"Studio Mode gives the current browser full control of the studio and all information associated to it. This includes allowing actions like activating and deactivating rundowns, taking parts, adlibbing, etc. This mode is accessed by adding a ",(0,o.kt)("inlineCode",{parentName:"p"},"?studio=1")," to the end of the URL."),(0,o.kt)("h3",{id:"configuration-mode"},"Configuration mode"),(0,o.kt)("p",null,"Configuration mode gives the user full control over the Settings pages and allows full access to the system including the ability to modify ",(0,o.kt)("em",{parentName:"p"},"Blueprints"),", ",(0,o.kt)("em",{parentName:"p"},"Studios"),", or ",(0,o.kt)("em",{parentName:"p"},"Show Styles"),", creating and restoring ",(0,o.kt)("em",{parentName:"p"},"Snapshots"),", as well as modifying attached devices."),(0,o.kt)("h3",{id:"help-mode"},"Help Mode"),(0,o.kt)("p",null,"Enables some tooltips that might be useful to new users. This mode is accessed by adding ",(0,o.kt)("inlineCode",{parentName:"p"},"?help=1")," to the end of the URL."),(0,o.kt)("h3",{id:"admin-mode"},"Admin Mode"),(0,o.kt)("p",null,"This mode will give the user the same access as the ",(0,o.kt)("em",{parentName:"p"},"Configuration")," and ",(0,o.kt)("em",{parentName:"p"},"Studio")," modes as well as having access to a set of ",(0,o.kt)("em",{parentName:"p"},"Test Tools")," and a ",(0,o.kt)("em",{parentName:"p"},"Manual Control")," section on the Rundown page."),(0,o.kt)("p",null,"This mode is enabled when ",(0,o.kt)("inlineCode",{parentName:"p"},"?admin=1")," is added the end of the URL."),(0,o.kt)("h3",{id:"testing-mode"},"Testing Mode"),(0,o.kt)("p",null,"Enables the page Test Tools, which contains various tools useful for testing the system during development. This mode is enabled when ",(0,o.kt)("inlineCode",{parentName:"p"},"?testing=1")," is added the end of the URL."),(0,o.kt)("h3",{id:"developer-mode"},"Developer Mode"),(0,o.kt)("p",null,"This mode will enable the browsers default right click menu to appear and can be accessed by adding ",(0,o.kt)("inlineCode",{parentName:"p"},"?develop=1")," to the URL. It will also reveal the Manual Control section on the Rundown page."))}m.isMDXComponent=!0},5318:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return m}});var a=n(7378);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=a.createContext({}),d=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},c=function(e){var t=d(e.components);return a.createElement(l.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},p=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,l=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),p=d(n),m=r,f=p["".concat(l,".").concat(m)]||p[m]||u[m]||o;return n?a.createElement(f,i(i({ref:t},c),{},{components:n})):a.createElement(f,i({ref:t},c))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,i=new Array(o);i[0]=p;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:r,i[1]=s;for(var d=2;d<o;d++)i[d]=n[d];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}p.displayName="MDXCreateElement"}}]);