"use strict";(self.webpackChunksofie_documentation=self.webpackChunksofie_documentation||[]).push([[7504],{5318:(e,t,a)=>{a.d(t,{Zo:()=>c,kt:()=>h});var n=a(7378);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function i(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function o(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?i(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):i(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function l(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},i=Object.keys(e);for(n=0;n<i.length;n++)a=i[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)a=i[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var s=n.createContext({}),d=function(e){var t=n.useContext(s),a=t;return e&&(a="function"==typeof e?e(t):o(o({},t),e)),a},c=function(e){var t=d(e.components);return n.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},u=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,i=e.originalType,s=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),u=d(a),h=r,m=u["".concat(s,".").concat(h)]||u[h]||p[h]||i;return a?n.createElement(m,o(o({ref:t},c),{},{components:a})):n.createElement(m,o({ref:t},c))}));function h(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=a.length,o=new Array(i);o[0]=u;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:r,o[1]=l;for(var d=2;d<i;d++)o[d]=a[d];return n.createElement.apply(null,o)}return n.createElement.apply(null,a)}u.displayName="MDXCreateElement"},1617:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>s,contentTitle:()=>o,default:()=>p,frontMatter:()=>i,metadata:()=>l,toc:()=>d});var n=a(5773),r=(a(7378),a(5318));const i={description:"Sofie specific fork of CasparCG&nbsp;Server 2.1"},o="Installing CasparCG&nbsp;Server for Sofie",l={unversionedId:"user-guide/installation/installing-connections-and-additional-hardware/casparcg-server-installation",id:"version-1.37.0/user-guide/installation/installing-connections-and-additional-hardware/casparcg-server-installation",title:"Installing CasparCG&nbsp;Server for Sofie",description:"Sofie specific fork of CasparCG&nbsp;Server 2.1",source:"@site/versioned_docs/version-1.37.0/user-guide/installation/installing-connections-and-additional-hardware/casparcg-server-installation.md",sourceDirName:"user-guide/installation/installing-connections-and-additional-hardware",slug:"/user-guide/installation/installing-connections-and-additional-hardware/casparcg-server-installation",permalink:"/sofie-core/docs/1.37.0/user-guide/installation/installing-connections-and-additional-hardware/casparcg-server-installation",draft:!1,editUrl:"https://github.com/nrkno/sofie-core/edit/master/packages/documentation/versioned_docs/version-1.37.0/user-guide/installation/installing-connections-and-additional-hardware/casparcg-server-installation.md",tags:[],version:"1.37.0",frontMatter:{description:"Sofie specific fork of CasparCG&nbsp;Server 2.1"},sidebar:"version-1.37.0/gettingStarted",previous:{title:"Additional Software & Hardware",permalink:"/sofie-core/docs/1.37.0/user-guide/installation/installing-connections-and-additional-hardware/"},next:{title:"Adding FFmpeg and FFprobe to your PATH on Windows",permalink:"/sofie-core/docs/1.37.0/user-guide/installation/installing-connections-and-additional-hardware/ffmpeg-installation"}},s={},d=[{value:"Installing the CasparCG\xa0Server",id:"installing-the-casparcgserver",level:2},{value:"Installing CasparCG Media Scanner",id:"installing-casparcg-media-scanner",level:3},{value:"Installing the CasparCG Launcher",id:"installing-the-casparcg-launcher",level:3},{value:"Configuring Windows",id:"configuring-windows",level:2},{value:"Required Software",id:"required-software",level:3},{value:"Hardware Recommendations",id:"hardware-recommendations",level:2},{value:"DeckLink Cards",id:"decklink-cards",level:3},{value:"Hardware-specific Configurations",id:"hardware-specific-configurations",level:2},{value:"Preview Only (Basic)",id:"preview-only-basic",level:3},{value:"Required Hardware",id:"required-hardware",level:4},{value:"Configuration",id:"configuration",level:4},{value:"Single DeckLink Card (Production Minimum)",id:"single-decklink-card-production-minimum",level:3},{value:"Required Hardware",id:"required-hardware-1",level:4},{value:"Configuration",id:"configuration-1",level:4},{value:"Multiple DeckLink Cards (Recommended Production Setup)",id:"multiple-decklink-cards-recommended-production-setup",level:3},{value:"Required Hardware",id:"required-hardware-2",level:4},{value:"Validating the Configuration File",id:"validating-the-configuration-file",level:3},{value:"Launching the Server",id:"launching-the-server",level:3},{value:"Connecting Sofie to the CasparCG\xa0Server",id:"connecting-sofie-to-the-casparcgserver",level:2},{value:"Further Reading",id:"further-reading",level:2}],c={toc:d};function p(e){let{components:t,...i}=e;return(0,r.kt)("wrapper",(0,n.Z)({},c,i,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"installing-casparcgserver-for-sofie"},"Installing CasparCG","\xa0","Server for Sofie"),(0,r.kt)("p",null,"Although CasparCG","\xa0","Server is an open source program that is free to use for both personal and cooperate applications, the hardware needed to create and execute high quality graphics is not. You can get a preview running without any additional hardware but, it is not recommended to use CasparCG","\xa0","Server for production in this manner. To begin, you will install the CasparCG","\xa0","Server on your machine then add the additional configuration needed for your setup of choice."),(0,r.kt)("h2",{id:"installing-the-casparcgserver"},"Installing the CasparCG","\xa0","Server"),(0,r.kt)("p",null,"To begin, download the latest release of ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/nrkno/sofie-casparcg-server/releases"},"CasparCG","\xa0","Server from GitHub"),". There are multiple versions of CasparCG","\xa0","Server available to the public for download but, you specifically want the latest NRK version."),(0,r.kt)("p",null,"Once downloaded, extract the files and navigate down the folders, ",(0,r.kt)("em",{parentName:"p"},"CasparCG","\xa0","Server")," then ",(0,r.kt)("em",{parentName:"p"},"Server"),". This folder contains your CasparCG","\xa0","Server Configuration file, ",(0,r.kt)("inlineCode",{parentName:"p"},"casparcg.config"),", and your CasparCG","\xa0","Server executable, ",(0,r.kt)("inlineCode",{parentName:"p"},"casparcg.exe"),"."),(0,r.kt)("p",null,"How you will configure the CasparCG","\xa0","Server will depend on the number of DeckLink cards your machine contains. The first subsection for each CasparCG","\xa0","Server setup, labeled ",(0,r.kt)("em",{parentName:"p"},"Channels"),", will contain the unique portion of the configuration. The following is the majority of the configuration file that will be consistent between setups."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-markup"},'<?xml version="1.0" encoding="utf-8"?>\n<configuration>\n  <log-level>debug</log-level>\n  <thumbnails>\n    <generate-thumbnails>false</generate-thumbnails>\n  </thumbnails>\n  \x3c!-- Paths to the Server Media --\x3e\n  \x3c!-- Currently set to the same folder as this file --\x3e\n  <paths>\n    <media-path>media/</media-path>\n    <log-path>log/</log-path>\n    <data-path>data/</data-path>\n    <template-path>template/</template-path>\n    <thumbnail-path>thumbnail/</thumbnail-path>\n    <font-path>font/</font-path>\n  </paths>\n  <lock-clear-phrase>secret</lock-clear-phrase>\n  <channels>\n    \x3c!-- Unique portion of the configuration --\x3e\n  </channels>\n  <controllers>\n    <tcp>\n      <port>5250</port>\n      <protocol>AMCP</protocol>\n    </tcp>\n  <tcp>\n    <port>3250</port>\n    <protocol>LOG</protocol>\n  </tcp>\n  </controllers>\n</configuration>\n')),(0,r.kt)("p",null,"One additional note, the Server does require the configuration file be named ",(0,r.kt)("inlineCode",{parentName:"p"},"casparcg.config"),"."),(0,r.kt)("h3",{id:"installing-casparcg-media-scanner"},"Installing CasparCG Media Scanner"),(0,r.kt)("p",null,"You can use the CasparCG Media Scanner to locate and add all of your media to the ",(0,r.kt)("em",{parentName:"p"},"Sofie","\xa0","Core"),". To install the Media Scanner, you will go to the ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/nrkno/sofie-media-scanner/releases"},"project's Release page")," and download the ",(0,r.kt)("inlineCode",{parentName:"p"},".zip")," file under the latest release. Similar to the CasparCG","\xa0","Server, you want to use the NRK version."),(0,r.kt)("p",null,"Once downloaded and extracted, move the ",(0,r.kt)("inlineCode",{parentName:"p"},"scanner.exe")," file to the same folder as your ",(0,r.kt)("inlineCode",{parentName:"p"},"casparcg.exe")," file."),(0,r.kt)("h3",{id:"installing-the-casparcg-launcher"},"Installing the CasparCG Launcher"),(0,r.kt)("p",null,"You can launch both of your CasparCG applications with the",(0,r.kt)("a",{parentName:"p",href:"https://github.com/nrkno/sofie-casparcg-launcher"}," CasparCG Launcher.")," Download the ",(0,r.kt)("inlineCode",{parentName:"p"},".exe")," file in the latest release and once complete, move the file to the same folder as your ",(0,r.kt)("inlineCode",{parentName:"p"},"casparcg.exe")," file."),(0,r.kt)("h2",{id:"configuring-windows"},"Configuring Windows"),(0,r.kt)("h3",{id:"required-software"},"Required Software"),(0,r.kt)("p",null,"Windows will require you install ",(0,r.kt)("a",{parentName:"p",href:"https://www.microsoft.com/en-us/download/details.aspx?id=52685"},"Microsoft's Visual C++ 2015 Redistributable")," to run the CasparCG","\xa0","Server properly. Before downloading the redistributable, please ensure it is not already installed on your system. Open your programs list and in the popup window, you can search for ",(0,r.kt)("em",{parentName:"p"},"C++")," in the search field. If ",(0,r.kt)("em",{parentName:"p"},"Visual C++ 2015")," appears, you do not need install the redistributable."),(0,r.kt)("p",null,"If you need to install redistributable then, navigate to ",(0,r.kt)("a",{parentName:"p",href:"https://www.microsoft.com/en-us/download/details.aspx?id=52685"},"Microsoft's website")," and download it from there. Once downloaded, you can run the ",(0,r.kt)("inlineCode",{parentName:"p"},".exe")," file and follow the prompts."),(0,r.kt)("h2",{id:"hardware-recommendations"},"Hardware Recommendations"),(0,r.kt)("p",null,"Although CasparCG","\xa0","Server can be run on some lower end hardware, it is only recommended to do so for non-production uses. Below is a table of the minimum and preferred specs depending on what type of system you are using."),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:"left"},"System Type"),(0,r.kt)("th",{parentName:"tr",align:"left"},"Min CPU"),(0,r.kt)("th",{parentName:"tr",align:"left"},"Pref CPU"),(0,r.kt)("th",{parentName:"tr",align:"left"},"Min GPU"),(0,r.kt)("th",{parentName:"tr",align:"left"},"Pref GPU"),(0,r.kt)("th",{parentName:"tr",align:"left"},"Min Storage"),(0,r.kt)("th",{parentName:"tr",align:"left"},"Pref Storage"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:"left"},"Development"),(0,r.kt)("td",{parentName:"tr",align:"left"},"i5 Gen 6i7 Gen 6"),(0,r.kt)("td",{parentName:"tr",align:"left"},"GTX 1050"),(0,r.kt)("td",{parentName:"tr",align:"left"},"GTX 1060"),(0,r.kt)("td",{parentName:"tr",align:"left"},"GTX 1060"),(0,r.kt)("td",{parentName:"tr",align:"left"},"NVMe SSD 500gb"),(0,r.kt)("td",{parentName:"tr",align:"left"})),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:"left"},"Prod, 1 Card"),(0,r.kt)("td",{parentName:"tr",align:"left"},"i7 Gen 6"),(0,r.kt)("td",{parentName:"tr",align:"left"},"i7 Gen 7"),(0,r.kt)("td",{parentName:"tr",align:"left"},"GTX 1060"),(0,r.kt)("td",{parentName:"tr",align:"left"},"GTX 1070"),(0,r.kt)("td",{parentName:"tr",align:"left"},"NVMe SSD 500gb"),(0,r.kt)("td",{parentName:"tr",align:"left"},"NVMe SSD 500gb")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:"left"},"Prod, 2 Cards"),(0,r.kt)("td",{parentName:"tr",align:"left"},"i9 Gen 8"),(0,r.kt)("td",{parentName:"tr",align:"left"},"i9 Gen 10 Extreme Edition"),(0,r.kt)("td",{parentName:"tr",align:"left"},"RTX 2070"),(0,r.kt)("td",{parentName:"tr",align:"left"},"Quadro P4000"),(0,r.kt)("td",{parentName:"tr",align:"left"},"Dual Drives"),(0,r.kt)("td",{parentName:"tr",align:"left"},"Dual Drives")))),(0,r.kt)("p",null,"For ",(0,r.kt)("em",{parentName:"p"},"dual drives"),", it is recommended to use a smaller 250gb NVMe SSD for the operating system. Then a faster 1tb NVMe SSD for the CasparCG","\xa0","Server and media. It is also recommended to buy a drive with about 40% storage overhead. This is for SSD p",(0,r.kt)("del",{parentName:"p"},"e"),"rformance reasons and Sofie will warn you about this if your drive usage exceeds 60%."),(0,r.kt)("h3",{id:"decklink-cards"},"DeckLink Cards"),(0,r.kt)("p",null,"There are a few SDI cards made by Blackmagic Design that are supported by CasparCG. The base model, with four bi-directional input and outputs, is the ",(0,r.kt)("a",{parentName:"p",href:"https://www.blackmagicdesign.com/products/decklink/techspecs/W-DLK-31"},"Duo 2"),". If you need additional channels, use the",(0,r.kt)("a",{parentName:"p",href:"https://www.blackmagicdesign.com/products/decklink/techspecs/W-DLK-30"}," Quad 4")," which supports eight bi-directional inputs and outputs. Be aware the BNC connections are not the standard BNC type. B&H offers ",(0,r.kt)("a",{parentName:"p",href:"https://www.bhphotovideo.com/c/product/1462647-REG/canare_cal33mb018_mini_rg59_12g_sdi_4k.html"},"Mini BNC to BNC connecters"),". Finally, for 4k support, use the ",(0,r.kt)("a",{parentName:"p",href:"https://www.blackmagicdesign.com/products/decklink/techspecs/W-DLK-34"},"8K Pro")," which has four bi-directional BNC connections and one reference connection."),(0,r.kt)("p",null,"Here is the Blackmagic Design PDF for ",(0,r.kt)("a",{parentName:"p",href:"https://documents.blackmagicdesign.com/UserManuals/DesktopVideoManual.pdf"},"installing your DeckLink card ","("," Desktop Video Device ",")",".")),(0,r.kt)("p",null,"Once the card in installed in your machine, you will need to download the controller from Blackmagic's website. Navigate to ",(0,r.kt)("a",{parentName:"p",href:"https://www.blackmagicdesign.com/support/family/capture-and-playback"},"this support page"),", it will only display Desktop Video Support, and in the ",(0,r.kt)("em",{parentName:"p"},"Latest Downloads")," column download the most recent version of ",(0,r.kt)("em",{parentName:"p"},"Desktop Video"),". Before installing, save your work because Blackmagic's installers will force you to restart your machine."),(0,r.kt)("p",null,"Once booted back up, you should be able to launch the Desktop Video application and see your DeckLink card."),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"Blackmagic Design&#39;s Desktop Video Application",src:a(3838).Z,width:"958",height:"1008"})),(0,r.kt)("p",null,"Click the icon in the center of the screen to open the setup window. Each production situation will very in frame rate and resolution so go through the settings and set what you know. Most things are set to standards based on your region so the default option will most likely be correct."),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"Desktop Video Settings",src:a(9306).Z,width:"958",height:"1008"})),(0,r.kt)("p",null,"If you chose a DeckLink Duo, then you will also need to set SDI connectors one and two to be your outputs."),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"DeckLink Duo SDI Output Settings",src:a(9775).Z,width:"802",height:"742"})),(0,r.kt)("h2",{id:"hardware-specific-configurations"},"Hardware-specific Configurations"),(0,r.kt)("h3",{id:"preview-only-basic"},"Preview Only ","(","Basic",")"),(0,r.kt)("p",null,"A preview only version of CasparCG","\xa0","Server does not lack any of the features of a production version. It is called a ",(0,r.kt)("em",{parentName:"p"},"preview only")," version because the standard outputs on a computer, without a DeckLink card, do not meet the requirements of a high quality broadcast graphics machine. It is perfectly suitable for development though."),(0,r.kt)("h4",{id:"required-hardware"},"Required Hardware"),(0,r.kt)("p",null,"No additional hardware is required, just the computer you have been using to follow this guide."),(0,r.kt)("h4",{id:"configuration"},"Configuration"),(0,r.kt)("p",null,"The default configuration will give you one preview window. No additional changes need to be made."),(0,r.kt)("h3",{id:"single-decklink-card-production-minimum"},"Single DeckLink Card ","(","Production Minimum",")"),(0,r.kt)("h4",{id:"required-hardware-1"},"Required Hardware"),(0,r.kt)("p",null,"To be production ready, you will need to output an SDI or HDMI signal from your production machine. CasparCG","\xa0","Server supports Blackmagic Design's DeckLink cards because they provide a key generator which will aid in keeping the alpha and fill channels of your graphics in sync. Please review the ",(0,r.kt)("a",{parentName:"p",href:"casparcg-server-installation#decklink-cards"},"DeckLink Cards")," section of this page to choose which card will best fit your production needs."),(0,r.kt)("h4",{id:"configuration-1"},"Configuration"),(0,r.kt)("p",null,"You will need to add an additional consumer to your",(0,r.kt)("inlineCode",{parentName:"p"},"caspar.config")," file to output from your DeckLink card. After the screen consumer, add your new DeckLink consumer like so."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-markup"},"<channels>\n  <channel>\n    <video-mode>1080i5000</video-mode>\n    <channel-layout>stereo</channel-layout>\n    <consumers>\n      <screen>\n        <device>1</device>\n        <windowed>true</windowed>\n      </screen>\n      <system-audio></system-audio>\n      \x3c!-- New DeckLink Consumer Start --\x3e\n      <decklink>\n        <device>1</device>\n        <key-device>1</key-device>\n        <embedded-audio>true</embedded-audio>\n        <channel-layout>stereo</channel-layout>\n        <latency>normal</latency>\n        <keyer>external_separate_device</keyer>\n        <key-only>false</key-only>\n        <buffer-depth>3</buffer-depth>\n      </decklink>\n      \x3c!-- DeckLink Consumer End --\x3e\n    </consumers>\n  </channel>\n</channels>\n")),(0,r.kt)("p",null,"You may no longer need the screen consumer. If so, you can remove it and all of it's contents. This will dramatically improve overall performance."),(0,r.kt)("h3",{id:"multiple-decklink-cards-recommended-production-setup"},"Multiple DeckLink Cards ","(","Recommended Production Setup",")"),(0,r.kt)("h4",{id:"required-hardware-2"},"Required Hardware"),(0,r.kt)("p",null,"For a preferred production setup you want a minimum of two DeckLink Duo 2 cards. This is so you can use one card to preview your media, while your second card will support the program video and audio feeds. For CasparCG","\xa0","Server to recognize both cards, you need to add two additional channels to the ",(0,r.kt)("inlineCode",{parentName:"p"},"caspar.config")," file."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-markup"},"<channels>\n  <channel>\n    <video-mode>1080i5000</video-mode>\n    <channel-layout>stereo</channel-layout>\n    <consumers>\n      <screen>\n        <device>1</device>\n        <windowed>true</windowed>\n      </screen>\n      <system-audio></system-audio>\n      \x3c!-- New Preview DeckLink Consumer Start --\x3e\n      <decklink>\n        <device>1</device>\n        <key-device>1</key-device>\n        <embedded-audio>true</embedded-audio>\n        <channel-layout>stereo</channel-layout>\n        <latency>normal</latency>\n        <keyer>external_separate_device</keyer>\n        <key-only>false</key-only>\n        <buffer-depth>3</buffer-depth>\n      </decklink>\n      \x3c!-- Preview DeckLink Consumer End --\x3e\n      \x3c!-- New Program DeckLink Consumer Start --\x3e\n      <decklink>\n        <device>2</device>\n        <key-device>2</key-device>\n        <embedded-audio>true</embedded-audio>\n        <channel-layout>stereo</channel-layout>\n        <latency>normal</latency>\n        <keyer>external_separate_device</keyer>\n        <key-only>false</key-only>\n        <buffer-depth>3</buffer-depth>\n      </decklink>\n      \x3c!-- Program DeckLink Consumer End --\x3e\n    </consumers>\n  </channel>\n</channels>\n")),(0,r.kt)("h3",{id:"validating-the-configuration-file"},"Validating the Configuration File"),(0,r.kt)("p",null,"Once you have setup the configuration file, you can use an online validator to check and make sure it is setup correctly. Navigate to the ",(0,r.kt)("a",{parentName:"p",href:"https://casparcg.net/validator/"},"CasparCG","\xa0","Server Config Validator")," and paste in your entire configuration file. If there are any errors, they will be displayed at the bottom of the page."),(0,r.kt)("h3",{id:"launching-the-server"},"Launching the Server"),(0,r.kt)("p",null,"Launching the Server is the same for each hardware setup. This means you can run",(0,r.kt)("inlineCode",{parentName:"p"},"casparcg-launcher.exe")," and the server and media scanner will start. There will be two additional warning from Windows. The first is about the EXE file and can be bypassed by selecting ",(0,r.kt)("em",{parentName:"p"},"Advanced")," and then ",(0,r.kt)("em",{parentName:"p"},"Run Anyways"),". The second menu will be about CasparCG","\xa0","Server attempting to access your firewall. You will need to allow access."),(0,r.kt)("p",null,"A window will open and display the status for the server and scanner. You can start, stop, and/or restart the server from here if needed. An additional window should have opened as well. This is the main output of your CasparCG","\xa0","Server and will contain nothing but a black background for now. If you have a DeckLink card installed, its output will also be black."),(0,r.kt)("h2",{id:"connecting-sofie-to-the-casparcgserver"},"Connecting Sofie to the CasparCG","\xa0","Server"),(0,r.kt)("p",null,"Now that your CasparCG","\xa0","Server software is running, you can connect it to the ",(0,r.kt)("em",{parentName:"p"},"Sofie","\xa0","Core"),". Navigate back to the ",(0,r.kt)("em",{parentName:"p"},"Settings page")," and in the menu, select the ",(0,r.kt)("em",{parentName:"p"},"Playout Gateway"),". If the ",(0,r.kt)("em",{parentName:"p"},"Playout Gateway's")," status does not read ",(0,r.kt)("em",{parentName:"p"},"Good"),", then please review the ",(0,r.kt)("a",{parentName:"p",href:"../installing-a-gateway/playout-gateway"},"Installing and Setting up the Playout Gateway")," section of this guide."),(0,r.kt)("p",null,"Under the Sub Devices section, you can add a new device with the ",(0,r.kt)("em",{parentName:"p"},"+")," button. Then select the pencil ","("," edit ",")"," icon on the new device to open the sub device's settings. Select the ",(0,r.kt)("em",{parentName:"p"},"Device Type")," option and choose ",(0,r.kt)("em",{parentName:"p"},"CasparCG")," from the drop down menu. Some additional fields will be added to the form."),(0,r.kt)("p",null,"The ",(0,r.kt)("em",{parentName:"p"},"Host")," and ",(0,r.kt)("em",{parentName:"p"},"Launcher Host")," fields will be ",(0,r.kt)("em",{parentName:"p"},"localhost"),". The ",(0,r.kt)("em",{parentName:"p"},"Port")," will be CasparCG's TCP port responsible for handling the AMCP commands. It defaults to 5052 in the ",(0,r.kt)("inlineCode",{parentName:"p"},"casparcg.config")," file. The ",(0,r.kt)("em",{parentName:"p"},"Launcher Port")," will be the CasparCG Launcher's port for handling HTTP requests. It will default to 8005 and can be changed in the ",(0,r.kt)("em",{parentName:"p"},"Launcher's settings page"),". Once all four fields are filled out, you can click the check mark to save the device."),(0,r.kt)("p",null,"In the ",(0,r.kt)("em",{parentName:"p"},"Attached Sub Devices")," section, you should now see the status of the CasparCG","\xa0","Server. You may need to restart the Playout Gateway if the status is ",(0,r.kt)("em",{parentName:"p"},"Bad"),"."),(0,r.kt)("h2",{id:"further-reading"},"Further Reading"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://github.com/nrkno/sofie-casparcg-server/releases"},"CasparCG","\xa0","Server Releases")," on GitHub."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://github.com/nrkno/sofie-media-scanner/releases"},"Media Scanner Releases")," on GitHub."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://github.com/nrkno/sofie-casparcg-launcher"},"CasparCG Launcher")," on GitHub."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://www.microsoft.com/en-us/download/details.aspx?id=52685"},"Microsoft Visual C++ 2015 Redistributable")," on Microsoft's website."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://www.blackmagicdesign.com/products/decklink/models"},"Blackmagic Design's DeckLink Cards")," on Blackmagic's website. Check the ",(0,r.kt)("a",{parentName:"li",href:"casparcg-server-installation#decklink-cards"},"DeckLink cards")," section for compatibility."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://documents.blackmagicdesign.com/UserManuals/DesktopVideoManual.pdf"},"Installing a DeckLink Card")," as a PDF."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://www.blackmagicdesign.com/support/family/capture-and-playback"},"Desktop Video Download Page")," on Blackmagic's website."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://casparcg.net/validator/"},"CasparCG Configuration Validator"))))}p.isMDXComponent=!0},9775:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/decklink_duo_card-1efdcf5cbad3aa6b5088557aa7a5816f.png"},9306:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/desktop-video-settings-a0b5ad448d11898eb80278cbee9593ca.png"},3838:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/desktop-video-79ce70517cb2ffa4a86e1c723bcca18e.png"}}]);