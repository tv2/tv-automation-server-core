"use strict";(self.webpackChunksofie_documentation=self.webpackChunksofie_documentation||[]).push([[7430],{5318:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>p});var a=n(7378);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function r(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var l=a.createContext({}),d=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},c=function(e){var t=d(e.components);return a.createElement(l.Provider,{value:t},e.children)},h={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},u=a.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,l=e.parentName,c=r(e,["components","mdxType","originalType","parentName"]),u=d(n),p=i,m=u["".concat(l,".").concat(p)]||u[p]||h[p]||o;return n?a.createElement(m,s(s({ref:t},c),{},{components:n})):a.createElement(m,s({ref:t},c))}));function p(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,s=new Array(o);s[0]=u;var r={};for(var l in t)hasOwnProperty.call(t,l)&&(r[l]=t[l]);r.originalType=e,r.mdxType="string"==typeof e?e:i,s[1]=r;for(var d=2;d<o;d++)s[d]=n[d];return a.createElement.apply(null,s)}return a.createElement.apply(null,n)}u.displayName="MDXCreateElement"},6243:(e,t,n)=>{n.d(t,{Z:()=>s});var a=n(7378),i=n(8944);const o="tabItem_lLGn";function s(e){let{children:t,hidden:n,className:s}=e;return a.createElement("div",{role:"tabpanel",className:(0,i.Z)(o,s),hidden:n},t)}},637:(e,t,n)=>{n.d(t,{Z:()=>p});var a=n(5773),i=n(7378),o=n(6457),s=n(784),r=n(9947),l=n(3457),d=n(8944);const c="tabList_lSCs",h="tabItem_WhCL";function u(e){var t,n;const{lazy:o,block:u,defaultValue:p,values:m,groupId:v,className:w}=e,f=i.Children.map(e.children,(e=>{if((0,i.isValidElement)(e)&&void 0!==e.props.value)return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)})),k=m??f.map((e=>{let{props:{value:t,label:n,attributes:a}}=e;return{value:t,label:n,attributes:a}})),g=(0,s.l)(k,((e,t)=>e.value===t.value));if(g.length>0)throw new Error(`Docusaurus error: Duplicate values "${g.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`);const b=null===p?p:p??(null==(t=f.find((e=>e.props.default)))?void 0:t.props.value)??(null==(n=f[0])?void 0:n.props.value);if(null!==b&&!k.some((e=>e.value===b)))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${b}" but none of its children has the corresponding value. Available values are: ${k.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);const{tabGroupChoices:y,setTabGroupChoices:N}=(0,r.U)(),[S,T]=(0,i.useState)(b),x=[],{blockElementScrollPositionUntilNextRender:P}=(0,l.o5)();if(null!=v){const e=y[v];null!=e&&e!==S&&k.some((t=>t.value===e))&&T(e)}const R=e=>{const t=e.currentTarget,n=x.indexOf(t),a=k[n].value;a!==S&&(P(t),T(a),null!=v&&N(v,a))},C=e=>{var t;let n=null;switch(e.key){case"ArrowRight":{const t=x.indexOf(e.currentTarget)+1;n=x[t]||x[0];break}case"ArrowLeft":{const t=x.indexOf(e.currentTarget)-1;n=x[t]||x[x.length-1];break}}null==(t=n)||t.focus()};return i.createElement("div",{className:(0,d.Z)("tabs-container",c)},i.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,d.Z)("tabs",{"tabs--block":u},w)},k.map((e=>{let{value:t,label:n,attributes:o}=e;return i.createElement("li",(0,a.Z)({role:"tab",tabIndex:S===t?0:-1,"aria-selected":S===t,key:t,ref:e=>x.push(e),onKeyDown:C,onFocus:R,onClick:R},o,{className:(0,d.Z)("tabs__item",h,null==o?void 0:o.className,{"tabs__item--active":S===t})}),n??t)}))),o?(0,i.cloneElement)(f.filter((e=>e.props.value===S))[0],{className:"margin-top--md"}):i.createElement("div",{className:"margin-top--md"},f.map(((e,t)=>(0,i.cloneElement)(e,{key:t,hidden:e.props.value!==S})))))}function p(e){const t=(0,o.Z)();return i.createElement(u,(0,a.Z)({key:String(t)},e))}},8646:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>l,default:()=>p,frontMatter:()=>r,metadata:()=>d,toc:()=>h});var a=n(5773),i=(n(7378),n(5318)),o=n(637),s=n(6243);const r={sidebar_position:2},l="Sofie Views",d={unversionedId:"user-guide/features/sofie-views",id:"version-1.37.0/user-guide/features/sofie-views",title:"Sofie Views",description:"Lobby View",source:"@site/versioned_docs/version-1.37.0/user-guide/features/sofie-views.mdx",sourceDirName:"user-guide/features",slug:"/user-guide/features/sofie-views",permalink:"/sofie-core/docs/1.37.0/user-guide/features/sofie-views",draft:!1,editUrl:"https://github.com/nrkno/sofie-core/edit/master/packages/documentation/versioned_docs/version-1.37.0/user-guide/features/sofie-views.mdx",tags:[],version:"1.37.0",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"version-1.37.0/gettingStarted",previous:{title:"Settings View",permalink:"/sofie-core/docs/1.37.0/user-guide/configuration/settings-view"},next:{title:"Access Levels",permalink:"/sofie-core/docs/1.37.0/user-guide/features/access-levels"}},c={},h=[{value:"Lobby View",id:"lobby-view",level:2},{value:"Rundown View",id:"rundown-view",level:2},{value:"Take Point",id:"take-point",level:4},{value:"Next Point",id:"next-point",level:4},{value:"Freeze-frame Countdown",id:"freeze-frame-countdown",level:4},{value:"Lookahead",id:"lookahead",level:4},{value:"Storyboard Mode",id:"storyboard-mode",level:3},{value:"Segment Header Countdowns",id:"segment-header-countdowns",level:3},{value:"Rundown Dividers",id:"rundown-dividers",level:3},{value:"Shelf",id:"shelf",level:3},{value:"Shelf Layouts",id:"shelf-layouts",level:3},{value:"Sidebar Panel",id:"sidebar-panel",level:3},{value:"Switchboard",id:"switchboard",level:4},{value:"Prompter View",id:"prompter-view",level:2},{value:"Presenter View",id:"presenter-view",level:2},{value:"Presenter View Overlay",id:"presenter-view-overlay",level:3},{value:"Active Rundown View",id:"active-rundown-view",level:2},{value:"Active Rundown \u2013 Shelf",id:"active-rundown--shelf",level:2},{value:"Specific Rundown \u2013 Shelf",id:"specific-rundown--shelf",level:2},{value:"Screensaver",id:"screensaver",level:2},{value:"System Status",id:"system-status",level:2},{value:"Media Status View",id:"media-status-view",level:2},{value:"Message Queue View",id:"message-queue-view",level:2},{value:"User Log View",id:"user-log-view",level:2},{value:"Columns, explained",id:"columns-explained",level:3},{value:"Execution time",id:"execution-time",level:4},{value:"Action",id:"action",level:4},{value:"Method",id:"method",level:4},{value:"Status",id:"status",level:4},{value:"Evaluations",id:"evaluations",level:2},{value:"Settings View",id:"settings-view",level:2}],u={toc:h};function p(e){let{components:t,...r}=e;return(0,i.kt)("wrapper",(0,a.Z)({},u,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"sofie-views"},"Sofie Views"),(0,i.kt)("h2",{id:"lobby-view"},"Lobby View"),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Rundown View",src:n(3540).Z,width:"2332",height:"1532"})),(0,i.kt)("p",null,"All existing rundowns are listed in the ",(0,i.kt)("em",{parentName:"p"},"Lobby View"),"."),(0,i.kt)("h2",{id:"rundown-view"},"Rundown View"),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Rundown View",src:n(2943).Z,width:"500",height:"288"})),(0,i.kt)("p",null,"The ",(0,i.kt)("em",{parentName:"p"},"Rundown View")," is the main view that the producer is working in."),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"The Rundown view and naming conventions of components",src:n(9208).Z,width:"957",height:"529"})),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Take Next",src:n(3718).Z,width:"1122",height:"366"})),(0,i.kt)("h4",{id:"take-point"},"Take Point"),(0,i.kt)("p",null,"The Take point is currently playing ",(0,i.kt)("a",{parentName:"p",href:"#part"},"Part"),' in the rundown, indicated by the "On Air" line in the GUI.',(0,i.kt)("br",{parentName:"p"}),"\n","What's played on air is calculated from the timeline objects in the Pieces in the currently playing part."),(0,i.kt)("p",null,"The Pieces inside of a Part determines what's going to happen, the could be indicating things like VT:s, cut to cameras, graphics, or what script the host is going to read."),(0,i.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"You can TAKE the next part by pressing ",(0,i.kt)("em",{parentName:"p"},"F12")," or the ",(0,i.kt)("em",{parentName:"p"},"Numpad Enter")," key."))),(0,i.kt)("h4",{id:"next-point"},"Next Point"),(0,i.kt)("p",null,"The Next point is the next queued Part in the rundown. When the user clicks ",(0,i.kt)("em",{parentName:"p"},"Take"),", the Next Part becomes the currently playing part, and the Next point is also moved."),(0,i.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"Change the Next point by right-clicking in the GUI, or by pressing ","(","Shift +",")"," F9 & F10."))),(0,i.kt)("h4",{id:"freeze-frame-countdown"},"Freeze-frame Countdown"),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Part is 1 second heavy, LiveSpeak piece has 7 seconds of playback until it freezes",src:n(1214).Z,width:"374",height:"327"})),(0,i.kt)("p",null,"If a Piece has more or less content than the Part's expected duration allows, an additional counter with a Snowflake icon will be displayed, attached to the On Air line, counting down to the moment when content from that Piece will freeze-frame at the last frame. The time span in which the content from the Piece will be visible on the output, but will be frozen, is displayed with an overlay of icicles."),(0,i.kt)("h4",{id:"lookahead"},"Lookahead"),(0,i.kt)("p",null,"Elements in the ",(0,i.kt)("a",{parentName:"p",href:"#next-point"},"Next point")," ","(","or beyond",")",' might be pre-loaded or "put on preview", depending on the blueprints and playout devices used. This feature is called "Lookahead".'),(0,i.kt)("h3",{id:"storyboard-mode"},"Storyboard Mode"),(0,i.kt)("p",null,"To the left side of the Zoom buttons, there's a button controlling the display style of a given Segment. The default display style of\na Segment can be indicated by the ",(0,i.kt)("a",{parentName:"p",href:"../concepts-and-architecture#blueprints"},"Blueprints"),", but the User can switch to\na different mode at any time."),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Storyboard Mode",src:n(4669).Z,width:"1805",height:"320"})),(0,i.kt)("p",null,"The ",(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("em",{parentName:"strong"},"Storyboard"))," mode is an alternative to the default ",(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("em",{parentName:"strong"},"Timeline"))," mode. In Storyboard mode, the accurate placement in time of each Piece is not visualized, so that more Parts can be visualized at once. This can be particularly useful in Shows without very strict timing planning or where timing is not driven by the User, but rather some external factor; or in Shows where very long Parts are joined with very short ones: sports, events and debates. This mode also does not visualize the history of the playback: rather, it only shows what is currently On Air or is planned to go On Air."),(0,i.kt)("p",null,'Storyboard mode selects a "main" Piece of the Part, using the same logic as the ',(0,i.kt)("a",{parentName:"p",href:"#presenter-view"},"Presenter View"),", and presents it with a big, hover-scrub-enabled thumbnail for easy preview. The countdown to freeze-frame is displayed in the top-right hand corner of the Thumbnail, once less than 10 seconds remain to freeze-frame. The Transition Piece is displayed on top of the thumbnail. Other Pieces are placed below the thumbnail, stacked in order of playback. After a Piece goes off-air, it will dissapear from the view."),(0,i.kt)("p",null,"If no more Parts can be displayed in a given Segment, they are stacked in order on the right side of the Segment. The User can scroll through thse Parts by click-and-dragging the Storyboard area, or using the mouse wheel - ",(0,i.kt)("inlineCode",{parentName:"p"},"Alt"),"+Wheel, if only a vertical wheel is present in the mouse."),(0,i.kt)("p",null,"All user interactions work in the Storyboard mode the same as in Timeline mode: Takes, AdLibs, Holds and moving the ",(0,i.kt)("a",{parentName:"p",href:"#next-point"},"Next Point")," around the Rundown."),(0,i.kt)("h3",{id:"segment-header-countdowns"},"Segment Header Countdowns"),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Each Segment has two clocks - the Segment Time Budget and a Segment Countdown",src:n(1898).Z,width:"277",height:"477"})),(0,i.kt)(o.Z,{mdxType:"Tabs"},(0,i.kt)(s.Z,{value:"segment-time-budget",label:"Left: Segment Time Budget",default:!0,mdxType:"TabItem"},"Clock on the left is an indicator of how much time has been spent playing Parts from that Segment in relation to how much time was planned for Parts in that Segment. If more time was spent playing than was planned for, this clock will turn red, there will be a **+** sign in front of it and will begin counting upwards."),(0,i.kt)(s.Z,{value:"segment-countdown",label:"Right: Segment Countdown",mdxType:"TabItem"},"Clock on the right is a countdown to the beginning of a given segment. This takes into account unplayed time in the On Air Part and all unplayed Parts between the On Air Part and a given Segment. If there are no unplayed Parts between the On Air Part and the Segment, this counter will disappear.")),(0,i.kt)("p",null,"In the illustration above, the first Segment ","(",(0,i.kt)("em",{parentName:"p"},"Ny Sak"),")"," has been playing for 4 minutes and 25 seconds longer than it was planned for. The second segment ","(",(0,i.kt)("em",{parentName:"p"},"Direkte Str\xf8mstad",")")," is planned to play for 4 minutes and 40 seconds. There are 5 minutes and 46 seconds worth of content between the current On Air line ","(","which is in the first Segment",")"," and the second Segment."),(0,i.kt)("p",null,"If you click on the Segment header countdowns, you can switch the ",(0,i.kt)("em",{parentName:"p"},"Segment Countdown")," to a ",(0,i.kt)("em",{parentName:"p"},"Segment OnAir Clock")," where this will show the time-of-day when a given Segment is expected to air."),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Each Segment has two clocks - the Segment Time Budget and a Segment Countdown",src:n(8601).Z,width:"287",height:"255"})),(0,i.kt)("h3",{id:"rundown-dividers"},"Rundown Dividers"),(0,i.kt)("p",null,"When using a workflow and blueprints that combine multiple NRCS Rundowns into a single Sofie Rundown ","(",'such as when using the "Ready To Air" functionality in AP ENPS',")",", information about these individual NRCS Rundowns will be inserted into the Rundown View at the point where each of these incoming Rundowns start."),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Rundown divider between two NRCS Rundowns in a &quot;Ready To Air&quot; Rundown",src:n(3339).Z,width:"1823",height:"421"})),(0,i.kt)("p",null,"For reference, these headers show the Name, Planned Start and Planned Duration of the individual NRCS Rundown."),(0,i.kt)("h3",{id:"shelf"},"Shelf"),(0,i.kt)("p",null,"The shelf contains lists of AdLibs that can be played out."),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Shelf",src:n(8038).Z,width:"274",height:"151"})),(0,i.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"The Shelf can be opened by clicking the handle at the bottom of the screen, or by pressing the TAB key"))),(0,i.kt)("h3",{id:"shelf-layouts"},"Shelf Layouts"),(0,i.kt)("p",null,"The ",(0,i.kt)("em",{parentName:"p"},"Rundown View")," and the ",(0,i.kt)("em",{parentName:"p"},"Detached Shelf View")," UI can have multiple concurrent layouts for any given Show Style. The automatic selection mechanism works as follows:"),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},"select the first layout of the ",(0,i.kt)("inlineCode",{parentName:"li"},"RUNDOWN_LAYOUT")," type,"),(0,i.kt)("li",{parentName:"ol"},"select the first layout of any type,"),(0,i.kt)("li",{parentName:"ol"},"use the default layout ","(","no additional filters",")",", in the style of ",(0,i.kt)("inlineCode",{parentName:"li"},"RUNDOWN_LAYOUT"),".")),(0,i.kt)("p",null,"To use a specific layout in these views, you can use the ",(0,i.kt)("inlineCode",{parentName:"p"},"?layout=...")," query string, providing either the ID of the layout or a part of the name. This string will then be mached against all available layouts for the Show Style, and the first matching will be selected. For example, for a layout called ",(0,i.kt)("inlineCode",{parentName:"p"},"Stream Deck layout"),", to open the currently active rundown's Detached Shelf use:"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"http://localhost:3000/activeRundown/studio0/shelf?layout=Stream")),(0,i.kt)("p",null,"The Detached Shelf view with a custom ",(0,i.kt)("inlineCode",{parentName:"p"},"DASHBOARD_LAYOUT")," allows displaying the Shelf on an auxiliary touch screen, tablet or a Stream Deck device. A specialized Stream Deck view will be used if the view is opened on a device with hardware characteristics matching a Stream Deck device."),(0,i.kt)("p",null,"The shelf also contains additional elements, not controlled by the Rundown View Layout. These include Buckets and the Inspector. If needed, these components can be displayed or hidden using additional url arguments:"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Query parameter"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Description"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},"Default"),(0,i.kt)("td",{parentName:"tr",align:"left"},"Display the rundown layout ","(","as selected",")",", all buckets and the inspector")),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"?display=layout,buckets,inspector")),(0,i.kt)("td",{parentName:"tr",align:"left"},"A comma-separated list of features to be displayed in the shelf")),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"?buckets=0,1,...")),(0,i.kt)("td",{parentName:"tr",align:"left"},"A comma-separated list of buckets to be displayed")))),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"display"),": Available values are: ",(0,i.kt)("inlineCode",{parentName:"li"},"layout")," ","(","for displaying the Rundown Layout",")",", ",(0,i.kt)("inlineCode",{parentName:"li"},"buckets")," ","(","for displaying the Buckets",")"," and ",(0,i.kt)("inlineCode",{parentName:"li"},"inspector")," ","(","for displaying the Inspector",")","."),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"buckets"),": The buckets can be specified as base-0 indices of the buckets as seen by the user. This means that ",(0,i.kt)("inlineCode",{parentName:"li"},"?buckets=1")," will display the second bucket as seen by the user when not filtering the buckets. This allows the user to decide which bucket is displayed on a secondary attached screen simply by reordering the buckets on their main view.")),(0,i.kt)("p",null,(0,i.kt)("em",{parentName:"p"},"Note: the Inspector is limited in scope to a particular browser window/screen, so do not expect the contents of the inspector to sync across multiple screens.")),(0,i.kt)("p",null,"For the purpose of running the system in a studio environment, there are some additional views that can be used for various purposes:"),(0,i.kt)("h3",{id:"sidebar-panel"},"Sidebar Panel"),(0,i.kt)("h4",{id:"switchboard"},"Switchboard"),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Switchboard",src:n(5202).Z,width:"744",height:"403"})),(0,i.kt)("p",null,"The Switchboard allows the producer to turn automation ",(0,i.kt)("em",{parentName:"p"},"On")," and ",(0,i.kt)("em",{parentName:"p"},"Off")," for sets of devices, as well as re-route automation control between devices - both with an active rundown and when no rundown is active in a ",(0,i.kt)("a",{parentName:"p",href:"../concepts-and-architecture#system-organization-studio-and-show-style"},"Studio"),"."),(0,i.kt)("p",null,"The Switchboard panel can be accessed from the Rundown View's right-hand Toolbar, by clicking on the Switchboard button, next to the Support panel button."),(0,i.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"Technically, the switchboard activates and deactivates Route Sets. The Route Sets are grouped by Exclusivity Group. If an Exclusivity Group contains exactly two elements with the ",(0,i.kt)("inlineCode",{parentName:"p"},"ACTIVATE_ONLY")," mode, the Route Sets will be displayed on either side of the switch. Otherwise, they will be displayed separately in a list next to an ",(0,i.kt)("em",{parentName:"p"},"Off")," position. See also ",(0,i.kt)("a",{parentName:"p",href:"../configuration/settings-view#route-sets"},"Settings \u25cf Route sets"),"."))),(0,i.kt)("h2",{id:"prompter-view"},"Prompter View"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"/prompter/:studioId")),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Prompter View",src:n(1704).Z,width:"1920",height:"1080"})),(0,i.kt)("p",null,"A fullscreen page which displays the prompter text for the currently active rundown. The prompter can be controlled and configured in various ways, see more at the ",(0,i.kt)("a",{parentName:"p",href:"prompter"},"Prompter")," documentation. If no Rundown is active in a given studio, the ",(0,i.kt)("a",{parentName:"p",href:"sofie-views#screensaver"},"Screensaver")," will be displayed."),(0,i.kt)("h2",{id:"presenter-view"},"Presenter View"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"/countdowns/:studioId/presenter")),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Presenter View",src:n(4286).Z,width:"400",height:"231"})),(0,i.kt)("p",null,"A fullscreen page, intended to be shown to the studio presenter. It displays countdown timers for the current and next items in the rundown. If no Rundown is active in a given studio, the ",(0,i.kt)("a",{parentName:"p",href:"sofie-views#screensaver"},"Screensaver")," will be shown."),(0,i.kt)("h3",{id:"presenter-view-overlay"},"Presenter View Overlay"),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Presenter View Overlay",src:n(8910).Z,width:"1471",height:"847"})),(0,i.kt)("p",null,"A fullscreen view with transparent background, intended to be shown to the studio presenter as an overlay on top of the produced PGM signal. It displays a reduced amount of the information from the regular ",(0,i.kt)("a",{parentName:"p",href:"sofie-views#presenter-view"},"Presenter screen"),": the countdown to the end of the current Part, a summary preview ","(","type and name",")"," of the next item in the Rundown and the current time of day. If no Rundown is active it will show the name of the Studio."),(0,i.kt)("h2",{id:"active-rundown-view"},"Active Rundown View"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"/activeRundown/:studioId")),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Active Rundown View",src:n(2943).Z,width:"500",height:"288"})),(0,i.kt)("p",null,"A page which automatically displays the currently active rundown. Can be useful for the producer to have on a secondary screen."),(0,i.kt)("h2",{id:"active-rundown--shelf"},"Active Rundown \u2013 Shelf"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"/activeRundown/:studioId/shelf")),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"Active Rundown Shelf",src:n(2705).Z,width:"500",height:"288"})),(0,i.kt)("p",null,"A view which automatically displays the currently active rundown, and shows the Shelf in full screen. Can be useful for the producer to have on a secondary screen."),(0,i.kt)("p",null,"A shelf layout can be selected by modifying the query string, see ",(0,i.kt)("a",{parentName:"p",href:"#shelf-layouts"},"Shelf Layouts"),"."),(0,i.kt)("h2",{id:"specific-rundown--shelf"},"Specific Rundown \u2013 Shelf"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"/rundown/:rundownId/shelf")),(0,i.kt)("p",null,"Displays the shelf in fullscreen for a rundown"),(0,i.kt)("h2",{id:"screensaver"},"Screensaver"),(0,i.kt)("p",null,"When big screen displays ","(","like Prompter and the Presenter screen",")"," do not have any meaningful content to show, an animated screensaver showing the current time and the next planned show will be displayed. If no Rundown is upcoming, the Studio name will be displayed."),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"A screensaver showing the next scheduled show",src:n(9810).Z,width:"1920",height:"1080"})),(0,i.kt)("h2",{id:"system-status"},"System Status"),(0,i.kt)("div",{className:"admonition admonition-caution alert alert--warning"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"}))),"caution")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"Documentation for this feature is yet to be written."))),(0,i.kt)("p",null,"System and devices statuses are displayed here."),(0,i.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"An API endpoint for the system status is also available under the URL ",(0,i.kt)("inlineCode",{parentName:"p"},"/health")))),(0,i.kt)("h2",{id:"media-status-view"},"Media Status View"),(0,i.kt)("div",{className:"admonition admonition-caution alert alert--warning"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"}))),"caution")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"Documentation for this feature is yet to be written."))),(0,i.kt)("p",null,"This page displays media transfer statuses."),(0,i.kt)("h2",{id:"message-queue-view"},"Message Queue View"),(0,i.kt)("div",{className:"admonition admonition-caution alert alert--warning"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"}))),"caution")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},"Documentation for this feature is yet to be written."))),(0,i.kt)("p",null,(0,i.kt)("em",{parentName:"p"},"Sofie","\xa0","Core")," can send messages to external systems ","(","such as metadata, as-run-logs",")"," while on air."),(0,i.kt)("p",null,"These messages are retained for a period of time, and can be reviewed in this list."),(0,i.kt)("p",null,"Messages that was not successfully sent can be inspected and re-sent here."),(0,i.kt)("h2",{id:"user-log-view"},"User Log View"),(0,i.kt)("p",null,"The user activity log contains a list of the user-actions that users have previously done. This is used in troubleshooting issues on-air."),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"User Log",src:n(6466).Z,width:"1126",height:"577"})),(0,i.kt)("h3",{id:"columns-explained"},"Columns, explained"),(0,i.kt)("h4",{id:"execution-time"},"Execution time"),(0,i.kt)("p",null,"The execution time column displays ",(0,i.kt)("strong",{parentName:"p"},"coreDuration")," + ",(0,i.kt)("strong",{parentName:"p"},"gatewayDuration")," ","(",(0,i.kt)("strong",{parentName:"p"},"timelineResolveDuration"),")",'":'),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"coreDuration")," : The time it took for Core to execute the command ","(","ie start-of-command \ud83e\udc3a stored-result-into-database",")"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"gatewayDuration")," : The time it took for Playout Gateway to execute the timeline ","(","ie stored-result-into-database \ud83e\udc3a timeline-resolved \ud83e\udc3a callback-to-core",")"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"timelineResolveDuration"),": The duration it took in TSR ","(","in Playout Gateway",")"," to resolve the timeline")),(0,i.kt)("p",null,"Important to note is that ",(0,i.kt)("strong",{parentName:"p"},"gatewayDuration")," begins at the exact moment ",(0,i.kt)("strong",{parentName:"p"},"coreDuration")," ends.",(0,i.kt)("br",{parentName:"p"}),"\n","So ",(0,i.kt)("strong",{parentName:"p"},"coreDuration + gatewayDuration")," is the full time it took from beginning-of-user-action to the timeline-resolved ","(","plus a little extra for the final callback for reporting the measurement",")","."),(0,i.kt)("h4",{id:"action"},"Action"),(0,i.kt)("p",null,"Describes what action the user did; e g pressed a key, clicked a button, or selected a meny item."),(0,i.kt)("h4",{id:"method"},"Method"),(0,i.kt)("p",null,"The internal name in ",(0,i.kt)("em",{parentName:"p"},"Sofie","\xa0","Core")," of what function was called"),(0,i.kt)("h4",{id:"status"},"Status"),(0,i.kt)("p",null,'The result of the operation. "Success" or an error message.'),(0,i.kt)("h2",{id:"evaluations"},"Evaluations"),(0,i.kt)("p",null,"When a broadcast is done, users can input feedback about how the show went in an evaluation form."),(0,i.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,i.kt)("div",{parentName:"div",className:"admonition-heading"},(0,i.kt)("h5",{parentName:"div"},(0,i.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,i.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,i.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,i.kt)("div",{parentName:"div",className:"admonition-content"},(0,i.kt)("p",{parentName:"div"},'Evaluations can be configured to be sent to Slack, by setting the "Slack Webhook URL" in the ',(0,i.kt)("a",{parentName:"p",href:"../configuration/settings-view"},"Settings View")," under ",(0,i.kt)("em",{parentName:"p"},"Studio"),"."))),(0,i.kt)("h2",{id:"settings-view"},"Settings View"),(0,i.kt)("p",null,"The ",(0,i.kt)("a",{parentName:"p",href:"../configuration/settings-view"},"Settings View")," is only available to users with the ",(0,i.kt)("a",{parentName:"p",href:"access-levels"},"Access Level")," set correctly."))}p.isMDXComponent=!0},3540:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/lobby-view-2e5c75722538da75e05f8bf94aaca8bd.png"},2943:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/active-rundown-example-a08e9334eb5b09385789f4c0b4d30dc4.png"},2705:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/active-rundown-shelf-example-4b59e9be5a9a69f8336b0984c2a6e9d1.png"},9810:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/next-scheduled-show-example-ece31c5cf5265476d7484489e0c0303c.png"},4286:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/presenter-screen-example-c03aacb8cb2603d40bca3c25e59b5657.png"},8910:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/presenter-screen-overlay-example-4cb0d6456ee71aa4fd097e38639ab018.png"},1704:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/prompter-example-95521a8b78dba5d16a0c4568924d2992.png"},8601:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/segment-header-2-c4865f2bc8d36c453b2e0c199b6f57cf.png"},6466:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/user-log-725ae569ce91cb88712059cecc8d47fc.png"},1214:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/freeze-frame-countdown-3e7017b0a4c21f394f4b4554fe83c4f3.png"},3339:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/rundown-divider-625a39211edfe8f98637a9ef1d522321.png"},1898:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/segment-budget-and-countdown-212b500ac989e546f0855cfaee9cf783.png"},8038:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/shelf-8b4688dc6770c4e2564a0f54c7a61345.png"},9208:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/sofie-naming-conventions-ddc95141c47ece5c6006d0e351eecfbd.png"},4669:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/storyboard-e09629bccfa5a19e480841d1994fe49d.png"},5202:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/switchboard-94799d19305991204e46d31f537962cc.png"},3718:(e,t,n)=>{n.d(t,{Z:()=>a});const a=n.p+"assets/images/take-next-dd0e83ff00607620e987c8e9af9dfcfd.png"}}]);