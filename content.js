/*
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    var md = getMarkdown();

    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.msg == "getMarkdown")
      sendResponse({md: JSON.stringify(md)});
    else
      sendResponse({}); // snub them.
  }
);
*/

var options = {
        link_list:  false,          // render links as references, create link list as appendix
    //  link_near:                  // cite links immediately after blocks
        h1_setext:  false,          // underline h1 headers
        h2_setext:  false,          // underline h2 headers
        h_atx_suf:  false,          // header suffixes (###)
    //  h_compact:  true,           // compact headers (except h1)
        gfm_code:   true,           // gfm code blocks (```)
        trim_code:  false,          // trim whitespace within <pre><code> blocks (full block, not per line)
        li_bullet:  "*-+"[0],       // list item bullet style
    //  list_indnt:                 // indent top-level lists
        hr_char:    "-_*"[0],       // hr style
        indnt_str:  ["    ","\t","  "][0],  // indentation string
        bold_char:  "*_"[0],        // char used for strong
        emph_char:  "*_"[1],        // char used for em
        gfm_del:    true,           // ~~strikeout~~ for <del>strikeout</del>
        gfm_tbls:   false,          // markdown-extra tables
        tbl_edges:  false,          // show side edges on tables
        hash_lnks:  false,          // anchors w/hash hrefs as links
        br_only:    false,          // avoid using "  " as line break indicator
        col_pre:    " ",            // column prefix to use when creating missing headers for tables
        nbsp_spc:   false,          // convert &nbsp; entities in html to regular spaces
        span_tags:  true,           // output spans (ambiguous) using html tags
        div_tags:   true,           // output divs (ambiguous) using html tags
    //  comp_style: false,          // use getComputedStyle instead of hardcoded tag list to discern block/inline
        unsup_tags: {               // handling of unsupported tags, defined in terms of desired output style. if not listed, output = outerHTML
            // no output
            ignore: "script style noscript",
            // eg: "<tag>some content</tag>"
            inline: "span sup sub i u b center big",
            // eg: "\n<tag>\n\tsome content\n</tag>"
        //  block1: "",
            // eg: "\n\n<tag>\n\tsome content\n</tag>"
            block2: "div form fieldset dl header footer address article aside figure hgroup section",
            // eg: "\n<tag>some content</tag>"
            block1c: "dt dd caption legend figcaption output",
            // eg: "\n\n<tag>some content</tag>"
            block2c: "canvas audio video iframe"
        },
        tag_remap: {                // remap of variants or deprecated tags to internal classes
            "i": "em",
            "b": "strong"
        }
};      

function getMarkdown() {
    if (/qiita\.com\/.*\/items\//.test(location.href)){
        return getQiitaMd();
    }

    var sel;
    if (window.getSelection().rangeCount) {
        sel = window.getSelection().getRangeAt(0).cloneContents();
    } else {
        var frameList = document.querySelectorAll('frame');
        if (frameList.length > 0){
            for (var i = frameList.length - 1; i >= 0; i--) {
                if (frameList[i].contentWindow.getSelection().rangeCount > 0){
                    sel = frameList[i].contentWindow.getSelection().getRangeAt(0).cloneContents();
                }
            }
        } else {
            sel = document.body;
        }
    }
    
    cleanElement(sel);
    var imgs = Array.apply(null,sel.querySelectorAll('img'));
    imgs.forEach(function(img){
        img.src = img.src;
    });
    replaceImageLink(sel);

    replaceYoutubeEmbeded(sel);
    replacePre2Code(sel);
    
    // insert Div after img
    sel = insertImageDiv(sel);

    var title = document.title;
    var url = location.href;
    var reMarker = new reMarked(options);
    var markdown = reMarker.render(sel);
    markdown = creanMd(markdown);
    var ele = document.createElement("div");
    ele.innerHTML = markdown;

    //markdown = '#['+ title + '](' + url + ')\n ---- \n' + ele.innerText;
    markdown = '['+ title + '](' + url + ')\n ---- \n' + ele.innerText;

    return markdown;
}

function creanMd(md){
    console.log('creanMd() called.');
    if (/response\.jp\//.test(location.href)){
        console.log('response.jp : ');
        console.log(md);
        return md.replace(/\n\s*\*/g,'\n');
    } else {
        return md;
    }
}

function cleanElement(doc){
    removeElement(doc, '.share');
    removeElement(doc, '.sns-group');
    removeElement(doc, '.snsButton');
    removeElement(doc, '.social-share');
    removeElement(doc, '.share-box');
    removeElement(doc, '.share-inc');


    if (/diamond\.jp\/articles/.test(location.href)){
        removeElement(doc, 'div#multipage-top');
        removeElement(doc, 'div#service-menu');
        removeElement(doc, '.article-functions');
    } else if (/gsmarena\.com/.test(location.href)){
        removeElement(doc, '.article-info-line');
        removeElement(doc, '.review-pages');
        modifyGsmarena(doc);
    } else if (/talkincloud\.com/.test(location.href)){
        removeElement(doc, '.pm-node-region');
        removeElement(doc, '.intro');
    } else if (/28jzbq48apb4467a27tt52dd11a\.jp/.test(location.href)){
        // removeElement(doc, '#keni_toc_0');
        removeElement(doc, '.kanren_block');
        // removeElement(doc, '#keni_toc_33');
    } else if (/atmarkit\.co\.jp/.test(location.href)){
        removeElement(doc, '.masterSocialbutton');
    } else if (/techcrunch\.com/.test(location.href)){
        removeElement(doc, 'a.next-link');
    } else if (/businessinsider/.test(location.href)){
        removeElement(doc, '.p-post-byline');
        removeElement(doc, '.p-post-shareList');
    } else if (/carview\.yahoo\.co\.jp/.test(location.href)){
        // debugger;
        imageReplace(doc);
        var imgList = doc.querySelector('div.view-thumb');
        if (imgList != null){
            imgList = imgList.querySelectorAll('a>img');
            var imgWrapper = document.createElement('div');
            for (var i=0;i<imgList.length;i++){
                imgWrapper.appendChild(imgList[i]);
            }
            doc.appendChild(imgWrapper);
        }
        removeElement(doc, 'div.view-thumb');
        removeElement(doc, '#snsbtn');

    } else if (/response\.jp/.test(location.href)){
        removeElement(doc, '.itx-container');
        responseImageReplace(doc);
    } else if (/autoc-one\.jp/.test(location.href)){
        //removeElement(doc, '.mb10');
        removeElement(doc, '.new_article_image_list');
        removeElement(doc, '.new_pager');
        removeElement(doc, '.tar');
        removeElement(doc, '.ad_box_double');
        removeElement(doc, '.photo_loupe-loupe');
        removeElement(doc, '.mb20');
        removeElement(doc, '.mod_La15-1');
        removeElement(doc, '.mod_La15-2');      
        removeElement(doc, '.mod_La88');
        removeElement(doc, '.mod_La97');
        removeElement(doc, '.mod_La94');
        removeElement(doc, '.mod_La1-3');
        removeElement(doc, '.mod_L1-2_static');
        removeElement(doc, '.articleListBox');
        removeElement(doc, '.new_h1_bar635');
        removeElement(doc, '.articleListBox2');
        removeElement(doc, '.mod_L11-1');
        removeElement(doc, '#_popIn_recommend');

        Array.apply(null,doc.querySelectorAll('a img')).forEach(function(img){
            img.removeAttribute('title');
            img.removeAttribute('alt');
        });     

    } else if (/business\.nikkeibp\.co\.jp\/(article|atcl)/.test(location.href)){
        removeElement(doc, 'div#bookmarkBoxTop');
        removeElement(doc, 'p.pageNum');
        removeElement(doc, 'p.printBtn');
        removeElement(doc, 'div.bpbox2');
        removeElement(doc, 'div.icons');
        removeElement(doc, 'div.middle');        
    } else if (/gendai\.ismedia\.jp\/articles/.test(location.href)){
        removeElement(doc, 'div#service-menu');
        removeElement(doc, 'div#mc-upperline');
        //removeElement(doc, 'div#mp-ie');
    } else if (/www\.webcg\.net\/articles/.test(location.href)){
        removeElement(doc, 'div.body');
        removeElement(doc, 'div.sns');
        removeElement(doc, 'div.ad');
        removeElement(doc, '.next-page-title-link');
        removeElement(doc, '.pagination-block');


        // div.subtitle => h1
        var h1=document.createElement('h1');
        var subtitle=doc.querySelector('div.desc');
        h1.textContent=subtitle.textContent;
        subtitle.parentElement.insertBefore(h1,subtitle);
        subtitle.parentElement.removeChild(subtitle);

        Array.apply(null,doc.querySelectorAll('img.main-image')).forEach(function(img){
            img.src = img.src.replace('/200/','/-/');
        });     

    } else if (/itpro\.nikkeibp\.co\.jp/.test(location.href)){
        removeElement(doc, 'div.snsBtn');
        removeElement(doc, '#articleBottom');
        if (document.querySelector('header#articleHeader')!==null){
            document.querySelector('header#articleHeader:first-of-type').id="articleHeaderTop";
            removeElement(doc, 'header#articleHeader');
        }
    } else if (/toyokeizai\.net/.test(location.href)){
        removeElement(doc, 'div.title-bottom-menu.clearfix.v2');
        removeElement(doc, 'div.tools.clearfix');
        removeElement(doc, 'div.profile');
    } else if (/portal\.nifty\.com/.test(location.href)){
        removeElement(doc, 'div#ydn_ad');
    } else if (/qiita\.com/.test(location.href)){
        removeElement(doc, 'div.js-report-form');
        removeElement(doc, 'div#ydn_ad');
        removeElement(doc, 'div.col-sm-3');
        removeElement(doc, 'div.col-sm-9 > ul.list-unstyled.list-inline.itemsShowHeaderTags');
        removeElement(doc, 'div.col-sm-9 > ul.list-unstyled.list-inline.itemsShowHeaderTitle_status');
    } else if (/jbpress\.ismedia\.jp/.test(location.href)){
        removeElement(doc, 'div.upper-tools-wp');
        removeElement(doc, 'div.upper.clearfix');
        removeElement(doc, 'div.premium-info');
        removeElement(doc, 'div.common-pg');
        removeElement(doc, 'div.date-author');
        removeElement(doc, 'div.title-icons');
        removeElement(doc, 'div.left-column');
        removeElement(doc, 'div.ad-right');

    } else if (/news\.mynavi\.jp/.test(location.href)){
        removeElement(doc, 'div#ad-index-text');
        removeElement(doc, 'div.str-lyt-page-nav-06-outer-upper');
    } else if (/impress\.co\.jp/.test(location.href)){
        removeElement(doc, 'div.nav-04');
        removeElement(doc, '.social-bookmark');
        imageReplace(doc, function (src) {
			console.log('img replace:');
            return src.replace(/(\d{1,3})_[lms](\.(jpg|JPG))/, '$1_o$2');
        });

    } else if (/itmedia\.co\.jp/.test(location.href)){
        removeElement(doc, 'div#masterSocialbuttonTop');
        removeElement(doc, 'div.endlink');
        removeElement(doc, 'div#ITT');
    } else if (/ascii\.jp\/elem/.test(location.href)){
        replaceImageLinkAscii(doc);
    } else if (/hatenablog\.co/.test(location.href) ||
                /hateblo\.jp/.test(location.href) ||
                /hatelabo\.jp/.test(location.href) 
        ){
        var keywordLinks = doc.querySelectorAll('a.keyword');
        for (var i = keywordLinks.length - 1; i >= 0; i--) {
            var el = keywordLinks[i];
            el.parentNode.replaceChild(document.createTextNode(el.innerText), el);
        }
    } else if (/www\.b-otaku\.com/.test(location.href)){
        removeElement(doc, 'ins');
        removeElement(doc, 'script');
        imageReplace(doc);
    } else if (/zdnet\.com/.test(location.href)){
        removeElement(doc, '#social_bkm_wrap_bottom');
        removeElement(doc, '.ad-text');        
    } else if (/impressbm\.co\.jp/.test(location.href)){
        removeElement(doc, 'iframe');
    } else if (/amazon\.co\.jp/.test(location.href)){        
        removeElement(doc, 'div.review-comments');
        Array.apply(null,doc.querySelectorAll('i.a-icon-star>span')).forEach(function(span){
            span.innerText = span.innerText.replace(/5つ星のうち(.*)$/,'$1：');
        });                           
    } else if (/trendy\.nikkeibp\.co\.jp/.test(location.href)){
        nikkeiTrendyImageReplace(doc);
    } else if (/drumsyos\.blog\.fc2\.com/.test(location.href)){
        removeElement(doc, 'table');
        imageReplace(doc);
    } else if (/motordays\.com/.test(location.href)){
        removeElement(doc, '.bannerlist');
        imageReplace(doc, function(src){
            src=src.replace('-thumb','');
            return src;
        });
    } else if (/blog\.tinect\.jp/.test(location.href)){
        removeElement(doc, '.sns');
        removeElement(doc, '.wp_social_bookmarking_light');

    } else if (/www\.businessinsider\.com/.test(location.href)){
        removeElement(doc, 'div.post-top');
        removeElement(doc, 'div#finanzen_post_anchor');
        removeElement(doc, 'div.related-links-container');
    }


    return doc; 
}

function removeAutoPagerBreaker(doc, sel){
    Array.apply(null,doc.querySelectorAll(sel)).forEach(function(breaker){
        breaker.innerHTML = "<hr/>";
    });
}

function modifyGsmarena(doc){
    replaceImgs(doc);
    removeAutoPagerBreaker(doc, '.autoPagerS');

    function replaceImgs(doc){
        var sel = 'a[onclick*=".jpg"]';
        Array.apply(null,doc.querySelectorAll(sel)).forEach(function(link){
            var resizeWidth = '640';
            var proxyURL = 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&resize_w='+resizeWidth +'&refresh=604800&url=';
            var match = link.getAttribute('onclick').match(/"(.*)"/);
            if (!match) return;
            link.querySelector('img').src = proxyURL+'http://cdn.gsmarena.com/imgroot/' + match[1];
        });
    }
}

function removeElement(doc, sel){
    var els = Array.apply(null, doc.querySelectorAll(sel));
    els.forEach(function(el){
        el.parentNode.removeChild(el);
    });
    return doc;
}

function replaceImageLink(doc){
    var imgs = Array.apply(null, doc.querySelectorAll('img'));
    imgs.forEach(function(img){
        if (img.parentNode.tagName === 'A'){
            img.parentNode.href = img.src;
        }
    });
    return doc; 
}

function replaceYoutubeEmbeded(doc){
    var videos = Array.apply(null,doc.querySelectorAll('iframe[src*="//www.youtube.com/embed"]'));
    videos.forEach(function(v){
        if(/embed\/([\w\-]*)/.test(v.src)){
            var key = RegExp.$1;
            var link=document.createElement('a');
            link.href='https://www.youtube.com/watch?v=' + key;
            var linkText = link.cloneNode();

            var img = document.createElement('img');
            img.src='http://img.youtube.com/vi/' + key + '/0.jpg';
            link.appendChild(img);

            var linkTitle = document.createElement('h3');
            linkText.innerHTML = 'Link to Youtube';
            linkTitle.appendChild(linkText);

            v.parentElement.insertBefore(linkTitle, v);
            v.parentElement.insertBefore(link, v);
        }
    });

}

function replacePre2Code(doc){
    var pres = Array.apply(null,doc.querySelectorAll('pre'));
    pres.forEach(function(pre){
        var div = document.createElement('div');
        var code = document.createElement('code');
        div.appendChild(code);
        code.innerText = pre.innerText.replace(/^/mg,"~~~");
        pre.parentNode.replaceChild(div,pre);
    });
}

function replaceImageLinkAscii(doc){
    var xhr = new XMLHttpRequest();
    var imgs = Array.apply(null, doc.querySelectorAll('img'));
    imgs.forEach(function(img){
        if (img.parentNode.tagName === 'A' && (/img\.html$/.test(img.parentNode.href))){
            xhr.open("GET", img.parentNode.href, false);
            xhr.send(null);
            var dom = document.createElement("dom");
            dom.innerHTML = xhr.responseText;
            var imgURLRE = new RegExp(img.src.match('^.*_'));
            var domImgs = dom.getElementsByTagName('img');
            for (var i=0;i<domImgs.length;i++){
                if(imgURLRE.test(domImgs[i].src)){
                    img.src = domImgs[i].src;
                }
            }

        }
    });
    return doc; 
}

function insertImageDiv(doc) {
    var imgs = Array.apply(null, doc.querySelectorAll('img'));
    imgs.forEach(function(img){
        //img.src = proxyURL+img.src;
        var div = document.createElement('div');
        div.textContent = '';
        //img.parentNode.parentNode.insertBefore(div, img.nextSibling); 
        img.parentNode.parentNode.insertBefore(div, img.parentNode.nextSibling); 
    });     
    return doc;
}

function nikkeiTrendyImageReplace(doc) {
    var resizeWidth = '640';
    var proxyURL = 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&resize_w='+
        resizeWidth +'&refresh=604800&url=';
    
    var imgs = Array.apply(null, doc.querySelectorAll('img[src*="ph"]'));
    imgs.forEach(function(img){
        //img.src = proxyURL+encodeURIComponent(img.src);           
        img.src = proxyURL+img.src.replace('/ph','/');
        var div = document.createElement('div');
        div.textContent = '';
        //img.parentNode.parentNode.insertBefore(div, img.nextSibling); 
        img.parentNode.parentNode.insertBefore(div, img.parentNode.nextSibling); 
    });     
    imgs = Array.apply(null, doc.querySelectorAll('img[src*="_px"]'));
    imgs.forEach(function(img){
        //img.src = proxyURL+encodeURIComponent(img.src);           
        img.src = proxyURL+img.src.replace(/\?\_.*$/,'');
        var div = document.createElement('div');
        div.textContent = '';
        //img.parentNode.parentNode.insertBefore(div, img.nextSibling); 
        img.parentNode.parentNode.insertBefore(div, img.parentNode.nextSibling); 
    });     

    return doc;
}

function imageReplace(doc, srcReplaceFunc) {
    var resizeWidth = '640';
    var proxyURL = 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&resize_w='+
        resizeWidth +'&refresh=604800&url=';
    
    var imgs = Array.apply(null, doc.querySelectorAll('img'));
    imgs.forEach(function(img){
        if (typeof(srcReplaceFunc)==="function"){
            img.src = srcReplaceFunc(img.src);
            img.src = proxyURL+img.src;
        }


        var div = document.createElement('div');
        div.textContent = '';
        //img.parentNode.parentNode.insertBefore(div, img.nextSibling); 
        img.parentNode.parentNode.insertBefore(div, img.parentNode.nextSibling); 
    });     
    return doc;
}


function responseImageReplace(doc) {
    var resizeWidth = '640';
    var proxyURL = 'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&resize_w='+
        resizeWidth +'&refresh=604800&url=';
    
    var imgs = Array.apply(null, doc.querySelectorAll('img'));
    imgs.forEach(function(img){
        //img.src = proxyURL+encodeURIComponent(img.src);           
        img.src = proxyURL+img.src.replace('thumb2','thumb_h2');
        var div = document.createElement('div');
        div.textContent = '';
        //img.parentNode.parentNode.insertBefore(div, img.nextSibling); 
        img.parentNode.parentNode.insertBefore(div, img.parentNode.nextSibling); 
    });     
    return doc;
}

function createURLArea(str) {
    var ele = document.createElement("textarea");
    var deleteElement = function(e) {
        if (ele.parentElement !== null) {
            ele.parentNode.removeChild(ele);
        }
    };
    ele.id = "urltitle";
    ele.style.width = "100%";
    ele.value = str;
    document.body.insertBefore(ele, document.body.firstChild);
    ele.style.height = ele.scrollHeight + "px";
    // window.scroll(0, 0);
    ele.focus();
    ele.select();
    ele.ondblclick = deleteElement;
    ele.onkeyup = function(e) {
        if (e.keyCode == 27) {
            deleteElement();
        }
    };
    ele.oncopy = function() {
        setTimeout(deleteElement, 1);
        return true;
    };
}

function cleanMD(md, url){
    md = md.replace(/^( |\t)*/mg,'');
    md = md.replace(/^`/mg,'').replace(/`$/mg,'').replace(/~~~/mg,'\t');
    md = md.replace(/^\* *$/mg,'');
    md = md.replace(/^\d$/mg,'');
    md = md.replace(/$/,'\n\n---\n');
    md = md.replace(/^/,' ');
    md = md.replace(/# __/g, '# ');

    if (/\.impress\.co\.jp/.test(url)){
        md = md.replace(/_s\.(jpg|JPG|png|PNG|gif|GIF)/g,
                //function(){ return '.' + RegExp.$1;} 
                function(match,p1){ 
                    console.log(p1);
                    //return '.'+p1.toLowerCase();
                    return '.jpg';
                }
            );        
    } else if (/autoc-one\.jp/.test(url)){
        md = md.replace(/_[tl]\.(jpg|JPG|png|PNG|gif|GIF)/g,
                function(){ return '_o.' + RegExp.$1;}
            );
        md = md.replace(/\*\s*\[/g,'[');
    } else if (/trendy\.nikkeibp\.co\.jp/.test(url)){
        md = md.replace(/thumb_\d+_/g, '');
    } else if (/gazoo\.com\/car/.test(url)){
        md = md.replace(/\?renditionid=\d+/g, '');
    } else if (/www\.webcg\.net/.test(url)){
        md = md.replace(/\/\d+\/img_/g, '/-/img_');
    }

    return md;
}

function getQiitaMd(){
    var mdStr;
    var mdUrl = location.href+'.md';

    var xhr = new XMLHttpRequest();
    xhr.open( "GET" , mdUrl , true );

    xhr.onload = function(e){
        console.log("ajax success");
        createURLArea(modMd(xhr.response));
    };

    xhr.send();
}

function modMd(str) {
    var text  = str.replace(/\r\n|\r/g, "\n");
    var lines = text.split( '\n' );
    var outStr = '';
    var isCode = false;
 
    for ( var i = 0; i < lines.length; i++ ) {
        if (/^\`\`\`/.test(lines[i])){
            isCode = !isCode;
            continue;
        }

        if(isCode){
            lines[i] = lines[i].replace(/^/,'\t');
        }
        outStr += lines[i]+'\n';
    }
 
    return outStr;
}    

