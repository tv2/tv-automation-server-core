"use strict";(self.webpackChunksofie_documentation=self.webpackChunksofie_documentation||[]).push([[1727],{2162:function(e,t,a){a.r(t),a.d(t,{assets:function(){return h},contentTitle:function(){return l},default:function(){return c},frontMatter:function(){return s},metadata:function(){return p},toc:function(){return d}});var n=a(2685),i=a(1244),r=(a(7378),a(5318)),o=["components"],s={sidebar_position:1},l="Concepts & Architecture",p={unversionedId:"user-guide/concepts-and-architecture",id:"version-1.37.0/user-guide/concepts-and-architecture",title:"Concepts & Architecture",description:"System Architecture",source:"@site/versioned_docs/version-1.37.0/user-guide/concepts-and-architecture.md",sourceDirName:"user-guide",slug:"/user-guide/concepts-and-architecture",permalink:"/sofie-core/docs/1.37.0/user-guide/concepts-and-architecture",editUrl:"https://github.com/nrkno/sofie-core/edit/master/packages/documentation/versioned_docs/version-1.37.0/user-guide/concepts-and-architecture.md",tags:[],version:"1.37.0",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"version-1.37.0/gettingStarted",previous:{title:"Introduction",permalink:"/sofie-core/docs/1.37.0/user-guide/intro"},next:{title:"Sofie Core: System Configuration",permalink:"/sofie-core/docs/1.37.0/user-guide/configuration/sofie-core-settings"}},h={},d=[{value:"System Architecture",id:"system-architecture",level:2},{value:"Sofie Core",id:"sofie-core",level:3},{value:"Gateways",id:"gateways",level:3},{value:"System, (Organization), Studio &amp; Show Style",id:"system-organization-studio--show-style",level:2},{value:"Playlists, Rundowns, Segments, Parts, Pieces",id:"playlists-rundowns-segments-parts-pieces",level:2},{value:"Playlist",id:"playlist",level:3},{value:"Rundown",id:"rundown",level:3},{value:"Segment",id:"segment",level:3},{value:"Part",id:"part",level:3},{value:"Piece",id:"piece",level:3},{value:"AdLib Piece",id:"adlib-piece",level:3},{value:"Views",id:"views",level:2},{value:"Blueprints",id:"blueprints",level:2},{value:"System Blueprints",id:"system-blueprints",level:3},{value:"Studio Blueprints",id:"studio-blueprints",level:3},{value:"Showstyle Blueprints",id:"showstyle-blueprints",level:3},{value:"Timeline",id:"timeline",level:2},{value:"What is the timeline?",id:"what-is-the-timeline",level:3},{value:"Why a timeline?",id:"why-a-timeline",level:3},{value:"How does it work?",id:"how-does-it-work",level:3}],m={toc:d};function c(e){var t=e.components,s=(0,i.Z)(e,o);return(0,r.kt)("wrapper",(0,n.Z)({},m,s,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"concepts--architecture"},"Concepts & Architecture"),(0,r.kt)("h2",{id:"system-architecture"},"System Architecture"),(0,r.kt)("p",null,(0,r.kt)("img",{loading:"lazy",alt:"Example of a Sofie setup with a Playout Gateway and a Spreadsheet Gateway",src:a(8858).Z,width:"827",height:"761"})),(0,r.kt)("h3",{id:"sofie-core"},"Sofie Core"),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Sofie","\xa0","Core")," is a web server which handle business logic and serves the web GUI.",(0,r.kt)("br",{parentName:"p"}),"\n","It is a ",(0,r.kt)("a",{parentName:"p",href:"https://nodejs.org/"},"NodeJS")," process backed up by a ",(0,r.kt)("a",{parentName:"p",href:"https://www.mongodb.com/"},"MongoDB")," database and based on the framework ",(0,r.kt)("a",{parentName:"p",href:"http://meteor.com/"},"Meteor"),".  "),(0,r.kt)("h3",{id:"gateways"},"Gateways"),(0,r.kt)("p",null,"Gateways are applications that connect to Sofie","\xa0","Core and and exchanges data; such as rundown data from an NRCS or the ",(0,r.kt)("a",{parentName:"p",href:"#timeline"},"Timeline")," for playout."),(0,r.kt)("p",null,"An examples of a gateways is the ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/SuperFlyTV/spreadsheet-gateway"},"Spreadsheet Gateway"),".",(0,r.kt)("br",{parentName:"p"}),"\n","All gateways use the ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/nrkno/sofie-core/tree/master/packages/server-core-integration"},"Core Integration Library")," to communicate with Core."),(0,r.kt)("h2",{id:"system-organization-studio--show-style"},"System, ","(","Organization",")",", Studio & Show Style"),(0,r.kt)("p",null,'To be able to facilitate various workflows and to Here\'s a short explanation about the differences between the "System", "Organization", "Studio" and "Show Style".'),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"The ",(0,r.kt)("strong",{parentName:"li"},"System")," defines the whole of the Sofie","\xa0","Core"),(0,r.kt)("li",{parentName:"ul"},"The ",(0,r.kt)("strong",{parentName:"li"},"Organization")," ","(","only available if user accounts are enabled",")"," defines things that are common for an organization. An organization consists of: ",(0,r.kt)("strong",{parentName:"li"},"Users, Studios")," and ",(0,r.kt)("strong",{parentName:"li"},"ShowStyles"),"."),(0,r.kt)("li",{parentName:"ul"},"The ",(0,r.kt)("strong",{parentName:"li"},"Studio"),' contains things that are related to the "hardware" or "rig". Technically, a Studio is defined as an entity that can have one ',"(","or none",")"," rundown active at any given time. In most cases, this will be a representation of your gallery, with cameras, video playback and graphics systems, external inputs, sound mixers, lighting controls and so on. A single System can easily control multiple Studios."),(0,r.kt)("li",{parentName:"ul"},"The ",(0,r.kt)("strong",{parentName:"li"},"Show Style"),' contains settings for the "show", for example if there\'s a "Morning Show" and an "Afternoon Show" - produced in the same gallery - they might be two different Show Styles ',"(","played in the same Studio",")",".")),(0,r.kt)("p",null,(0,r.kt)("img",{loading:"lazy",alt:"Sofie Architecture Venn Diagram",src:a(4323).Z,width:"554",height:"559"})),(0,r.kt)("h2",{id:"playlists-rundowns-segments-parts-pieces"},"Playlists, Rundowns, Segments, Parts, Pieces"),(0,r.kt)("p",null,(0,r.kt)("img",{loading:"lazy",alt:"Playlists, Rundowns, Segments, Parts, Pieces",src:a(6835).Z,width:"2391",height:"1713"})),(0,r.kt)("h3",{id:"playlist"},"Playlist"),(0,r.kt)("p",null,"A Playlist ","(",'or "Rundown Playlist"',")",' is the entity that "goes on air" and controls the playhead/Take Point.'),(0,r.kt)("p",null,"It contains one or several Rundowns inside, which are playout out in order."),(0,r.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},'In some many studios, there is only ever one rundown in a playlist. In those cases, we sometimes lazily refer to playlists and rundowns as "being the same thing".'))),(0,r.kt)("p",null,"A Playlist is played out in the context of it's ",(0,r.kt)("a",{parentName:"p",href:"#studio"},"Studio"),", thereby only a single Playlist can be active at a time within each Studio."),(0,r.kt)("p",null,"A playlist is normally played through and then ends but it is also possible to make looping playlists in which case the playlist will start over from the top after the last part has been played."),(0,r.kt)("h3",{id:"rundown"},"Rundown"),(0,r.kt)("p",null,"The Rundown contains the content for a show. It contains Segments and Parts, which can be selected by the user to be played out.",(0,r.kt)("br",{parentName:"p"}),"\n","A Rundown always has a ",(0,r.kt)("a",{parentName:"p",href:"#showstyle"},"showstyle")," and is played out in the context of the ",(0,r.kt)("a",{parentName:"p",href:"#studio"},"Studio")," of its Playlist."),(0,r.kt)("h3",{id:"segment"},"Segment"),(0,r.kt)("p",null,'The Segment is the horizontal line in the GUI. It is intended to be used as a "chapter" or "subject" in a rundown, where each individual playable element in the Segment is called a ',(0,r.kt)("a",{parentName:"p",href:"#part"},"Part"),"."),(0,r.kt)("h3",{id:"part"},"Part"),(0,r.kt)("p",null,"The Part is the playable element inside of a ",(0,r.kt)("a",{parentName:"p",href:"#segment"},"Segment"),". This is the thing that starts playing when the user does a ",(0,r.kt)("a",{parentName:"p",href:"#take-point"},"TAKE"),".",(0,r.kt)("br",{parentName:"p"}),"\n","The Part in itself doesn't determine what's going to happen, that's handled by the ",(0,r.kt)("a",{parentName:"p",href:"#piece"},"Pieces")," in it."),(0,r.kt)("h3",{id:"piece"},"Piece"),(0,r.kt)("p",null,"The Pieces inside of a Part determines what's going to happen, the could be indicating things like VT:s, cut to cameras, graphics, or what script the host is going to read."),(0,r.kt)("p",null,"Inside of the pieces are the ",(0,r.kt)("a",{parentName:"p",href:"#timeline-object"},"timeline-objects")," which controls the playout on a technical level."),(0,r.kt)("div",{className:"admonition admonition-tip alert alert--success"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"}))),"tip")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"Tip! If you want to manually play a certain piece ","(","for example a graphics overlay",")",", you can at any time double-click it in the GUI, and it will be copied and played at your play head, just like an ",(0,r.kt)("a",{parentName:"p",href:"#adlib-pieces"},"AdLib")," would!"))),(0,r.kt)("p",null,"See also: ",(0,r.kt)("a",{parentName:"p",href:"#showstyle"},"Showstyle")),(0,r.kt)("h3",{id:"adlib-piece"},"AdLib Piece"),(0,r.kt)("p",null,"The AdLib pieces are Pieces that isn't programmed to fire at a specific time, but instead intended to be manually triggered by the user."),(0,r.kt)("p",null,"The AdLib pieces can either come from the currently playing Part, or it could be ",(0,r.kt)("em",{parentName:"p"},"global AdLibs")," that are available throughout the show."),(0,r.kt)("p",null,"An AdLib isn't added to the Part in the GUI until it starts playing, instead you find it in the ",(0,r.kt)("a",{parentName:"p",href:"#shelf"},"Shelf"),"."),(0,r.kt)("h2",{id:"views"},"Views"),(0,r.kt)("p",null,"Being a web-based system, Sofie has a number of customisable, user-facing web ",(0,r.kt)("a",{parentName:"p",href:"features/sofie-views"},"views")," used for control and monitoring."),(0,r.kt)("h2",{id:"blueprints"},"Blueprints"),(0,r.kt)("p",null,"Blueprints are plug-ins that run in Sofie","\xa0","Core. They interpret the data coming in from the rundowns and transform them into a rich set of playable elements ","(","Segments, Parts, AdLibs etc",")","."),(0,r.kt)("p",null,"The blueprints are webpacked javascript bundles which are uploaded into Sofie via the GUI. They are custom-made and changes depending on the show style, type of input data ","(","NRCS",")"," and the types of controlled devices. A generic ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/SuperFlyTV/sofie-demo-blueprints"},"blueprint that works with spreadsheets is available here"),"."),(0,r.kt)("p",null,"When ",(0,r.kt)("a",{parentName:"p",href:"#sofie-core"},"Sofie","\xa0","Core")," calls upon a Blueprint, it returns a JavaScript object containing methods callable by Sofie","\xa0","Core. These methods will be called by Sofie","\xa0","Core in different situations, depending on the method.",(0,r.kt)("br",{parentName:"p"}),"\n","Documentation on these interfaces are available in the ",(0,r.kt)("a",{parentName:"p",href:"https://www.npmjs.com/package/tv-automation-sofie-blueprints-integration"},"Blueprints integration")," library."),(0,r.kt)("p",null,"There are 3 types of blueprints, and all 3 must be uploaded into Sofie before the system will work correctly."),(0,r.kt)("h3",{id:"system-blueprints"},"System Blueprints"),(0,r.kt)("p",null,"Handle things on the ",(0,r.kt)("em",{parentName:"p"},"System level"),".",(0,r.kt)("br",{parentName:"p"}),"\n","Documentation on the interface to be exposed by the Blueprint:",(0,r.kt)("br",{parentName:"p"}),"\n",(0,r.kt)("a",{parentName:"p",href:"https://github.com/nrkno/sofie-sofie-blueprints-integration/blob/master/src/api.ts#L52"},"https://github.com/nrkno/sofie-sofie-blueprints-integration/blob/master/src/api.ts","#","L52")),(0,r.kt)("h3",{id:"studio-blueprints"},"Studio Blueprints"),(0,r.kt)("p",null,"Handle things on the ",(0,r.kt)("em",{parentName:"p"},"Studio level"),', like "which showstyle to use for this rundown".',(0,r.kt)("br",{parentName:"p"}),"\n","Documentation on the interface to be exposed by the Blueprint:",(0,r.kt)("br",{parentName:"p"}),"\n",(0,r.kt)("a",{parentName:"p",href:"https://github.com/nrkno/sofie-sofie-blueprints-integration/blob/master/src/api.ts#L57"},"https://github.com/nrkno/sofie-sofie-blueprints-integration/blob/master/src/api.ts","#","L57")),(0,r.kt)("h3",{id:"showstyle-blueprints"},"Showstyle Blueprints"),(0,r.kt)("p",null,"Handle things on the ",(0,r.kt)("em",{parentName:"p"},"Showstyle level"),", like generating ",(0,r.kt)("a",{parentName:"p",href:"#baseline"},(0,r.kt)("em",{parentName:"a"},"Baseline")),", ",(0,r.kt)("em",{parentName:"p"},"Segments"),", ",(0,r.kt)("em",{parentName:"p"},"Parts, Pieces")," and ",(0,r.kt)("em",{parentName:"p"},"Timelines")," in a rundown.",(0,r.kt)("br",{parentName:"p"}),"\n","Documentation on the interface to be exposed by the Blueprint:",(0,r.kt)("br",{parentName:"p"}),"\n",(0,r.kt)("a",{parentName:"p",href:"https://github.com/nrkno/sofie-sofie-blueprints-integration/blob/master/src/api.ts#L72"},"https://github.com/nrkno/sofie-sofie-blueprints-integration/blob/master/src/api.ts","#","L72")),(0,r.kt)("h2",{id:"timeline"},"Timeline"),(0,r.kt)("h3",{id:"what-is-the-timeline"},"What is the timeline?"),(0,r.kt)("p",null,'The Timeline is a collection of timeline-objects, that together form a "target state", i.e. an intent on what is to be played and at what times.'),(0,r.kt)("p",null,"The timeline-objects can be programmed to contain relative references to each other, so programming things like ",(0,r.kt)("em",{parentName:"p"},'"play this thing right after this other thing"')," is as easy as ",(0,r.kt)("inlineCode",{parentName:"p"},"{start: { #otherThing.end }}")),(0,r.kt)("p",null,"The ",(0,r.kt)("a",{parentName:"p",href:"../for-developers/libraries"},"Playout Gateway")," picks up the timeline from Sofie","\xa0","Core and ","(","using the ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/nrkno/sofie-timeline-state-resolver"},"TSR timeline-state-resolver"),")"," controls the playout devices to make sure that they actually play what is intended."),(0,r.kt)("p",null,(0,r.kt)("img",{loading:"lazy",alt:"Example of 2 objects in a timeline: The #video object, destined to play at a certain time, and #gfx0, destined to start 15 seconds into the video.",src:a(6742).Z,width:"1039",height:"259"})),(0,r.kt)("h3",{id:"why-a-timeline"},"Why a timeline?"),(0,r.kt)("p",null,"The Sofie system is made to work with a modern web- and IT-based approach in mind. Therefore, the Sofie","\xa0","Core can be run either on-site, or in an off-site cloud."),(0,r.kt)("p",null,(0,r.kt)("img",{loading:"lazy",alt:"Sofie\xa0Core can run in the cloud",src:a(9271).Z,width:"686",height:"209"})),(0,r.kt)("p",null,"One drawback of running in a cloud over the public internet is the - sometimes unpredictable - latency. The Timeline overcomes this by moving all the immediate control of the playout devices to the Playout Gateway, which is intended to run on a local network, close to the hardware it controls.",(0,r.kt)("br",{parentName:"p"}),"\n","This also gives the system a simple way of load-balancing - since the number of web-clients or load on Sofie","\xa0","Core won't affect the playout."),(0,r.kt)("p",null,"Another benefit of basing the playout on a timeline is that when programming the show ","(","the blueprints",")",', you only have to care about "what you want to be on screen", you don\'t have to care about cleaning up previously played things, or what was actually played out before. Those are things that are handled by the Playout Gateway automatically. This also allows the user to jump around in a rundown freely, without the risk of things going wrong on air.'),(0,r.kt)("h3",{id:"how-does-it-work"},"How does it work?"),(0,r.kt)("div",{className:"admonition admonition-tip alert alert--success"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"}))),"tip")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"Fun tip! The timeline in itself is a ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/SuperFlyTV/supertimeline"},"separate library available on github"),"."),(0,r.kt)("p",{parentName:"div"},"You can play around with the timeline in the browser using ",(0,r.kt)("a",{parentName:"p",href:"https://jsfiddle.net/nytamin/rztp517u/"},"JSFiddle and the timeline-visualizer"),"!"))),(0,r.kt)("p",null,"The Timeline is stored by Sofie","\xa0","Core in a MongoDB collection. It is generated whenever a user does a ",(0,r.kt)("a",{parentName:"p",href:"#take-point"},"Take"),", changes the ",(0,r.kt)("a",{parentName:"p",href:"#next-point-and-lookahead"},"Next-point")," or anything else that might affect the playout."),(0,r.kt)("p",null,(0,r.kt)("em",{parentName:"p"},"Sofie","\xa0","Core")," generates the timeline using:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"The ",(0,r.kt)("a",{parentName:"li",href:"#baseline"},"Studio Baseline")," ","(","only if no rundown is currently active",")"),(0,r.kt)("li",{parentName:"ul"},"The ",(0,r.kt)("a",{parentName:"li",href:"#baseline"},"Showstyle Baseline"),", of the currently active rundown."),(0,r.kt)("li",{parentName:"ul"},"The ",(0,r.kt)("a",{parentName:"li",href:"#take-point"},"currently playing Part")),(0,r.kt)("li",{parentName:"ul"},"The ",(0,r.kt)("a",{parentName:"li",href:"#next-point-and-lookahead"},"Next:ed Part")," and Parts that come after it ","(","the ",(0,r.kt)("a",{parentName:"li",href:"#lookahead"},"Lookahead"),")"),(0,r.kt)("li",{parentName:"ul"},"Any ",(0,r.kt)("a",{parentName:"li",href:"#adlib-pieces"},"AdLibs")," the user has manually selected to play")),(0,r.kt)("p",null,"The ",(0,r.kt)("a",{parentName:"p",href:"../for-developers/libraries#gateways"},(0,r.kt)("strong",{parentName:"a"},"Playout Gateway"))," then picks up the new timeline, and pipes it into the ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/nrkno/sofie-timeline-state-resolver"},"(","TSR",")"," timeline-state-resolver")," library."),(0,r.kt)("p",null,"The TSR then..."),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Resolves the timeline, using the ",(0,r.kt)("a",{parentName:"li",href:"https://github.com/SuperFlyTV/supertimeline"},"timeline-library")),(0,r.kt)("li",{parentName:"ul"},"Calculates new target-states for each relevant point in time"),(0,r.kt)("li",{parentName:"ul"},"Maps the target-state to each playout device."),(0,r.kt)("li",{parentName:"ul"},"Compares the target-states for each device with the currently-tracked-state and.."),(0,r.kt)("li",{parentName:"ul"},"..generates commands to send to each device to account for the change."),(0,r.kt)("li",{parentName:"ul"},"The commands are then put on queue and sent to the devices at the correct time.")),(0,r.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"For more information about what playout devices the ",(0,r.kt)("em",{parentName:"p"},"TSR")," supports, and examples of the timeline-objects, see the ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/nrkno/sofie-timeline-state-resolver#timeline-state-resolver"},"README of TSR")))),(0,r.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,r.kt)("div",{parentName:"div",className:"admonition-heading"},(0,r.kt)("h5",{parentName:"div"},(0,r.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,r.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,r.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,r.kt)("div",{parentName:"div",className:"admonition-content"},(0,r.kt)("p",{parentName:"div"},"For more information about how to program timeline-objects, see the ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/SuperFlyTV/supertimeline#superfly-timeline"},"README of the timeline-library")))))}c.isMDXComponent=!0},5318:function(e,t,a){a.d(t,{Zo:function(){return h},kt:function(){return c}});var n=a(7378);function i(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function r(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function o(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?r(Object(a),!0).forEach((function(t){i(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):r(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function s(e,t){if(null==e)return{};var a,n,i=function(e,t){if(null==e)return{};var a,n,i={},r=Object.keys(e);for(n=0;n<r.length;n++)a=r[n],t.indexOf(a)>=0||(i[a]=e[a]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(n=0;n<r.length;n++)a=r[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(i[a]=e[a])}return i}var l=n.createContext({}),p=function(e){var t=n.useContext(l),a=t;return e&&(a="function"==typeof e?e(t):o(o({},t),e)),a},h=function(e){var t=p(e.components);return n.createElement(l.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var a=e.components,i=e.mdxType,r=e.originalType,l=e.parentName,h=s(e,["components","mdxType","originalType","parentName"]),m=p(a),c=i,u=m["".concat(l,".").concat(c)]||m[c]||d[c]||r;return a?n.createElement(u,o(o({ref:t},h),{},{components:a})):n.createElement(u,o({ref:t},h))}));function c(e,t){var a=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var r=a.length,o=new Array(r);o[0]=m;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:i,o[1]=s;for(var p=2;p<r;p++)o[p]=a[p];return n.createElement.apply(null,o)}return n.createElement.apply(null,a)}m.displayName="MDXCreateElement"},6835:function(e,t,a){t.Z=a.p+"assets/images/playlist-rundown-segment-part-piece-121969698d8ff1f70338aa2591a0dea5.png"},8858:function(e,t,a){t.Z=a.p+"assets/images/playout-and-spreadsheet-example-b12546e2be214cfc445edd06b67e9633.png"},4323:function(e,t,a){t.Z=a.p+"assets/images/sofie-venn-diagram-f65669f7bddbd15ccd14d007227ab776.png"},9271:function(e,t,a){t.Z=a.p+"assets/images/sofie-web-architecture-812d04b46362f24b9f1965b7a92078e1.png"},6742:function(e,t,a){t.Z=a.p+"assets/images/timeline-d1a95c05adc953f15adae8a0e3aaaf48.png"}}]);